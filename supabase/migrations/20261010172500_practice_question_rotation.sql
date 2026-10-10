-- Reduce excessive repetition between practice sessions.
-- Non-destructive: replaces only the question-selection function.

create or replace function public.next_question(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  s public.learning_sessions;
  q public.questions;
  uid uuid:=auth.uid();
  roll float:=random();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into s
  from public.learning_sessions
  where id=p_session and user_id=uid
  for update;

  if not found then raise exception 'NOT_FOUND'; end if;
  if s.finished_at is not null then return null; end if;

  if s.answered>=s.target or s.expires_at<=now() then
    update public.learning_sessions
      set finished_at=now()
      where id=s.id;
    return null;
  end if;

  if s.current_question_id is not null then
    select * into q
    from public.questions
    where id=s.current_question_id;
  else
    select qs.* into q
    from public.questions qs
    left join public.topic_mastery m
      on m.topic_id=qs.topic_id and m.user_id=uid
    left join public.review_queue r
      on r.question_id=qs.id and r.user_id=uid
    left join lateral (
      select
        count(*)::integer as times_seen,
        max(a.created_at) as last_seen
      from public.question_attempts a
      where a.user_id=uid and a.question_id=qs.id
    ) history on true
    where qs.status='published'
      and (s.subject_id is null or qs.subject_id=s.subject_id)
      and (s.topic_id is null or qs.topic_id=s.topic_id)
      and not exists(
        select 1
        from public.question_attempts a
        where a.session_id=s.id and a.question_id=qs.id
      )
      and (
        s.mode<>'review'
        or exists(
          select 1
          from public.question_attempts a
          where a.user_id=uid
            and a.question_id=qs.id
            and not a.correct
            and (s.review_source is null or a.session_id=s.review_source)
        )
      )
    order by
      -- Prefer questions never seen by this learner.
      case when coalesce(history.times_seen,0)=0 then 0 else 1 end,

      -- Strongly push recent repeats to the back.
      case
        when history.last_seen > now()-interval '24 hours' then 3
        when history.last_seen > now()-interval '7 days' then 2
        when history.last_seen > now()-interval '30 days' then 1
        else 0
      end,

      -- Keep adaptive targeting inside each rotation bucket.
      (
        abs(
          qs.difficulty*10
          - coalesce(
              m.score,
              case
                when s.mode='diagnostic' then 50
                else (
                  select case level
                    when 'advanced' then 80
                    when 'initial' then 25
                    else 50
                  end
                  from public.profiles
                  where id=uid
                )
              end
            )
        )
        + case
            when roll<0.6 then coalesce(m.score,50)*0.3
            when roll<0.85 and r.next_review<=now() then -100
            when roll>=0.85 then -coalesce(m.score,50)*0.4
            else 0
          end
      ),

      history.last_seen asc nulls first,
      random()
    limit 1;

    if q.id is null then
      update public.learning_sessions
        set finished_at=now()
        where id=s.id;
      return null;
    end if;

    update public.learning_sessions
      set current_question_id=q.id,
          question_served_at=now(),
          hint_used=false
      where id=s.id;
  end if;

  return to_jsonb(q)-'fingerprint';
end
$$;

revoke all on function public.next_question(uuid) from public, anon;
grant execute on function public.next_question(uuid) to authenticated;
