-- Stripe billing boundary and real plan entitlements for NEXO.
-- Mirrors migrations already applied to the NEXO Supabase project.

alter table public.subscriptions
  add column if not exists provider_customer_reference text,
  add column if not exists provider_price_reference text;

create unique index if not exists subscriptions_provider_customer_unique
  on public.subscriptions(provider_customer_reference)
  where provider_customer_reference is not null;

create or replace function public.has_plan_feature(p_feature text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select
    auth.uid() is not null
    and coalesce(
      (
        select (p.features->>p_feature)::boolean
        from public.plans p
        where p.id=private.current_plan(auth.uid())
      ),
      false
    );
$$;

revoke all on function public.has_plan_feature(text) from public, anon;
grant execute on function public.has_plan_feature(text) to authenticated;

drop policy if exists own_insert on public.learning_reflections;
drop policy if exists own_update on public.learning_reflections;

create policy own_insert
on public.learning_reflections
for insert
to authenticated
with check(
  auth.uid()=user_id
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
using(auth.uid()=user_id and public.has_plan_feature('prove_learning'))
with check(auth.uid()=user_id and public.has_plan_feature('prove_learning'));

create or replace function public.generate_study_plan()
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid:=auth.uid();
  v_day date:=(now() at time zone 'America/Sao_Paulo')::date;
  topics uuid[];
  n integer;
  goal integer;
  adaptive boolean:=public.has_plan_feature('adaptive_plan');
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select daily_goal into goal
  from public.profiles
  where id=uid and onboarding_complete
  for update;

  if not found then raise exception 'ONBOARDING_REQUIRED'; end if;

  select array_agg(
    t.id
    order by
      case when adaptive then coalesce(m.score,50) else 50 end,
      t.name
  )
  into topics
  from public.topics t
  join public.user_subjects us
    on us.subject_id=t.subject_id and us.user_id=uid
  left join public.topic_mastery m
    on m.topic_id=t.id and m.user_id=uid;

  n:=coalesce(array_length(topics,1),0);
  if n=0 then raise exception 'NO_TOPICS'; end if;

  insert into public.study_plan_items(user_id,day,topic_id,kind,target)
  select
    uid,
    v_day+i,
    topics[1+(i%n)],
    case when i%3=0 then 'learn' when i%3=1 then 'practice' else 'review' end,
    least(20,greatest(5,goal))
  from generate_series(0,6)i
  on conflict(user_id,day) do nothing;
end
$$;

revoke all on function public.generate_study_plan() from public, anon;
grant execute on function public.generate_study_plan() to authenticated;

create or replace function public.apply_stripe_billing_event(
  p_id text,
  p_hash text,
  p_user uuid,
  p_plan text,
  p_status text,
  p_period_end timestamptz,
  p_customer text,
  p_subscription text,
  p_price text,
  p_created_at timestamptz
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  existing text;
begin
  if length(p_id) not between 1 and 150
     or length(p_hash)<>64
     or p_created_at>now()+interval '5 minutes'
     or p_plan not in ('pro','premium')
     or p_status not in ('pending','active','past_due','cancelled','expired','failed')
     or length(coalesce(p_customer,'')) not between 3 and 150
     or length(coalesce(p_subscription,'')) not between 3 and 150
     or length(coalesce(p_price,'')) not between 3 and 150
  then
    raise exception 'INVALID_EVENT';
  end if;

  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  select payload_hash into existing
  from private.billing_events
  where id=p_id;

  if found then
    if existing<>p_hash then raise exception 'EVENT_COLLISION'; end if;
    return 'duplicate';
  end if;

  insert into private.billing_events(id,payload_hash)
  values(p_id,p_hash);

  insert into public.subscriptions(
    user_id,
    plan_id,
    status,
    provider_reference,
    provider_customer_reference,
    provider_price_reference,
    period_end,
    last_event_at
  )
  values(
    p_user,
    p_plan,
    p_status,
    p_subscription,
    p_customer,
    p_price,
    p_period_end,
    p_created_at
  )
  on conflict(user_id) do update
  set
    plan_id=excluded.plan_id,
    status=excluded.status,
    provider_reference=excluded.provider_reference,
    provider_customer_reference=excluded.provider_customer_reference,
    provider_price_reference=excluded.provider_price_reference,
    period_end=excluded.period_end,
    last_event_at=excluded.last_event_at,
    updated_at=now()
  where public.subscriptions.last_event_at<excluded.last_event_at;

  return 'accepted';
end
$$;

revoke all on function public.apply_stripe_billing_event(
  text,text,uuid,text,text,timestamptz,text,text,text,timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_stripe_billing_event(
  text,text,uuid,text,text,timestamptz,text,text,text,timestamptz
) to service_role;