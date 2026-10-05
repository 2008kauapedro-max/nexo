-- Revision from adversarial review: scoped retries, answer secrecy, bounded sessions.
alter table public.learning_sessions add column review_source uuid references public.learning_sessions(id) on delete set null;
create index sessions_review_source_idx on public.learning_sessions(review_source);
create or replace function public.next_question(p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.learning_sessions; q public.questions; uid uuid:=auth.uid(); roll float:=random(); begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into s from public.learning_sessions where id=p_session and user_id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if s.finished_at is not null then return null; end if;
 if s.answered>=s.target or s.expires_at<=now() then update public.learning_sessions set finished_at=now() where id=s.id; return null; end if;
 if s.current_question_id is not null then select * into q from public.questions where id=s.current_question_id;
 else
 select qs.* into q from public.questions qs
 left join public.topic_mastery m on m.topic_id=qs.topic_id and m.user_id=uid
 left join public.review_queue r on r.question_id=qs.id and r.user_id=uid
 where qs.status='published' and (s.subject_id is null or qs.subject_id=s.subject_id) and (s.topic_id is null or qs.topic_id=s.topic_id)
 and not exists(select 1 from public.question_attempts a where a.session_id=s.id and a.question_id=qs.id)
 and (s.mode<>'review' or exists(select 1 from public.question_attempts a where a.user_id=uid and a.question_id=qs.id and not a.correct and (s.review_source is null or a.session_id=s.review_source)))
 order by
 case when qs.id in (select question_id from public.question_attempts where user_id=uid order by created_at desc limit 12) then 100 else 0 end +
 abs(qs.difficulty*10-coalesce(m.score,case when s.mode='diagnostic' then 50 else (select case level when 'advanced' then 80 when 'initial' then 25 else 50 end from public.profiles where id=uid) end)) +
 case when roll<0.6 then coalesce(m.score,50)*0.3 when roll<0.85 and r.next_review<=now() then -100 when roll>=0.85 then -coalesce(m.score,50)*0.4 else 0 end,
 qs.id limit 1;
 if q.id is null then update public.learning_sessions set finished_at=now() where id=s.id; return null; end if;
 update public.learning_sessions set current_question_id=q.id,question_served_at=now(),hint_used=false where id=s.id;
 end if;
 return to_jsonb(q)-'fingerprint';
end $$;
create or replace function public.ai_context(p_question uuid,p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.learning_sessions; begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into s from public.learning_sessions where id=p_session and user_id=uid;
 if not found or (s.mode='simulation' and s.finished_at is null) then raise exception 'FORBIDDEN'; end if;
 if s.current_question_id is distinct from p_question and not exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then raise exception 'FORBIDDEN'; end if;
 update public.learning_sessions set hint_used=true where id=s.id and current_question_id=p_question;
 return (select to_jsonb(q)||jsonb_build_object('answer',case when exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then a.answer end,'explanation',case when exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then a.explanation end,'selected',(select selected from public.question_attempts where session_id=p_session and question_id=p_question),'mastery',(select score from public.topic_mastery where user_id=uid and topic_id=q.topic_id)) from public.questions q join private.question_answers a on a.question_id=q.id where q.id=p_question);
end $$;
create function public.review_session(p_source uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare source public.learning_sessions;sid uuid;begin
 select * into source from public.learning_sessions where id=p_source and user_id=auth.uid() and finished_at is not null;
 if not found then raise exception 'NOT_FOUND';end if;
 sid:=public.start_session('review',source.subject_id,source.topic_id,least(20,greatest(5,source.answered-source.correct)),30);
 update public.learning_sessions set review_source=p_source where id=sid;return sid;
end $$;
revoke all on function public.review_session(uuid) from public,anon;
grant execute on function public.review_session(uuid) to authenticated;
create policy deny_client_access on private.admins as restrictive for all to anon,authenticated using(false) with check(false);
create policy deny_client_access on private.question_answers as restrictive for all to anon,authenticated using(false) with check(false);
create policy deny_client_access on private.audit_logs as restrictive for all to anon,authenticated using(false) with check(false);
create policy deny_client_access on private.billing_events as restrictive for all to anon,authenticated using(false) with check(false);
