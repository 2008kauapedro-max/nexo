-- Additive learning workspace: private study artifacts, notification center and RBAC.
alter table private.admins add column role text not null default 'SUPER_ADMIN' check(role in ('SUPER_ADMIN','FINANCE_ADMIN','CONTENT_ADMIN','SUPPORT_ADMIN','ANALYST'));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.admins where user_id=auth.uid() and role in ('SUPER_ADMIN','CONTENT_ADMIN'));
$$;
create function public.admin_role() returns text language sql stable security definer set search_path='' as $$select role from private.admins where user_id=auth.uid()$$;

create table public.notification_preferences(user_id uuid primary key references public.profiles(id) on delete cascade, study boolean not null default true, achievements boolean not null default true, news boolean not null default false);
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,kind text not null,title text not null check(length(title)<=120),body text not null check(length(body)<=500),href text not null check(href ~ '^/[a-zA-Z0-9/_-]*$'),priority text not null default 'normal' check(priority in ('low','normal','high')),dedupe_key text not null,read_at timestamptz,dismissed_at timestamptz,created_at timestamptz not null default now(),unique(user_id,dedupe_key));
create index notifications_inbox_idx on public.notifications(user_id,created_at desc) where dismissed_at is null;
create table public.notes(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,topic_id uuid references public.topics(id),title text not null check(length(title) between 1 and 120),body text not null check(length(body) between 1 and 10000),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index notes_user_idx on public.notes(user_id,updated_at desc);create index notes_topic_idx on public.notes(topic_id);
create table public.flashcards(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,topic_id uuid references public.topics(id),front text not null check(length(front) between 1 and 1000),back text not null check(length(back) between 1 and 3000),interval_days integer not null default 1 check(interval_days between 1 and 180),next_review timestamptz not null default now(),last_reviewed timestamptz,created_at timestamptz not null default now());
create index flashcards_user_idx on public.flashcards(user_id,next_review);create index flashcards_topic_idx on public.flashcards(topic_id);
create table public.error_annotations(user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,question_id uuid not null references public.questions(id),reason text not null check(reason in ('Conceito','Interpretação','Cálculo','Distração','Fórmula esquecida','Outro')),resolved boolean not null default false,updated_at timestamptz not null default now(),primary key(user_id,question_id));
create index error_question_idx on public.error_annotations(question_id);
create table public.question_reports(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,question_id uuid not null references public.questions(id),reason text not null check(reason in ('Resposta incorreta','Enunciado incorreto','Imagem quebrada','Questão duplicada','Explicação ruim','Outro')),detail text not null default '' check(length(detail)<=1000),status text not null default 'open' check(status in ('open','review','resolved','rejected')),created_at timestamptz not null default now(),unique(user_id,question_id));
create index reports_question_idx on public.question_reports(question_id);
create table public.topic_prerequisites(topic_id uuid not null references public.topics(id),prerequisite_id uuid not null references public.topics(id),primary key(topic_id,prerequisite_id),check(topic_id<>prerequisite_id));create index prerequisites_reverse_idx on public.topic_prerequisites(prerequisite_id);
create table public.lessons(id uuid primary key default gen_random_uuid(),topic_id uuid not null references public.topics(id),title text not null,explanation text not null,example text not null,status text not null default 'draft' check(status in ('draft','published','disabled')),unique(topic_id,title));create index lessons_topic_idx on public.lessons(topic_id);
create table public.learning_activities(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons(id),kind text not null check(kind in ('MULTIPLE_CHOICE','TRUE_FALSE','NUMERIC_INPUT','SHORT_ANSWER','FILL_BLANK','ORDERING','MATCHING','MULTI_SELECT','STEP_BY_STEP','DRAG_DROP','IMAGE_HOTSPOT','SCENARIO','INTERACTIVE_PROBLEM')),prompt text not null,payload jsonb not null default '{}',difficulty integer not null check(difficulty between 1 and 10),position integer not null default 0,status text not null default 'draft' check(status in ('draft','generated','validated','review','published','rejected','disabled')));create index activities_lesson_idx on public.learning_activities(lesson_id,position);
create table private.activity_keys(activity_id uuid primary key references public.learning_activities(id) on delete cascade,solution jsonb not null,explanation text not null);
alter table private.activity_keys enable row level security;
create policy deny_client_access on private.activity_keys as restrictive for all to anon,authenticated using(false) with check(false);
create table public.activity_attempts(user_id uuid not null references public.profiles(id) on delete cascade,activity_id uuid not null references public.learning_activities(id),response jsonb not null,correct boolean not null,confidence text not null check(confidence in ('sure','unsure','guess')),created_at timestamptz not null default now(),primary key(user_id,activity_id));create index activity_attempts_activity_idx on public.activity_attempts(activity_id);
create table private.cost_entries(id uuid primary key default gen_random_uuid(),category text not null check(category in ('IA','Supabase','Vercel','Gateway','Email','Outros')),amount numeric(12,2) not null check(amount>=0),currency text not null check(currency in ('BRL','USD')),period date not null,created_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());create index costs_actor_idx on private.cost_entries(created_by);
alter table private.cost_entries enable row level security;create policy deny_client_access on private.cost_entries as restrictive for all to anon,authenticated using(false) with check(false);

do $$declare t text;begin
 foreach t in array array['notification_preferences','notifications','notes','flashcards','error_annotations','question_reports','topic_prerequisites','lessons','learning_activities','activity_attempts'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['notification_preferences','notifications','notes','flashcards','error_annotations','question_reports','activity_attempts'] loop
 execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
 foreach t in array array['notes','error_annotations','notification_preferences'] loop
 execute format('grant insert,update,delete on public.%I to authenticated',t);
 execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
grant update(read_at,dismissed_at) on public.notifications to authenticated;
create policy own_update on public.notifications for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant insert(user_id,topic_id,front,back),delete on public.flashcards to authenticated;
create policy own_insert on public.flashcards for insert to authenticated with check((select auth.uid())=user_id);
create policy own_delete on public.flashcards for delete to authenticated using((select auth.uid())=user_id);
create policy catalog_read on public.topic_prerequisites for select to authenticated using(true);
create policy published_read on public.lessons for select to authenticated using(status='published');
create policy published_read on public.learning_activities for select to authenticated using(status='published' and exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published'));

create function public.sync_notifications() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();prefs public.notification_preferences;due integer;begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 insert into public.notification_preferences(user_id) values(uid) on conflict do nothing;
 select * into prefs from public.notification_preferences where user_id=uid;
 if prefs.study then
 insert into public.notifications(user_id,kind,title,body,href,dedupe_key)
 select uid,'SESSION_INCOMPLETE','Seu próximo passo está salvo.',format('Você respondeu %s de %s questões. Continue de onde parou.',answered,target),'/sessao/'||id::text,'session:'||id::text from public.learning_sessions where user_id=uid and finished_at is null and answered>0 and started_at<now()-interval '5 minutes' and (expires_at is null or expires_at>now()) order by started_at desc limit 3 on conflict(user_id,dedupe_key) do nothing;
 select count(*) into due from public.review_queue where user_id=uid and next_review<=now();
 if due>0 then insert into public.notifications(user_id,kind,title,body,href,dedupe_key) values(uid,'REVIEW_DUE','Vale revisitar.',format('%s questões estão no momento de revisão.',due),'/caderno','review:'||(now() at time zone 'America/Sao_Paulo')::date::text) on conflict(user_id,dedupe_key) do nothing;end if;
 end if;
 if prefs.achievements then insert into public.notifications(user_id,kind,title,body,href,dedupe_key) select uid,'ACHIEVEMENT',a.name,a.description,'/perfil','achievement:'||a.id from public.user_achievements ua join public.achievements a on a.id=ua.achievement_id where ua.user_id=uid on conflict(user_id,dedupe_key) do nothing;end if;
 update public.notifications n set dismissed_at=now() where n.user_id=uid and n.kind='SESSION_INCOMPLETE' and n.dismissed_at is null and exists(select 1 from public.learning_sessions s where n.dedupe_key='session:'||s.id::text and s.finished_at is not null);
end $$;
create function public.review_flashcard(p_id uuid,p_remembered boolean) returns void language plpgsql security definer set search_path='' as $$
declare f public.flashcards;days integer;begin
 select * into f from public.flashcards where id=p_id and user_id=auth.uid() for update;if not found then raise exception 'NOT_FOUND';end if;
 if f.last_reviewed>now()-interval '10 seconds' then return;end if;
 days:=case when p_remembered then least(180,greatest(1,round(f.interval_days*2.2)::integer)) else 1 end;
 update public.flashcards set interval_days=days,last_reviewed=now(),next_review=now()+make_interval(days=>days) where id=f.id;
end $$;
create function public.report_question(p_question uuid,p_reason text,p_detail text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 if not exists(select 1 from public.questions where id=p_question and status='published') then raise exception 'NOT_FOUND';end if;
 if (select count(*) from public.question_reports where user_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT';end if;
 insert into public.question_reports(user_id,question_id,reason,detail) values(auth.uid(),p_question,p_reason,p_detail) on conflict(user_id,question_id) do nothing;
end $$;
create function public.submit_activity(p_activity uuid,p_response jsonb,p_confidence text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();a public.learning_activities;k private.activity_keys;prior public.activity_attempts;good boolean;tid uuid;day date:=(now() at time zone 'America/Sao_Paulo')::date;used integer;lim integer;delta numeric;begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_confidence not in ('sure','unsure','guess') or p_response is null or octet_length(p_response::text)>3000 then raise exception 'INVALID_INPUT';end if;
 perform 1 from public.profiles where id=uid for update;
 select * into a from public.learning_activities where id=p_activity and status='published';if not found then raise exception 'NOT_FOUND';end if;
 select * into k from private.activity_keys where activity_id=a.id;if not found then raise exception 'NOT_FOUND';end if;
 select * into prior from public.activity_attempts where user_id=uid and activity_id=a.id;
 if found then return jsonb_build_object('correct',prior.correct,'explanation',k.explanation,'already_recorded',true);end if;
 select daily_questions into lim from public.plans where id=private.current_plan(uid);
 insert into public.usage_counters(user_id,day) values(uid,day) on conflict do nothing;
 select questions into used from public.usage_counters where user_id=uid and usage_counters.day=submit_activity.day for update;if used>=lim then raise exception 'DAILY_LIMIT';end if;
 if a.kind='NUMERIC_INPUT' then good:=abs((p_response->>'value')::numeric-(k.solution->>'value')::numeric)<=coalesce((k.solution->>'tolerance')::numeric,0);
 elsif a.kind='TRUE_FALSE' then good:=(p_response->>'value')::boolean=(k.solution->>'value')::boolean;
 elsif a.kind in ('SHORT_ANSWER','FILL_BLANK') then good:=lower(trim(p_response->>'value'))=lower(trim(k.solution->>'value'));
 elsif a.kind='ORDERING' then good:=p_response->'value'=k.solution->'value';
 else raise exception 'ACTIVITY_NOT_SUPPORTED';end if;
 if good is null then raise exception 'INVALID_INPUT';end if;
 insert into public.activity_attempts values(uid,a.id,p_response,good,p_confidence,now());
 select topic_id into tid from public.lessons where id=a.lesson_id;
 delta:=case when good then case p_confidence when 'guess' then 1 when 'unsure' then 3 else 5 end else case p_confidence when 'sure' then -5 else -3 end end;
 insert into public.topic_mastery(user_id,topic_id,score,attempts) values(uid,tid,50+delta,1) on conflict(user_id,topic_id) do update set score=greatest(0,least(100,public.topic_mastery.score+delta)),attempts=public.topic_mastery.attempts+1,updated_at=now();
 update public.usage_counters set questions=questions+1 where user_id=uid and usage_counters.day=submit_activity.day;
 update public.profiles set xp=xp+case when good then 10 else 3 end,streak=case when last_study_day=day then streak when last_study_day=day-1 then streak+1 else 1 end,last_study_day=day where id=uid;
 return jsonb_build_object('correct',good,'explanation',k.explanation,'already_recorded',false);
end $$;
create function public.admin_finance() returns jsonb language plpgsql security definer set search_path='' as $$
begin if coalesce(public.admin_role(),'') not in ('SUPER_ADMIN','FINANCE_ADMIN') then raise exception 'FORBIDDEN';end if;
 return jsonb_build_object('active_subscriptions',(select count(*) from public.subscriptions where status='active' and period_end>now()),'costs',coalesce((select jsonb_agg(to_jsonb(c)-'created_by') from (select * from private.cost_entries order by period desc limit 100)c),'[]'::jsonb),'revenue',null,'mrr',null,'billing_enabled',false);
end $$;
create function public.admin_health() returns jsonb language plpgsql security definer set search_path='' as $$
begin if coalesce(public.admin_role(),'')<>'SUPER_ADMIN' then raise exception 'FORBIDDEN';end if;
 return jsonb_build_object('database','connected','profiles',(select count(*) from public.profiles),'questions',(select count(*) from public.questions),'open_reports',(select count(*) from public.question_reports where status='open'),'ai_failures_24h',(select count(*) from public.ai_usage where status='failed' and created_at>now()-interval '1 day'),'audit',coalesce((select jsonb_agg(to_jsonb(a)) from (select action,entity_id,created_at from private.audit_logs order by created_at desc limit 20)a),'[]'::jsonb));
end $$;
revoke all on function public.admin_role(),public.sync_notifications(),public.review_flashcard(uuid,boolean),public.report_question(uuid,text,text),public.submit_activity(uuid,jsonb,text),public.admin_finance(),public.admin_health() from public,anon;
grant execute on function public.admin_role(),public.sync_notifications(),public.review_flashcard(uuid,boolean),public.report_question(uuid,text,text),public.submit_activity(uuid,jsonb,text),public.admin_finance(),public.admin_health() to authenticated;
