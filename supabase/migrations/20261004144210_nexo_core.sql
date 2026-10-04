-- NEXO: identity, catalog, learning and billing. No dependency on other projects.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check (length(name) <= 60),
 goal text not null default 'ENEM', level text not null default 'unknown' check (level in ('initial','intermediate','advanced','unknown')),
 daily_goal integer not null default 10 check (daily_goal between 5 and 30),
 onboarding_complete boolean not null default false,
 xp integer not null default 0 check (xp >= 0), streak integer not null default 0 check (streak >= 0),
 last_study_day date, created_at timestamptz not null default now()
);
create table private.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.subjects (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, position integer not null default 0);
create table public.topics (id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.subjects(id), name text not null, unique(subject_id,name), unique(id,subject_id));
create table public.subtopics (id uuid primary key default gen_random_uuid(), topic_id uuid not null references public.topics(id), name text not null, unique(topic_id,name), unique(id,topic_id));
create table public.user_subjects (user_id uuid not null references public.profiles(id) on delete cascade, subject_id uuid not null references public.subjects(id), primary key(user_id,subject_id));
create table public.questions (
 id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.subjects(id),
 topic_id uuid not null, subtopic_id uuid,
 statement text not null check (length(statement) between 10 and 10000),
 options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 5),
 difficulty integer not null check (difficulty between 1 and 10),
 skills text[] not null default '{}', tags text[] not null default '{}', question_type text not null default 'multiple_choice' check (question_type='multiple_choice'),
 source text not null default 'Autoral NEXO', source_year integer check (source_year between 1900 and 2100), exam text not null default 'Geral',
 status text not null default 'draft' check(status in ('draft','published','inactive')),
 fingerprint text not null unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(topic_id,subject_id) references public.topics(id,subject_id), foreign key(subtopic_id,topic_id) references public.subtopics(id,topic_id)
);
-- Answers are not exposed by the Data API; only authorized RPCs may reveal feedback.
create table private.question_answers (question_id uuid primary key references public.questions(id) on delete cascade, answer integer not null check(answer between 0 and 4), explanation text not null check(length(explanation) between 10 and 5000));
create table public.plans (id text primary key check(id in ('free','pro','premium')), name text not null, daily_questions integer not null check(daily_questions > 0), daily_ai integer not null check(daily_ai >= 0), max_simulation integer not null check(max_simulation between 5 and 180));
insert into public.plans values ('free','Free',30,3,10),('pro','Pro',500,50,90),('premium','Premium',1000,150,180);
create table public.subscriptions (user_id uuid primary key references public.profiles(id) on delete cascade, plan_id text not null references public.plans(id), status text not null check(status in ('pending','active','past_due','cancelled','expired','failed')), provider_reference text unique, period_end timestamptz not null, updated_at timestamptz not null default now());
create table public.learning_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 mode text not null check(mode in ('practice','diagnostic','review','simulation')), subject_id uuid references public.subjects(id), topic_id uuid references public.topics(id),
 target integer not null check(target between 5 and 180), answered integer not null default 0 check(answered >= 0), correct integer not null default 0 check(correct between 0 and answered),
 started_at timestamptz not null default now(), finished_at timestamptz, expires_at timestamptz,
 current_question_id uuid references public.questions(id), question_served_at timestamptz, hint_used boolean not null default false
);
create table public.question_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 session_id uuid not null references public.learning_sessions(id) on delete cascade, question_id uuid not null references public.questions(id),
 selected integer not null check(selected between 0 and 4), correct boolean not null, seconds integer not null check(seconds >= 0), hint_used boolean not null,
 xp integer not null check(xp >= 0), created_at timestamptz not null default now(), unique(session_id,question_id)
);
create table public.topic_mastery (user_id uuid not null references public.profiles(id) on delete cascade, topic_id uuid not null references public.topics(id), score numeric not null default 50 check(score between 0 and 100), attempts integer not null default 0 check(attempts >= 0), streak integer not null default 0, updated_at timestamptz not null default now(), primary key(user_id,topic_id));
create table public.review_queue (user_id uuid not null references public.profiles(id) on delete cascade, question_id uuid not null references public.questions(id), interval_days integer not null default 1 check(interval_days between 1 and 180), last_reviewed timestamptz not null default now(), next_review timestamptz not null, primary key(user_id,question_id));
create table public.usage_counters (user_id uuid not null references public.profiles(id) on delete cascade, day date not null, questions integer not null default 0 check(questions >= 0), ai integer not null default 0 check(ai >= 0), primary key(user_id,day));
create table public.achievements (id text primary key, name text not null, description text not null, required_xp integer not null check(required_xp > 0));
insert into public.achievements values ('first','Primeiro passo','Sua primeira sessão de aprendizado.',10),('explorer','Em movimento','100 XP de conhecimento construído.',100),('consistent','Constância','500 XP: cada questão conta.',500),('scholar','Conhecimento em expansão','Você chegou aos 1.000 XP.',1000);
create table public.user_achievements (user_id uuid not null references public.profiles(id) on delete cascade, achievement_id text not null references public.achievements(id), earned_at timestamptz not null default now(), primary key(user_id,achievement_id));
create table public.ai_threads (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, question_id uuid references public.questions(id), created_at timestamptz not null default now());
create table public.ai_messages (id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.ai_threads(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, role text not null check(role in ('user','assistant')), content text not null check(length(content) <= 8000), created_at timestamptz not null default now());
create table public.ai_usage (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, tokens integer not null default 0 check(tokens >= 0), status text not null check(status in ('reserved','success','failed')), created_at timestamptz not null default now());
create table private.billing_events (id text primary key, payload_hash text not null, processed_at timestamptz not null default now());
create table private.audit_logs (id bigint generated always as identity primary key, actor uuid references auth.users(id) on delete set null, action text not null, entity_id uuid, created_at timestamptz not null default now());

create index topics_subject_idx on public.topics(subject_id);
create index subtopics_topic_idx on public.subtopics(topic_id);
create index user_subjects_subject_idx on public.user_subjects(subject_id);
create index questions_selection_idx on public.questions(subject_id,topic_id,difficulty) where status='published';
create index questions_subtopic_idx on public.questions(subtopic_id);
create index sessions_user_idx on public.learning_sessions(user_id,started_at desc);
create index sessions_subject_idx on public.learning_sessions(subject_id);
create index sessions_topic_idx on public.learning_sessions(topic_id);
create index sessions_question_idx on public.learning_sessions(current_question_id);
create index attempts_history_idx on public.question_attempts(user_id,created_at desc);
create index attempts_question_idx on public.question_attempts(question_id);
create index mastery_topic_idx on public.topic_mastery(topic_id);
create index review_due_idx on public.review_queue(user_id,next_review);
create index review_question_idx on public.review_queue(question_id);
create index subscriptions_plan_idx on public.subscriptions(plan_id);
create index achievements_achievement_idx on public.user_achievements(achievement_id);
create index threads_user_idx on public.ai_threads(user_id);
create index threads_question_idx on public.ai_threads(question_id);
create index messages_thread_idx on public.ai_messages(thread_id,created_at);
create index messages_user_idx on public.ai_messages(user_id);
create index ai_usage_user_idx on public.ai_usage(user_id,created_at);
create index audit_actor_idx on private.audit_logs(actor);

do $$ declare t text; begin
 foreach t in array array['profiles','subjects','topics','subtopics','user_subjects','questions','plans','subscriptions','learning_sessions','question_attempts','topic_mastery','review_queue','usage_counters','achievements','user_achievements','ai_threads','ai_messages','ai_usage'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['admins','question_answers','billing_events','audit_logs'] loop
 execute format('alter table private.%I enable row level security',t);
 end loop;
 foreach t in array array['user_subjects','subscriptions','learning_sessions','question_attempts','topic_mastery','review_queue','usage_counters','user_achievements','ai_threads','ai_messages','ai_usage'] loop
 execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
 end loop;
 foreach t in array array['subjects','topics','subtopics','plans','achievements'] loop
 execute format('create policy catalog_read on public.%I for select to authenticated using (true)',t);
 end loop;
end $$;
create policy own_read on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy published_read on public.questions for select to authenticated using (status='published');

create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id); return new; end $$;
create trigger nexo_new_user after insert on auth.users for each row execute function private.handle_new_user();

create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.admins where user_id=auth.uid());
$$;
create function private.current_plan(uid uuid) returns text language sql stable set search_path='' as $$
 select coalesce((select plan_id from public.subscriptions where user_id=uid and status in ('active','cancelled') and period_end>now()),'free');
$$;
create function public.save_preferences(p_name text,p_goal text,p_subjects uuid[],p_level text,p_daily_goal integer) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if length(trim(p_name)) not between 2 and 60 or p_goal not in ('Melhorar na escola','ENEM','Marinha','Concurso militar','Concurso público','Matéria específica','Outro') or cardinality(p_subjects) not between 1 and 7 then raise exception 'INVALID_INPUT'; end if;
 update public.profiles set name=trim(p_name),goal=p_goal,level=p_level,daily_goal=p_daily_goal,onboarding_complete=true where id=uid;
 delete from public.user_subjects where user_id=uid;
 insert into public.user_subjects select uid,unnest(p_subjects) on conflict do nothing;
end $$;

create function public.start_session(p_mode text,p_subject uuid default null,p_topic uuid default null,p_target integer default 10,p_minutes integer default 30) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid; max_questions integer; begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.profiles where id=uid and onboarding_complete for update;
 if not found then raise exception 'ONBOARDING_REQUIRED'; end if;
 select max_simulation into max_questions from public.plans where id=private.current_plan(uid);
 if p_mode='simulation' and p_target>max_questions then raise exception 'PLAN_LIMIT'; end if;
 if p_target not between 5 and 20 and p_mode<>'simulation' then raise exception 'INVALID_INPUT'; end if;
 if p_minutes not between 5 and 300 then raise exception 'INVALID_INPUT'; end if;
 if p_topic is not null and not exists(select 1 from public.topics where id=p_topic and subject_id=p_subject) then raise exception 'INVALID_TOPIC'; end if;
 if (select count(*) from public.learning_sessions where user_id=uid and started_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMIT'; end if;
 insert into public.learning_sessions(user_id,mode,subject_id,topic_id,target,expires_at) values(uid,p_mode,p_subject,p_topic,p_target,case when p_mode='simulation' then now()+make_interval(mins=>p_minutes) end) returning id into sid;
 return sid;
end $$;

create function public.next_question(p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 and (s.mode<>'review' or exists(select 1 from public.question_attempts a where a.user_id=uid and a.question_id=qs.id and not a.correct))
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

create function public.submit_answer(p_session uuid,p_question uuid,p_selected integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.learning_sessions; q public.questions; a private.question_answers; m public.topic_mastery;
 good boolean; seconds integer; xp_gain integer; expected numeric; evidence numeric; delta numeric; today date:=(now() at time zone 'America/Sao_Paulo')::date; used integer; lim integer; prior public.question_attempts;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.profiles where id=uid for update;
 select * into s from public.learning_sessions where id=p_session and user_id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into prior from public.question_attempts where session_id=s.id and question_id=p_question;
 if found then
 select * into a from private.question_answers where question_id=p_question;
 return jsonb_build_object('correct',prior.correct,'answer',case when s.mode<>'simulation' or s.finished_at is not null then a.answer end,'explanation',case when s.mode<>'simulation' or s.finished_at is not null then a.explanation end,'xp',prior.xp);
 end if;
 if s.finished_at is not null or s.expires_at<=now() or s.current_question_id is distinct from p_question then raise exception 'INVALID_SESSION'; end if;
 select * into q from public.questions where id=p_question;
 if p_selected is null or p_selected<0 or p_selected>=jsonb_array_length(q.options) then raise exception 'INVALID_INPUT'; end if;
 select daily_questions into lim from public.plans where id=private.current_plan(uid);
 insert into public.usage_counters(user_id,day) values(uid,today) on conflict do nothing;
 select questions into used from public.usage_counters where user_id=uid and day=today for update;
 if used>=lim then raise exception 'DAILY_LIMIT'; end if;
 select * into a from private.question_answers where question_id=q.id;
 if not found then raise exception 'CONTENT_UNAVAILABLE'; end if;
 good:=a.answer=p_selected; seconds:=least(3600,greatest(0,extract(epoch from now()-s.question_served_at)::integer));
 xp_gain:=case when good then round((10+q.difficulty*2)*(case when s.hint_used then 0.5 else 1 end)) else 3 end;
 insert into public.question_attempts(user_id,session_id,question_id,selected,correct,seconds,hint_used,xp) values(uid,s.id,q.id,p_selected,good,seconds,s.hint_used,xp_gain);
 insert into public.topic_mastery(user_id,topic_id,score) values(uid,q.topic_id,50) on conflict do nothing;
 select * into m from public.topic_mastery where user_id=uid and topic_id=q.topic_id for update;
 expected:=1/(1+exp((q.difficulty*10-m.score)/15)); evidence:=case when good then case when s.hint_used then 0.65 else 1 end else 0 end;
 delta:=greatest(-7,least(7,12*(evidence-expected)*(case when seconds<2 then 0.35 when seconds>180 then 0.85 else 1 end)*greatest(0.5,1-m.attempts/200.0)));
 update public.topic_mastery set score=round(greatest(0,least(100,m.score+delta)),2),attempts=m.attempts+1,streak=case when good then greatest(0,m.streak)+1 else least(0,m.streak)-1 end,updated_at=now() where user_id=uid and topic_id=q.topic_id;
 insert into public.review_queue(user_id,question_id,next_review) values(uid,q.id,now()+interval '1 day') on conflict(user_id,question_id) do update set interval_days=case when good then least(180,greatest(1,round(public.review_queue.interval_days*(case when s.hint_used then 1.3 else 2.2 end))::integer)) else 1 end,last_reviewed=now(),next_review=now()+make_interval(days=>case when good then least(180,greatest(1,round(public.review_queue.interval_days*(case when s.hint_used then 1.3 else 2.2 end))::integer)) else 1 end);
 update public.profiles set xp=xp+xp_gain,streak=case when last_study_day=today then streak when last_study_day=today-1 then streak+1 else 1 end,last_study_day=today where id=uid;
 update public.usage_counters set questions=questions+1 where user_id=uid and day=today;
 update public.learning_sessions set answered=answered+1,correct=correct+good::integer,current_question_id=null,finished_at=case when answered+1>=target then now() end where id=s.id;
 insert into public.user_achievements(user_id,achievement_id) select uid,id from public.achievements where required_xp<=(select xp from public.profiles where id=uid) on conflict do nothing;
 return jsonb_build_object('correct',case when s.mode<>'simulation' then good end,'answer',case when s.mode<>'simulation' then a.answer end,'explanation',case when s.mode<>'simulation' then a.explanation end,'xp',case when s.mode<>'simulation' then xp_gain else 0 end);
end $$;

-- All mutations are narrow, identity-bound functions; clients cannot write scores or plans.
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.is_admin(), public.save_preferences(text,text,uuid[],text,integer), public.start_session(text,uuid,uuid,integer,integer), public.next_question(uuid), public.submit_answer(uuid,uuid,integer) from public,anon;
grant execute on function public.is_admin(), public.save_preferences(text,text,uuid[],text,integer), public.start_session(text,uuid,uuid,integer,integer), public.next_question(uuid), public.submit_answer(uuid,uuid,integer) to authenticated;
