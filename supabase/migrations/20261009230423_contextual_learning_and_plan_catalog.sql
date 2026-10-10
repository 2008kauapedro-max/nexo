-- Additive only. Existing answers, attempts and account deletion are untouched.
alter table public.plans add column if not exists monthly_price_cents integer check(monthly_price_cents >= 0);
alter table public.plans add column if not exists annual_price_cents integer check(annual_price_cents >= 0);
alter table public.plans add column if not exists currency text not null default 'BRL' check(currency='BRL');
alter table public.plans add column if not exists ai_burst_per_minute integer not null default 3 check(ai_burst_per_minute between 1 and 10);
alter table public.plans add column if not exists weekly_simulations integer not null default 1 check(weekly_simulations between 0 and 100);
alter table public.plans add column if not exists features jsonb not null default '{}' check(jsonb_typeof(features)='object');
-- Seed only unconfigured plans; reruns preserve subsequent administrator edits.
update public.plans set monthly_price_cents=0,daily_questions=50,daily_ai=5,max_simulation=180,weekly_simulations=1,
 features='{"saved_help":true,"basic_review":true,"daily_plan":true}' where id='free' and monthly_price_cents is null;
update public.plans set monthly_price_cents=2490,daily_questions=500,daily_ai=20,max_simulation=180,weekly_simulations=20,
 features='{"saved_help":true,"basic_review":true,"daily_plan":true,"adaptive_plan":true,"advanced_activities":true,"knowledge_map":true,"spaced_repetition":true,"real_exam":true,"topic_analytics":true}' where id='pro' and monthly_price_cents is null;
update public.plans set monthly_price_cents=4490,daily_questions=1000,daily_ai=50,max_simulation=180,weekly_simulations=40,
 features='{"saved_help":true,"basic_review":true,"daily_plan":true,"adaptive_plan":true,"advanced_activities":true,"knowledge_map":true,"spaced_repetition":true,"real_exam":true,"topic_analytics":true,"prove_learning":true,"advanced_reports":true,"multiple_goals":true,"custom_missions":true}' where id='premium' and monthly_price_cents is null;

create table if not exists private.question_pedagogy (
 question_id uuid primary key references public.questions(id) on delete cascade,
 hint text not null check(length(hint) between 10 and 1500),
 key_concept text not null check(length(key_concept) between 3 and 1500),
 solution_steps jsonb not null default '[]' check(jsonb_typeof(solution_steps)='array' and jsonb_array_length(solution_steps)<=12),
 common_mistakes jsonb not null default '[]' check(jsonb_typeof(common_mistakes)='array' and jsonb_array_length(common_mistakes)<=10),
 option_explanations jsonb not null default '[]' check(jsonb_typeof(option_explanations)='array' and jsonb_array_length(option_explanations)<=5),
 prerequisites jsonb not null default '[]' check(jsonb_typeof(prerequisites)='array' and jsonb_array_length(prerequisites)<=10),
 skills jsonb not null default '[]' check(jsonb_typeof(skills)='array' and jsonb_array_length(skills)<=10),
 generator_seed integer, generator_version text,
 updated_at timestamptz not null default now()
);
alter table private.question_pedagogy enable row level security;
revoke all on private.question_pedagogy from public,anon,authenticated;

create or replace function public.question_help(p_question uuid,p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c jsonb; p private.question_pedagogy; begin
 -- The existing gate checks ownership, membership and active-exam restrictions.
 c:=public.ai_context(p_question,p_session);
 if c is null then raise exception 'NOT_FOUND'; end if;
 select * into p from private.question_pedagogy where question_id=p_question;
 return jsonb_build_object('statement',c->'statement','options',c->'options','difficulty',c->'difficulty',
 'topic',(select name from public.topics where id=(c->>'topic_id')::uuid),
 'subtopic',(select name from public.subtopics where id=(c->>'subtopic_id')::uuid),
 'mastery',c->'mastery','answer',c->'answer','selected',c->'selected','explanation',c->'explanation',
 'hint',p.hint,'key_concept',p.key_concept,'prerequisites',p.prerequisites,'skills',p.skills,
 'solution_steps',case when c->>'answer' is not null then p.solution_steps else '[]'::jsonb end,
 'common_mistakes',case when c->>'answer' is not null then p.common_mistakes else '[]'::jsonb end,
 'option_explanations',case when c->>'answer' is not null then p.option_explanations else '[]'::jsonb end);
end $$;
revoke all on function public.question_help(uuid,uuid) from public,anon;
grant execute on function public.question_help(uuid,uuid) to authenticated;

create or replace function public.admin_save_pedagogy(p_question uuid,p_content jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare field text; begin
 if auth.uid() is null or not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if p_content is null or octet_length(p_content::text)>20000 then raise exception 'INVALID_CONTENT'; end if;
 foreach field in array array['solution_steps','common_mistakes','option_explanations','prerequisites','skills'] loop
   if p_content ? field then
     if jsonb_typeof(p_content->field)<>'array' then raise exception 'INVALID_CONTENT'; end if;
     if exists(select 1 from jsonb_array_elements(p_content->field) v where jsonb_typeof(v)<>'string' or length(v#>>'{}') not between 1 and 1500) then raise exception 'INVALID_CONTENT'; end if;
   end if;
 end loop;
 if p_content ? 'option_explanations' and jsonb_array_length(p_content->'option_explanations') not in (0,(select jsonb_array_length(options) from public.questions where id=p_question)) then raise exception 'INVALID_OPTIONS'; end if;
 insert into private.question_pedagogy(question_id,hint,key_concept,solution_steps,common_mistakes,option_explanations,prerequisites,skills,generator_seed,generator_version)
 values(p_question,p_content->>'hint',p_content->>'key_concept',coalesce(p_content->'solution_steps','[]'),coalesce(p_content->'common_mistakes','[]'),coalesce(p_content->'option_explanations','[]'),coalesce(p_content->'prerequisites','[]'),coalesce(p_content->'skills','[]'),(p_content->>'generator_seed')::integer,p_content->>'generator_version')
 on conflict(question_id) do update set hint=excluded.hint,key_concept=excluded.key_concept,solution_steps=excluded.solution_steps,common_mistakes=excluded.common_mistakes,option_explanations=excluded.option_explanations,prerequisites=excluded.prerequisites,skills=excluded.skills,generator_seed=excluded.generator_seed,generator_version=excluded.generator_version,updated_at=now();
 insert into private.audit_logs(actor,action,entity_id) values(auth.uid(),'question.pedagogy',p_question);
end $$;
revoke all on function public.admin_save_pedagogy(uuid,jsonb) from public,anon;
grant execute on function public.admin_save_pedagogy(uuid,jsonb) to authenticated;

create or replace function public.admin_upsert_learning_question(p_question jsonb,p_id uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare qid uuid; begin
 if auth.uid() is null or not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if p_question->>'status'='published' and not (p_question ? 'hint' and p_question ? 'key_concept') and not exists(select 1 from private.question_pedagogy where question_id=p_id) then raise exception 'PEDAGOGY_REQUIRED'; end if;
 qid:=public.admin_upsert_question(p_question,p_id);
 if p_question ? 'hint' or p_question ? 'key_concept' then perform public.admin_save_pedagogy(qid,p_question); end if;
 return qid;
end $$;
revoke all on function public.admin_upsert_learning_question(jsonb,uuid) from public,anon;
grant execute on function public.admin_upsert_learning_question(jsonb,uuid) to authenticated;

create or replace function public.admin_configure_plan(p_id text,p_config jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(public.admin_role(),'') not in ('SUPER_ADMIN','FINANCE_ADMIN') then raise exception 'FORBIDDEN'; end if;
 if p_config is null or jsonb_typeof(p_config)<>'object' or octet_length(p_config::text)>5000 then raise exception 'INVALID_CONFIG'; end if;
 if exists(select 1 from jsonb_each(coalesce(p_config->'features','{}')) e where jsonb_typeof(e.value)<>'boolean') then raise exception 'INVALID_FEATURES'; end if;
 if (p_config->>'daily_questions')::integer not between 5 and 5000 or (p_config->>'daily_ai')::integer not between 0 and 200 then raise exception 'INVALID_LIMIT'; end if;
 update public.plans set monthly_price_cents=(p_config->>'monthly_price_cents')::integer,
 annual_price_cents=(p_config->>'annual_price_cents')::integer,daily_questions=(p_config->>'daily_questions')::integer,
 daily_ai=(p_config->>'daily_ai')::integer,max_simulation=(p_config->>'max_simulation')::integer,
 weekly_simulations=(p_config->>'weekly_simulations')::integer,ai_burst_per_minute=(p_config->>'ai_burst_per_minute')::integer,
 features=coalesce(p_config->'features',features) where id=p_id;
 if not found then raise exception 'NOT_FOUND'; end if;
 insert into private.audit_logs(actor,action) values(auth.uid(),'plan.configure.'||p_id);
end $$;
revoke all on function public.admin_configure_plan(text,jsonb) from public,anon;
grant execute on function public.admin_configure_plan(text,jsonb) to authenticated;

-- Server-owned reservation ledger. Existing chat/history remains intact.
alter table public.ai_usage add column if not exists request_id uuid;
alter table public.ai_usage add column if not exists question_id uuid references public.questions(id) on delete set null;
alter table public.ai_usage add column if not exists period_start timestamptz;
alter table public.ai_usage add column if not exists expires_at timestamptz;
alter table public.ai_usage add column if not exists plan_id text references public.plans(id);
alter table public.ai_usage add column if not exists model text;
alter table public.ai_usage add column if not exists intent text;
alter table public.ai_usage add column if not exists request_hash text;
alter table public.ai_usage add column if not exists latency_ms integer;
alter table public.ai_usage add column if not exists error_code text;
alter table public.ai_usage add column if not exists estimated_cost_usd numeric(14,8);
create unique index if not exists ai_usage_request_idx on public.ai_usage(user_id,request_id) where request_id is not null;
create index if not exists ai_usage_period_idx on public.ai_usage(user_id,period_start,status);
create index if not exists ai_usage_question_idx on public.ai_usage(question_id);
create index if not exists ai_usage_plan_idx on public.ai_usage(plan_id);
create table if not exists private.ai_periods (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null,
 time_zone text not null, check(ends_at>starts_at)
);
create table if not exists private.ai_results (
 usage_id uuid primary key references public.ai_usage(id) on delete cascade,
 answer text not null check(length(answer) between 1 and 2600)
);
alter table private.ai_periods enable row level security;
alter table private.ai_results enable row level security;
revoke all on private.ai_periods,private.ai_results from public,anon,authenticated;

create or replace function public.reserve_contextual_help(p_user uuid,p_question uuid,p_session uuid,p_request uuid,p_intent text,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tz text; per private.ai_periods; existing public.ai_usage; cfg public.plans; rid uuid; used integer; boundary timestamptz; begin
 if p_user is null or p_request is null or p_hash is null or length(p_hash)<>64 or p_intent is null or p_intent not in ('hint','concept','start','mistake','rephrase','steps','why_correct') then raise exception 'INVALID_INPUT'; end if;
 select time_zone into tz from public.profiles where id=p_user for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if not exists(select 1 from public.learning_sessions s where s.id=p_session and s.user_id=p_user and (s.mode<>'simulation' or s.finished_at is not null) and (s.current_question_id=p_question or exists(select 1 from public.question_attempts a where a.session_id=s.id and a.question_id=p_question and a.user_id=p_user))) then raise exception 'FORBIDDEN'; end if;
 -- Release only this user's abandoned reservations. No successful usage is refunded.
 update public.ai_usage set status='failed',error_code='reservation_expired' where user_id=p_user and request_id is not null and status='reserved' and expires_at<=now();
 select * into existing from public.ai_usage where user_id=p_user and request_id=p_request;
 if found then
   if existing.request_hash<>p_hash or existing.question_id is distinct from p_question or existing.intent is distinct from p_intent then raise exception 'REQUEST_CONFLICT'; end if;
   return jsonb_build_object('id',existing.id,'status',existing.status,'reused',true,'text',(select answer from private.ai_results where usage_id=existing.id));
 end if;
 select * into cfg from public.plans where id=private.current_plan(p_user);
 select * into per from private.ai_periods where user_id=p_user;
 if not found or per.ends_at<=now() then
   if not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then tz:='America/Sao_Paulo'; end if;
   boundary:=(((now() at time zone tz)::date+1)::timestamp at time zone tz);
   -- Timezone edits cannot reset an active period or create rapid repeated resets.
   if per.user_id is not null and boundary<now()+interval '20 hours' then boundary:=boundary+interval '1 day'; end if;
   insert into private.ai_periods(user_id,starts_at,ends_at,time_zone) values(p_user,now(),boundary,tz)
   on conflict(user_id) do update set starts_at=excluded.starts_at,ends_at=excluded.ends_at,time_zone=excluded.time_zone returning * into per;
 end if;
 select count(*) into used from public.ai_usage where user_id=p_user and period_start=per.starts_at and status in ('reserved','success');
 if used>=cfg.daily_ai then raise exception 'DAILY_LIMIT'; end if;
 if exists(select 1 from public.ai_usage where user_id=p_user and request_id is not null and status='reserved') then raise exception 'IN_PROGRESS'; end if;
 if (select count(*) from public.ai_usage where user_id=p_user and created_at>now()-interval '1 minute')>=cfg.ai_burst_per_minute then raise exception 'RATE_LIMIT'; end if;
 insert into public.ai_usage(user_id,status,request_id,question_id,period_start,expires_at,plan_id,model,intent,request_hash)
 values(p_user,'reserved',p_request,p_question,per.starts_at,now()+interval '2 minutes',cfg.id,'openai/gpt-oss-20b',p_intent,p_hash) returning id into rid;
 return jsonb_build_object('id',rid,'status','reserved','reused',false,'remaining',cfg.daily_ai-used-1,'resets_at',per.ends_at);
end $$;
revoke all on function public.reserve_contextual_help(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_contextual_help(uuid,uuid,uuid,uuid,text,text) to service_role;

create or replace function public.finish_contextual_help(p_user uuid,p_usage uuid,p_success boolean,p_answer text,p_tokens integer,p_latency integer,p_error text default null,p_cost numeric default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare item public.ai_usage; begin
 if p_success is null or p_tokens is null or p_tokens<0 or p_latency is null or p_latency<0 or (p_success and (p_answer is null or length(trim(p_answer)) not between 1 and 2600)) then raise exception 'INVALID_INPUT'; end if;
 perform 1 from public.profiles where id=p_user for update;
 select * into item from public.ai_usage where id=p_usage and user_id=p_user and request_id is not null for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if item.status<>'reserved' then return item.status='success'; end if;
 if item.expires_at<=now() then
   update public.ai_usage set status='failed',error_code='reservation_expired' where id=item.id;
   return false;
 end if;
 update public.ai_usage set status=case when p_success then 'success' else 'failed' end,tokens=p_tokens,latency_ms=p_latency,estimated_cost_usd=case when p_success and p_cost>=0 then p_cost else null end,error_code=case when p_success then null else left(coalesce(p_error,'provider_failed'),60) end where id=item.id;
 if p_success then insert into private.ai_results(usage_id,answer) values(item.id,p_answer) on conflict do nothing; end if;
 return p_success;
end $$;
revoke all on function public.finish_contextual_help(uuid,uuid,boolean,text,integer,integer,text,numeric) from public,anon,authenticated;
grant execute on function public.finish_contextual_help(uuid,uuid,boolean,text,integer,integer,text,numeric) to service_role;

-- Weekly simulation budget is independent of daily practice.
create or replace function public.start_session(p_mode text,p_subject uuid default null,p_topic uuid default null,p_target integer default 10,p_minutes integer default 30) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid; max_questions integer; begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.profiles where id=uid and onboarding_complete for update;
 if not found then raise exception 'ONBOARDING_REQUIRED'; end if;
 select max_simulation into max_questions from public.plans where id=private.current_plan(uid);
 if p_mode is null or p_mode not in ('practice','review','diagnostic','simulation') or p_target is null or p_target<5 or p_minutes is null then raise exception 'INVALID_INPUT'; end if;
 if p_mode='simulation' and (select count(*) from public.learning_sessions where user_id=uid and mode='simulation' and started_at>now()-interval '7 days') >= (select weekly_simulations from public.plans where id=private.current_plan(uid)) then raise exception 'PLAN_LIMIT'; end if;
 if p_mode='simulation' and p_target>max_questions then raise exception 'PLAN_LIMIT'; end if;
 if p_target not between 5 and 20 and p_mode<>'simulation' then raise exception 'INVALID_INPUT'; end if;
 if p_minutes not between 5 and 300 then raise exception 'INVALID_INPUT'; end if;
 if p_topic is not null and not exists(select 1 from public.topics where id=p_topic and subject_id=p_subject) then raise exception 'INVALID_TOPIC'; end if;
 if (select count(*) from public.learning_sessions where user_id=uid and started_at>now()-interval '1 hour')>=30 then raise exception 'RATE_LIMIT'; end if;
 insert into public.learning_sessions(user_id,mode,subject_id,topic_id,target,expires_at) values(uid,p_mode,p_subject,p_topic,p_target,case when p_mode='simulation' then now()+make_interval(mins=>p_minutes) end) returning id into sid;
 return sid;
end $$;
create or replace function public.submit_answer(p_session uuid,p_question uuid,p_selected integer) returns jsonb language plpgsql security definer set search_path='' as $$
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
 return jsonb_build_object('correct',case when s.mode<>'simulation' or s.finished_at is not null then prior.correct end,'answer',case when s.mode<>'simulation' or s.finished_at is not null then a.answer end,'explanation',case when s.mode<>'simulation' or s.finished_at is not null then a.explanation end,'xp',case when s.mode<>'simulation' or s.finished_at is not null then prior.xp else 0 end);
 end if;
 if s.finished_at is not null or s.expires_at<=now() or s.current_question_id is distinct from p_question then raise exception 'INVALID_SESSION'; end if;
 select * into q from public.questions where id=p_question;
 if p_selected is null or p_selected<0 or p_selected>=jsonb_array_length(q.options) then raise exception 'INVALID_INPUT'; end if;
 select daily_questions into lim from public.plans where id=private.current_plan(uid);
 insert into public.usage_counters(user_id,day) values(uid,today) on conflict do nothing;
 select questions into used from public.usage_counters where user_id=uid and day=today for update;
 if s.mode<>'simulation' and used>=lim then raise exception 'DAILY_LIMIT'; end if;
 select * into a from private.question_answers where question_id=q.id;
 if not found then raise exception 'CONTENT_UNAVAILABLE'; end if;
 good:=a.answer=p_selected; seconds:=least(3600,greatest(0,extract(epoch from now()-s.question_served_at)::integer));
 xp_gain:=case when good then round((10+q.difficulty*2)*(case when s.hint_used then 0.5 else 1 end)) else 3 end;
 insert into public.question_attempts(user_id,session_id,question_id,selected,correct,seconds,hint_used,xp) values(uid,s.id,q.id,p_selected,good,seconds,s.hint_used,xp_gain);
 insert into public.topic_mastery(user_id,topic_id,score) values(uid,q.topic_id,(select case level when 'initial' then 20 when 'advanced' then 80 else 50 end from public.profiles where id=uid)) on conflict do nothing;
 select * into m from public.topic_mastery where user_id=uid and topic_id=q.topic_id for update;
 expected:=1/(1+exp((q.difficulty*10-m.score)/15)); evidence:=case when good then case when s.hint_used then 0.65 else 1 end else 0 end;
 delta:=greatest(-7,least(7,12*(evidence-expected)*(case when seconds<2 then 0.35 when seconds>180 then 0.85 else 1 end)*greatest(0.5,1-m.attempts/200.0)));
 update public.topic_mastery set score=round(greatest(0,least(100,m.score+delta)),2),attempts=m.attempts+1,streak=case when good then greatest(0,m.streak)+1 else least(0,m.streak)-1 end,updated_at=now() where user_id=uid and topic_id=q.topic_id;
 insert into public.review_queue(user_id,question_id,next_review) values(uid,q.id,now()+interval '1 day') on conflict(user_id,question_id) do update set interval_days=case when good then least(180,greatest(1,round(public.review_queue.interval_days*(case when s.hint_used then 1.3 else 2.2 end))::integer)) else 1 end,last_reviewed=now(),next_review=now()+make_interval(days=>case when good then least(180,greatest(1,round(public.review_queue.interval_days*(case when s.hint_used then 1.3 else 2.2 end))::integer)) else 1 end);
 update public.profiles set xp=xp+xp_gain,streak=case when last_study_day=today then streak when last_study_day=today-1 then streak+1 else 1 end,last_study_day=today where id=uid;
 update public.usage_counters set questions=questions+1 where user_id=uid and day=today and s.mode<>'simulation';
 update public.learning_sessions set answered=answered+1,correct=correct+good::integer,current_question_id=null,finished_at=case when answered+1>=target then now() end where id=s.id;
 insert into public.user_achievements(user_id,achievement_id) select uid,id from public.achievements where required_xp<=(select xp from public.profiles where id=uid) on conflict do nothing;
 return jsonb_build_object('correct',case when s.mode<>'simulation' then good end,'answer',case when s.mode<>'simulation' then a.answer end,'explanation',case when s.mode<>'simulation' then a.explanation end,'xp',case when s.mode<>'simulation' then xp_gain else 0 end);
end $$;
create or replace function public.admin_questions_page(p_search text default '',p_page integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare needle text:=lower(trim(coalesce(p_search,''))); total bigint; rows jsonb;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if length(needle)>256 or p_page is null or p_page<0 or p_page>100000 then raise exception 'INVALID_INPUT'; end if;
 select count(*) into total from public.questions q where needle='' or position(needle in lower(q.statement))>0;
 select coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object('answer',a.answer,'explanation',a.explanation)||coalesce(to_jsonb(p)-'question_id'-'updated_at','{}'::jsonb) order by q.updated_at desc,q.id),'[]'::jsonb) into rows
 from (select id,statement,subject_id,topic_id,difficulty,status,options,updated_at from public.questions
       where needle='' or position(needle in lower(statement))>0 order by updated_at desc,id limit 10 offset p_page*10) q
 join private.question_answers a on a.question_id=q.id left join private.question_pedagogy p on p.question_id=q.id;
 return jsonb_build_object('rows',rows,'total',total);
end $$;

create or replace function public.admin_tutor_metrics() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(public.admin_role(),'') not in ('SUPER_ADMIN','FINANCE_ADMIN') then raise exception 'FORBIDDEN'; end if;
 return jsonb_build_object(
 'today',(select count(*) from public.ai_usage where status='success' and created_at>=date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'),
 'month',(select count(*) from public.ai_usage where status='success' and created_at>=date_trunc('month',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'),
 'by_plan',coalesce((select jsonb_agg(to_jsonb(x)) from (select plan_id,count(*) filter(where status='success') as helps,sum(tokens) as tokens,sum(estimated_cost_usd) as estimated_cost_usd,count(*) filter(where status='failed') as failures,round(avg(latency_ms)) as latency_ms from public.ai_usage where request_id is not null and created_at>=now()-interval '30 days' group by plan_id)x),'[]'),
 'top_users',coalesce((select jsonb_agg(to_jsonb(x)) from (select user_id,count(*) as helps from public.ai_usage where status='success' and created_at>=now()-interval '30 days' group by user_id order by count(*) desc limit 10)x),'[]'));
end $$;
revoke all on function public.admin_tutor_metrics() from public,anon;
grant execute on function public.admin_tutor_metrics() to authenticated;
