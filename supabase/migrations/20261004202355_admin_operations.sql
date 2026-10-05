-- Administrative operations retain server-owned authorization and immutable audit events.
create function public.admin_reports() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if not public.is_admin() then raise exception 'FORBIDDEN';end if;
return coalesce((select jsonb_agg(to_jsonb(r)) from (select r.id,r.question_id,q.statement,r.reason,r.detail,r.status,r.created_at from public.question_reports r join public.questions q on q.id=r.question_id order by r.created_at desc limit 100)r),'[]'::jsonb);end $$;
create function public.admin_resolve_report(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin if not public.is_admin() then raise exception 'FORBIDDEN';end if;
if p_status not in ('review','resolved','rejected') then raise exception 'INVALID_INPUT';end if;
update public.question_reports set status=p_status where id=p_id;if not found then raise exception 'NOT_FOUND';end if;
insert into private.audit_logs(actor,action,entity_id) values(auth.uid(),'report:'||p_status,p_id);end $$;
create function public.admin_record_cost(p_category text,p_amount numeric,p_currency text,p_period date) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;begin if coalesce(public.admin_role(),'') not in ('SUPER_ADMIN','FINANCE_ADMIN') then raise exception 'FORBIDDEN';end if;
if p_amount is null or p_amount<0 or p_amount>99999999 or p_period is null then raise exception 'INVALID_INPUT';end if;
insert into private.cost_entries(category,amount,currency,period,created_by) values(p_category,p_amount,p_currency,p_period,auth.uid()) returning id into result;
insert into private.audit_logs(actor,action,entity_id) values(auth.uid(),'cost:record',result);return result;end $$;
revoke all on function public.admin_reports(),public.admin_resolve_report(uuid,text),public.admin_record_cost(text,numeric,text,date) from public,anon;
grant execute on function public.admin_reports(),public.admin_resolve_report(uuid,text),public.admin_record_cost(text,numeric,text,date) to authenticated;

