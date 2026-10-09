-- Read-only restoration: changing language cannot advance the visible question.
create function public.session_question_view(p_session uuid,p_question uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.learning_sessions; a public.question_attempts; q public.questions; k private.question_answers; ordinal integer;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 select * into s from public.learning_sessions where id=p_session and user_id=uid;
 if not found then raise exception 'NOT_FOUND';end if;
 select * into a from public.question_attempts where session_id=s.id and question_id=p_question and user_id=uid;
 if a.id is null and s.current_question_id is distinct from p_question then raise exception 'NOT_FOUND';end if;
 select * into q from public.questions where id=p_question;
 if not found then raise exception 'NOT_FOUND';end if;
 if a.id is not null then
  select count(*)-1 into ordinal from public.question_attempts where session_id=s.id and created_at<=a.created_at;
  if s.mode<>'simulation' then select * into k from private.question_answers where question_id=q.id;end if;
 else ordinal:=s.answered;end if;
 return jsonb_build_object('question',jsonb_build_object('id',q.id,'statement',q.statement,'options',q.options,'difficulty',q.difficulty),
 'answered',ordinal,'selected',a.selected,
 'feedback',case when a.id is null then null else jsonb_build_object('correct',case when s.mode<>'simulation' then a.correct end,'answer',k.answer,'explanation',k.explanation,'xp',a.xp) end);
end $$;
revoke all on function public.session_question_view(uuid,uuid) from public,anon;
grant execute on function public.session_question_view(uuid,uuid) to authenticated;
