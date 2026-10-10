-- Avoid per-row auth.uid() re-evaluation in the premium reflection policies.

drop policy if exists own_insert on public.learning_reflections;
drop policy if exists own_update on public.learning_reflections;

create policy own_insert
on public.learning_reflections
for insert
to authenticated
with check(
  (select auth.uid())=user_id
  and public.has_plan_feature('prove_learning')
  and exists(
    select 1
    from public.lessons l
    where l.id=lesson_id and l.status='published'
  )
);

create policy own_update
on public.learning_reflections
for update
to authenticated
using((select auth.uid())=user_id and public.has_plan_feature('prove_learning'))
with check((select auth.uid())=user_id and public.has_plan_feature('prove_learning'));