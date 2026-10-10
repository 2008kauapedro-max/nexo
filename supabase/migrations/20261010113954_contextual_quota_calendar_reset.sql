-- Function-only correction: preserve data, quotas, privileges, locking and idempotency.
-- Compare the next midnight to the previous reset, not the time of the student's request.
-- No rows are changed by applying this migration. Existing reservations remain untouched.
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
   if per.user_id is not null and boundary<per.ends_at+interval '20 hours' then boundary:=boundary+interval '1 day'; end if;
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

