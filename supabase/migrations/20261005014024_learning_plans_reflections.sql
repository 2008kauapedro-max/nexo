create table public.study_plan_items(user_id uuid not null references public.profiles(id) on delete cascade,day date not null,topic_id uuid not null references public.topics(id),kind text not null check(kind in ('learn','practice','review')),target integer not null check(target between 5 and 20),created_at timestamptz not null default now(),primary key(user_id,day));
create index study_plan_topic_idx on public.study_plan_items(topic_id);
alter table public.study_plan_items enable row level security;
revoke all on public.study_plan_items from anon,authenticated;
grant select on public.study_plan_items to authenticated;
create policy own_read on public.study_plan_items for select to authenticated using((select auth.uid())=user_id);
create table public.learning_reflections(user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,lesson_id uuid not null references public.lessons(id),explanation text not null check(length(explanation) between 20 and 3000),updated_at timestamptz not null default now(),primary key(user_id,lesson_id));
create index reflections_lesson_idx on public.learning_reflections(lesson_id);
alter table public.learning_reflections enable row level security;
revoke all on public.learning_reflections from anon,authenticated;
grant select,insert,update,delete on public.learning_reflections to authenticated;
create policy own_read on public.learning_reflections for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.learning_reflections for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published'));
create policy own_update on public.learning_reflections for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_delete on public.learning_reflections for delete to authenticated using((select auth.uid())=user_id);
create function public.generate_study_plan() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();v_day date:=(now() at time zone 'America/Sao_Paulo')::date;topics uuid[];n integer;goal integer;begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 select daily_goal into goal from public.profiles where id=uid and onboarding_complete for update;if not found then raise exception 'ONBOARDING_REQUIRED';end if;
 select array_agg(t.id order by coalesce(m.score,50),t.name) into topics from public.topics t join public.user_subjects us on us.subject_id=t.subject_id and us.user_id=uid left join public.topic_mastery m on m.topic_id=t.id and m.user_id=uid;
 n:=coalesce(array_length(topics,1),0);if n=0 then raise exception 'NO_TOPICS';end if;
 insert into public.study_plan_items(user_id,day,topic_id,kind,target) select uid,v_day+i,topics[1+(i%n)],case when i%3=0 then 'learn' when i%3=1 then 'practice' else 'review' end,least(20,greatest(5,goal)) from generate_series(0,6)i on conflict(user_id,day) do nothing;
end $$;
create function public.admin_quality() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if not public.is_admin() then raise exception 'FORBIDDEN';end if;
return coalesce((select jsonb_agg(to_jsonb(q)) from(select q.id,q.statement,q.status,q.difficulty,(select count(*) from public.question_attempts a where a.question_id=q.id) attempts,(select round(avg(a.correct::integer)*100,1) from public.question_attempts a where a.question_id=q.id) accuracy,(select count(*) from public.question_reports r where r.question_id=q.id and r.status in ('open','review')) reports from public.questions q order by q.created_at desc limit 100)q),'[]'::jsonb);end $$;
revoke all on function public.generate_study_plan(),public.admin_quality() from public,anon;
grant execute on function public.generate_study_plan(),public.admin_quality() to authenticated;
