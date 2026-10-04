create function public.admin_upsert_question(p_question jsonb,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare qid uuid; opts jsonb:=p_question->'options'; begin
 if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts) not between 2 and 5 or (p_question->>'answer')::integer not between 0 and jsonb_array_length(opts)-1 then raise exception 'INVALID_OPTIONS'; end if;
 if exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or length(o#>>'{}') not between 1 and 2000) then raise exception 'INVALID_OPTIONS'; end if;
 qid:=coalesce(p_id,gen_random_uuid());
 insert into public.questions(id,subject_id,topic_id,subtopic_id,statement,options,difficulty,source,source_year,exam,status,fingerprint)
 values(qid,(p_question->>'subject_id')::uuid,(p_question->>'topic_id')::uuid,(p_question->>'subtopic_id')::uuid,p_question->>'statement',opts,(p_question->>'difficulty')::integer,coalesce(p_question->>'source','Autoral NEXO'),(p_question->>'source_year')::integer,coalesce(p_question->>'exam','Geral'),coalesce(p_question->>'status','draft'),md5(lower(trim(p_question->>'statement'))))
 on conflict(id) do update set subject_id=excluded.subject_id,topic_id=excluded.topic_id,subtopic_id=excluded.subtopic_id,statement=excluded.statement,options=excluded.options,difficulty=excluded.difficulty,source=excluded.source,source_year=excluded.source_year,exam=excluded.exam,status=excluded.status,fingerprint=excluded.fingerprint,updated_at=now();
 insert into private.question_answers values(qid,(p_question->>'answer')::integer,p_question->>'explanation') on conflict(question_id) do update set answer=excluded.answer,explanation=excluded.explanation;
 insert into private.audit_logs(actor,action,entity_id) values(auth.uid(),'question.upsert',qid);
 return qid;
end $$;
create function public.admin_questions() returns jsonb language plpgsql security definer set search_path='' as $$
begin if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 return coalesce((select jsonb_agg(to_jsonb(q)||jsonb_build_object('answer',a.answer,'explanation',a.explanation)) from (select * from public.questions order by updated_at desc limit 200) q join private.question_answers a on a.question_id=q.id),'[]'::jsonb);
end $$;
create function public.admin_catalog(p_kind text,p_name text,p_parent uuid default null,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid:=coalesce(p_id,gen_random_uuid());begin
 if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if length(trim(p_name)) not between 2 and 80 then raise exception 'INVALID_INPUT'; end if;
 if p_kind='subject' then insert into public.subjects(id,name,slug) values(result,trim(p_name),lower(regexp_replace(trim(p_name),'[^a-zA-Z0-9]+','-','g'))||'-'||left(result::text,8)) on conflict(id) do update set name=excluded.name;
 elsif p_kind='topic' then insert into public.topics(id,subject_id,name) values(result,p_parent,trim(p_name)) on conflict(id) do update set name=excluded.name;
 elsif p_kind='subtopic' then insert into public.subtopics(id,topic_id,name) values(result,p_parent,trim(p_name)) on conflict(id) do update set name=excluded.name;
 else raise exception 'INVALID_INPUT'; end if;
 insert into private.audit_logs(actor,action,entity_id) values(auth.uid(),'catalog.upsert',result); return result;
end $$;
create function public.session_feedback(p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.learning_sessions where id=p_session and user_id=auth.uid() and finished_at is not null) then raise exception 'NOT_FOUND'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('question_id',a.question_id,'answer',k.answer,'explanation',k.explanation)) from public.question_attempts a join private.question_answers k on k.question_id=a.question_id where a.session_id=p_session and a.user_id=auth.uid()),'[]'::jsonb);
end $$;
create function public.ai_context(p_question uuid,p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.learning_sessions; begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into s from public.learning_sessions where id=p_session and user_id=uid;
 if not found or (s.mode='simulation' and s.finished_at is null) then raise exception 'FORBIDDEN'; end if;
 if s.current_question_id is distinct from p_question and not exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then raise exception 'FORBIDDEN'; end if;
 update public.learning_sessions set hint_used=true where id=s.id and current_question_id=p_question;
 return (select to_jsonb(q)||jsonb_build_object('answer',a.answer,'explanation',a.explanation,'selected',(select selected from public.question_attempts where session_id=p_session and question_id=p_question),'mastery',(select score from public.topic_mastery where user_id=uid and topic_id=q.topic_id)) from public.questions q join private.question_answers a on a.question_id=q.id where q.id=p_question);
end $$;
create function public.reserve_ai() returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); today date:=(now() at time zone 'America/Sao_Paulo')::date; used integer; lim integer; rid uuid;begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.profiles where id=uid for update;
 select daily_ai into lim from public.plans where id=private.current_plan(uid);
 insert into public.usage_counters(user_id,day) values(uid,today) on conflict do nothing;
 select ai into used from public.usage_counters where user_id=uid and day=today for update;
 if used>=lim then raise exception 'DAILY_LIMIT'; end if;
 if exists(select 1 from public.ai_usage where user_id=uid and created_at>now()-interval '5 seconds') then raise exception 'RATE_LIMIT'; end if;
 update public.usage_counters set ai=ai+1 where user_id=uid and day=today;
 insert into public.ai_usage(user_id,status) values(uid,'reserved') returning id into rid;return rid;
end $$;
-- AI finalization is server-only. Client cannot refund itself or forge provider usage.
create function public.finish_ai(p_usage uuid,p_user uuid,p_question uuid,p_prompt text,p_answer text,p_tokens integer,p_success boolean) returns void language plpgsql security definer set search_path='' as $$
declare tid uuid;day date;begin
 update public.ai_usage set status=case when p_success then 'success' else 'failed' end,tokens=p_tokens where id=p_usage and user_id=p_user and status='reserved' returning (created_at at time zone 'America/Sao_Paulo')::date into day;
 if not found then return;end if;
 if not p_success then update public.usage_counters set ai=greatest(0,ai-1) where user_id=p_user and usage_counters.day=finish_ai.day;return;end if;
 insert into public.ai_threads(user_id,question_id) values(p_user,p_question) returning id into tid;
 insert into public.ai_messages(thread_id,user_id,role,content) values(tid,p_user,'user',p_prompt),(tid,p_user,'assistant',p_answer);
end $$;
-- Deletion takes the verified identity and removes all owned records by FK cascade.
create function public.delete_account() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 delete from auth.users where id=uid;
end $$;
revoke all on function public.admin_upsert_question(jsonb,uuid),public.admin_questions(),public.admin_catalog(text,text,uuid,uuid),public.session_feedback(uuid),public.ai_context(uuid,uuid),public.reserve_ai(),public.finish_ai(uuid,uuid,uuid,text,text,integer,boolean),public.delete_account() from public,anon,authenticated;
grant execute on function public.admin_upsert_question(jsonb,uuid),public.admin_questions(),public.admin_catalog(text,text,uuid,uuid),public.session_feedback(uuid),public.ai_context(uuid,uuid),public.reserve_ai(),public.delete_account() to authenticated;
grant execute on function public.finish_ai(uuid,uuid,uuid,text,text,integer,boolean) to service_role;
