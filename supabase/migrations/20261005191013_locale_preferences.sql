-- Interface language is independent from educational content and billing currency.
alter table public.profiles
  add column ui_locale text check (ui_locale in ('pt-BR','en-US','es','fr','de','it','ja','ko','zh-CN','ru')),
  add column content_locale text not null default 'pt-BR' check (content_locale in ('pt-BR','en-US','es','fr','de','it','ja','ko','zh-CN','ru')),
  add column region text not null default 'BR' check (region ~ '^[A-Z]{2}$'),
  add column date_format text not null default 'auto' check (date_format in ('auto','dmy','mdy','ymd')),
  add column time_zone text not null default 'America/Sao_Paulo';

create function public.valid_time_zone(p_zone text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from pg_catalog.pg_timezone_names where name=p_zone);
$$;
revoke all on function public.valid_time_zone(text) from public,anon;
grant execute on function public.valid_time_zone(text) to authenticated,service_role;
alter table public.profiles add constraint valid_profile_time_zone check(public.valid_time_zone(time_zone));
grant update(ui_locale,content_locale,region,date_format,time_zone) on public.profiles to authenticated;
create policy own_locale_update on public.profiles for update to authenticated
  using ((select auth.uid())=id) with check ((select auth.uid())=id);
