-- Move is_admin() out of the API-exposed public schema so it can't be called
-- via /rest/v1/rpc, and index the remaining foreign keys.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'card_formats','format_spots','contacts','campaigns','campaign_spots',
    'activities','follow_ups','qr_codes','scans','goals'
  ] loop
    execute format('drop policy "admin all" on public.%I', t);
    execute format(
      'create policy "admin all" on public.%I for all to authenticated
       using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

drop function public.is_admin();

create index if not exists activities_campaign_id_idx on public.activities (campaign_id);
create index if not exists campaigns_format_id_idx on public.campaigns (format_id);
create index if not exists follow_ups_campaign_id_idx on public.follow_ups (campaign_id);
create index if not exists follow_ups_contact_id_idx on public.follow_ups (contact_id);
create index if not exists qr_codes_campaign_id_idx on public.qr_codes (campaign_id);
create index if not exists qr_codes_campaign_spot_id_idx on public.qr_codes (campaign_spot_id);
create index if not exists qr_codes_contact_id_idx on public.qr_codes (contact_id);
