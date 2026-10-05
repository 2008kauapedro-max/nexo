-- Read saved feedback only after the caller submitted this activity.
create function public.activity_feedback(p_lesson uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'activity_id',a.id,'response',r.response,'confidence',r.confidence,
 'correct',r.correct,'explanation',k.explanation)), '[]'::jsonb)
 from public.activity_attempts r
 join public.learning_activities a on a.id=r.activity_id
 join public.lessons l on l.id=a.lesson_id
 join private.activity_keys k on k.activity_id=a.id
 where r.user_id=auth.uid() and a.lesson_id=p_lesson
 and a.status='published' and l.status='published';
$$;
revoke all on function public.activity_feedback(uuid) from public,anon;
grant execute on function public.activity_feedback(uuid) to authenticated;
