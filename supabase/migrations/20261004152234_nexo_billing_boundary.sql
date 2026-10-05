alter table public.subscriptions add column last_event_at timestamptz not null default '-infinity';
create function public.apply_billing_event(p_id text,p_hash text,p_user uuid,p_plan text,p_status text,p_period_end timestamptz,p_created_at timestamptz) returns text language plpgsql security definer set search_path='' as $$
declare existing text;begin
 if length(p_id) not between 1 and 150 or length(p_hash)<>64 or p_created_at>now()+interval '5 minutes' then raise exception 'INVALID_EVENT';end if;
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'USER_NOT_FOUND';end if;
 select payload_hash into existing from private.billing_events where id=p_id;
 if found then if existing<>p_hash then raise exception 'EVENT_COLLISION';end if;return 'duplicate';end if;
 insert into private.billing_events(id,payload_hash) values(p_id,p_hash);
 insert into public.subscriptions(user_id,plan_id,status,period_end,last_event_at) values(p_user,p_plan,p_status,p_period_end,p_created_at)
 on conflict(user_id) do update set plan_id=excluded.plan_id,status=excluded.status,period_end=excluded.period_end,last_event_at=excluded.last_event_at,updated_at=now() where public.subscriptions.last_event_at<excluded.last_event_at;
 return 'accepted';
end $$;
revoke all on function public.apply_billing_event(text,text,uuid,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_billing_event(text,text,uuid,text,text,timestamptz,timestamptz) to service_role;
