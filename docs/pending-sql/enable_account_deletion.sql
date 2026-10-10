-- NOT APPLIED. Outside supabase/migrations intentionally.
-- Requires explicit approval, verified backup/restore and a disposable live test.
-- Do not paste into production as part of the normal handoff/deploy.
begin;
create or replace function public.delete_account_confirmed(p_confirmation text)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;
begin
  if p_confirmation is distinct from 'EXCLUIR' then
    raise exception 'CONFIRMATION_REQUIRED';
  end if;
  uid := private.assert_account_reauthentication();
  -- Serialize deletion for this account and recheck the live gate after locks.
  perform 1 from auth.users where id=uid for update;
  perform 1 from auth.sessions where user_id=uid order by id for update;
  uid := private.assert_account_reauthentication();
  -- Explicit revocation precedes deletion. Both statements affect only uid.
  delete from auth.sessions where user_id=uid;
  delete from auth.users where id=uid;
end $$;
revoke all on function public.delete_account_confirmed(text) from public,anon,authenticated,service_role;
grant execute on function public.delete_account_confirmed(text) to authenticated;
commit;
