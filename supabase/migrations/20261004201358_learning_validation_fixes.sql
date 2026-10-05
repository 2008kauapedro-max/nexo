-- Fix runtime date scope, hide unpublished lessons and respect starting level.
create or replace function public.submit_activity(p_activity uuid,p_response jsonb,p_confidence text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();a public.learning_activities;k private.activity_keys;prior public.activity_attempts;good boolean;tid uuid;v_day date:=(now() at time zone 'America/Sao_Paulo')::date;used integer;lim integer;delta numeric;begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_confidence not in ('sure','unsure','guess') or p_response is null or octet_length(p_response::text)>3000 then raise exception 'INVALID_INPUT';end if;
 perform 1 from public.profiles where id=uid for update;
 select * into a from public.learning_activities where id=p_activity and status='published' and exists(select 1 from public.lessons l where l.id=lesson_id and l.status='published');if not found then raise exception 'NOT_FOUND';end if;
 select * into k from private.activity_keys where activity_id=a.id;if not found then raise exception 'NOT_FOUND';end if;
 select * into prior from public.activity_attempts where user_id=uid and activity_id=a.id;
 if found then return jsonb_build_object('correct',prior.correct,'explanation',k.explanation,'already_recorded',true);end if;
 select daily_questions into lim from public.plans where id=private.current_plan(uid);
 insert into public.usage_counters(user_id,day) values(uid,v_day) on conflict do nothing;
 select questions into used from public.usage_counters where user_id=uid and usage_counters.day=v_day for update;if used>=lim then raise exception 'DAILY_LIMIT';end if;
 if a.kind='NUMERIC_INPUT' then good:=abs((p_response->>'value')::numeric-(k.solution->>'value')::numeric)<=coalesce((k.solution->>'tolerance')::numeric,0);
 elsif a.kind='TRUE_FALSE' then good:=(p_response->>'value')::boolean=(k.solution->>'value')::boolean;
 elsif a.kind in ('SHORT_ANSWER','FILL_BLANK') then good:=lower(trim(p_response->>'value'))=lower(trim(k.solution->>'value'));
 elsif a.kind='ORDERING' then good:=p_response->'value'=k.solution->'value';
 else raise exception 'ACTIVITY_NOT_SUPPORTED';end if;
 if good is null then raise exception 'INVALID_INPUT';end if;
 insert into public.activity_attempts values(uid,a.id,p_response,good,p_confidence,now());
 select topic_id into tid from public.lessons where id=a.lesson_id;
 delta:=case when good then case p_confidence when 'guess' then 1 when 'unsure' then 3 else 5 end else case p_confidence when 'sure' then -5 else -3 end end;
 insert into public.topic_mastery(user_id,topic_id,score,attempts) values(uid,tid,(select case level when 'initial' then 20 when 'advanced' then 80 else 50 end from public.profiles where id=uid)+delta,1) on conflict(user_id,topic_id) do update set score=greatest(0,least(100,public.topic_mastery.score+delta)),attempts=public.topic_mastery.attempts+1,updated_at=now();
 update public.usage_counters set questions=questions+1 where user_id=uid and usage_counters.day=v_day;
 update public.profiles set xp=xp+case when good then 10 else 3 end,streak=case when last_study_day=v_day then streak when last_study_day=v_day-1 then streak+1 else 1 end,last_study_day=v_day where id=uid;
 return jsonb_build_object('correct',good,'explanation',k.explanation,'already_recorded',false);
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
 insert into public.topic_mastery(user_id,topic_id,score) values(uid,q.topic_id,(select case level when 'initial' then 20 when 'advanced' then 80 else 50 end from public.profiles where id=uid)) on conflict do nothing;
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
