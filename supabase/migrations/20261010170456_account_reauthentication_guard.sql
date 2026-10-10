-- Non-destructive containment: the legacy deletion RPC must not be callable
-- until the separately reviewed destructive implementation is released.
-- No accounts, sessions, progress or application rows are modified here.
revoke all on function public.delete_account() from public, anon, authenticated, service_role;
-- Retired generic-chat reservation has no remaining application caller.
revoke all on function public.reserve_ai() from public, anon, authenticated, service_role;

create or replace function private.assert_account_reauthentication()
returns uuid language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  claims jsonb := auth.jwt();
  sid uuid;
  epoch_now numeric := extract(epoch from now());
  needs_mfa boolean;
begin
  if uid is null or claims->>'sub' is distinct from uid::text
     or coalesce(claims->>'is_anonymous','false') <> 'false' then
    raise exception 'AUTH_REQUIRED';
  end if;
  if jsonb_typeof(claims->'exp') is distinct from 'number'
     or (claims->>'exp')::numeric <= epoch_now then
    raise exception 'SESSION_EXPIRED';
  end if;
  sid := nullif(claims->>'session_id','')::uuid;
  if sid is null or not exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=sid and s.user_id=uid
      and (s.not_after is null or s.not_after>now())
      and (u.banned_until is null or u.banned_until<=now())
      and u.deleted_at is null
  ) then raise exception 'SESSION_REVOKED'; end if;
  if exists(select 1 from private.admins where user_id=uid) then
    raise exception 'ADMIN_TRANSFER_REQUIRED';
  end if;
  -- Only the password flow is enabled. OAuth/OTP must not silently inherit it.
  -- Check signed AMR AND Auth's live record; fresh token issuance is insufficient.
  if jsonb_typeof(claims->'amr') is distinct from 'array' then
    raise exception 'REAUTH_REQUIRED';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(claims->'amr') m
    where m->>'method'='password' and jsonb_typeof(m->'timestamp')='number'
      and (m->>'timestamp')::numeric between epoch_now-300 and epoch_now+30
  ) or not exists (
    select 1 from auth.mfa_amr_claims a where a.session_id=sid
      and a.authentication_method='password'
      and a.updated_at between now()-interval '5 minutes' and now()+interval '30 seconds'
  ) then raise exception 'REAUTH_REQUIRED'; end if;
  select exists(select 1 from auth.mfa_factors where user_id=uid and status='verified') into needs_mfa;
  if needs_mfa and (
    claims->>'aal' is distinct from 'aal2'
    or not exists(select 1 from auth.sessions where id=sid and aal='aal2')
    or not exists (
      select 1 from jsonb_array_elements(claims->'amr') m
      where m->>'method'='totp' and jsonb_typeof(m->'timestamp')='number'
        and (m->>'timestamp')::numeric between epoch_now-300 and epoch_now+30
    ) or not exists (
      select 1 from auth.mfa_amr_claims a where a.session_id=sid
        and a.authentication_method='totp'
        and a.updated_at between now()-interval '5 minutes' and now()+interval '30 seconds'
    )
  ) then raise exception 'MFA_REAUTH_REQUIRED'; end if;
  return uid;
end $$;
revoke all on function private.assert_account_reauthentication() from public, anon, authenticated, service_role;

-- Read-only probe shared by the staged UI and tests. No caller-supplied identity.
create or replace function public.account_deletion_readiness()
returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform private.assert_account_reauthentication();
  return true;
end $$;
revoke all on function public.account_deletion_readiness() from public, anon, authenticated, service_role;
grant execute on function public.account_deletion_readiness() to authenticated;
