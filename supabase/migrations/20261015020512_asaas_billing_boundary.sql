create table if not exists private.asaas_checkouts(
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id),
  amount_cents integer not null check(amount_cents > 0),
  status text not null default 'created' check(status in ('created','active','paid','cancelled','expired')),
  customer_reference text,
  subscription_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asaas_checkouts_user_created_idx
  on private.asaas_checkouts(user_id, created_at desc);

create index if not exists asaas_checkouts_customer_idx
  on private.asaas_checkouts(customer_reference)
  where customer_reference is not null;

revoke all on private.asaas_checkouts from public, anon, authenticated;

create or replace function public.record_asaas_checkout(
  p_checkout_id text,
  p_user uuid,
  p_plan text,
  p_amount_cents integer
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  expected integer;
begin
  if p_checkout_id is null or length(p_checkout_id) not between 8 and 200
     or p_plan not in ('pro','premium')
     or p_amount_cents <= 0
  then
    raise exception 'INVALID_CHECKOUT';
  end if;

  perform 1 from public.profiles where id=p_user;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  select monthly_price_cents into expected
  from public.plans
  where id=p_plan;

  if expected is null or expected <> p_amount_cents then
    raise exception 'PRICE_MISMATCH';
  end if;

  insert into private.asaas_checkouts(id,user_id,plan_id,amount_cents,status)
  values(p_checkout_id,p_user,p_plan,p_amount_cents,'created')
  on conflict(id) do update
  set updated_at=now();

  return 'accepted';
end
$$;

revoke all on function public.record_asaas_checkout(text,uuid,text,integer)
  from public, anon, authenticated;
grant execute on function public.record_asaas_checkout(text,uuid,text,integer)
  to service_role;

create or replace function public.apply_asaas_billing_event(
  p_event_id text,
  p_hash text,
  p_event text,
  p_checkout_id text,
  p_customer text,
  p_subscription text,
  p_payment_id text,
  p_due_date date,
  p_event_at timestamptz
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  existing_hash text;
  c private.asaas_checkouts;
  target_user uuid;
begin
  if p_event_id is null or length(p_event_id) not between 4 and 220
     or p_hash is null or length(p_hash)<>64
     or p_event_at is null or p_event_at > now()+interval '10 minutes'
  then
    raise exception 'INVALID_EVENT';
  end if;

  if p_event not in (
    'CHECKOUT_CREATED','CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED',
    'SUBSCRIPTION_CREATED','SUBSCRIPTION_UPDATED','SUBSCRIPTION_INACTIVATED','SUBSCRIPTION_DELETED',
    'PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE',
    'PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  ) then
    return 'ignored';
  end if;

  select payload_hash into existing_hash
  from private.billing_events
  where id=p_event_id;

  if found then
    if existing_hash<>p_hash then raise exception 'EVENT_COLLISION'; end if;
    return 'duplicate';
  end if;

  insert into private.billing_events(id,payload_hash)
  values(p_event_id,p_hash);

  if p_event like 'CHECKOUT_%' then
    if p_checkout_id is null then return 'unmatched'; end if;

    select * into c
    from private.asaas_checkouts
    where id=p_checkout_id
    for update;

    if not found then return 'unmatched'; end if;

    update private.asaas_checkouts
    set status=case p_event
      when 'CHECKOUT_CREATED' then 'active'
      when 'CHECKOUT_PAID' then 'paid'
      when 'CHECKOUT_CANCELED' then 'cancelled'
      when 'CHECKOUT_EXPIRED' then 'expired'
      else status end,
      customer_reference=coalesce(p_customer,customer_reference),
      updated_at=now()
    where id=p_checkout_id;

    if p_event='CHECKOUT_PAID' then
      insert into public.subscriptions(
        user_id,plan_id,status,provider_reference,
        provider_customer_reference,provider_price_reference,
        period_end,last_event_at
      )
      values(
        c.user_id,c.plan_id,'active',null,
        p_customer,'asaas-checkout:'||p_checkout_id,
        p_event_at+interval '1 month',p_event_at
      )
      on conflict(user_id) do update
      set plan_id=excluded.plan_id,
          status='active',
          provider_customer_reference=coalesce(excluded.provider_customer_reference,public.subscriptions.provider_customer_reference),
          provider_price_reference=excluded.provider_price_reference,
          period_end=greatest(public.subscriptions.period_end,excluded.period_end),
          last_event_at=greatest(public.subscriptions.last_event_at,excluded.last_event_at),
          updated_at=now();
    end if;

    return 'accepted';
  end if;

  if p_event like 'SUBSCRIPTION_%' then
    if p_subscription is null then return 'unmatched'; end if;

    select user_id into target_user
    from public.subscriptions
    where provider_reference=p_subscription
    limit 1;

    if target_user is null and p_customer is not null then
      select user_id into target_user
      from public.subscriptions
      where provider_customer_reference=p_customer
      order by updated_at desc
      limit 1;
    end if;

    if target_user is null and p_customer is not null then
      select user_id into target_user
      from private.asaas_checkouts
      where customer_reference=p_customer and status='paid'
      order by created_at desc
      limit 1;
    end if;

    if target_user is null then return 'unmatched'; end if;

    update public.subscriptions
    set provider_reference=p_subscription,
        provider_customer_reference=coalesce(p_customer,provider_customer_reference),
        status=case
          when p_event in ('SUBSCRIPTION_INACTIVATED','SUBSCRIPTION_DELETED') then 'cancelled'
          else status
        end,
        last_event_at=greatest(last_event_at,p_event_at),
        updated_at=now()
    where user_id=target_user;

    update private.asaas_checkouts
    set subscription_reference=p_subscription,
        customer_reference=coalesce(p_customer,customer_reference),
        updated_at=now()
    where user_id=target_user and status='paid';

    return 'accepted';
  end if;

  if p_event like 'PAYMENT_%' then
    if p_subscription is null then return 'ignored'; end if;

    select user_id into target_user
    from public.subscriptions
    where provider_reference=p_subscription
    limit 1;

    if target_user is null and p_customer is not null then
      select user_id into target_user
      from public.subscriptions
      where provider_customer_reference=p_customer
      order by updated_at desc
      limit 1;
    end if;

    if target_user is null then return 'unmatched'; end if;

    if p_event in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') then
      update public.subscriptions
      set status='active',
          provider_reference=p_subscription,
          provider_customer_reference=coalesce(p_customer,provider_customer_reference),
          period_end=greatest(
            period_end,
            coalesce(p_due_date::timestamptz + interval '1 month',p_event_at+interval '1 month')
          ),
          last_event_at=greatest(last_event_at,p_event_at),
          updated_at=now()
      where user_id=target_user;
    elsif p_event='PAYMENT_OVERDUE' then
      update public.subscriptions
      set status='past_due',
          last_event_at=greatest(last_event_at,p_event_at),
          updated_at=now()
      where user_id=target_user;
    elsif p_event in ('PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE') then
      update public.subscriptions
      set status='failed',
          period_end=least(period_end,now()),
          last_event_at=greatest(last_event_at,p_event_at),
          updated_at=now()
      where user_id=target_user;
    elsif p_event='PAYMENT_AWAITING_CHARGEBACK_REVERSAL' then
      update public.subscriptions
      set status='past_due',
          last_event_at=greatest(last_event_at,p_event_at),
          updated_at=now()
      where user_id=target_user;
    end if;

    return 'accepted';
  end if;

  return 'ignored';
end
$$;

revoke all on function public.apply_asaas_billing_event(
  text,text,text,text,text,text,text,date,timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_asaas_billing_event(
  text,text,text,text,text,text,text,date,timestamptz
) to service_role;