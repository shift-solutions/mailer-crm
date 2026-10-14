-- Derived values and row-level security

-- Campaign financials: revenue, cost, profit, breakeven, spot counts.
-- security_invoker so RLS on the underlying tables still applies.
create or replace view public.campaign_financials
with (security_invoker = true)
as
select
  c.id as campaign_id,
  coalesce(sum(s.sold_price_cents) filter (where s.status = 'sold'), 0)::bigint as revenue_cents,
  coalesce(sum(s.paid_cents), 0)::bigint as collected_cents,
  (c.postage_cost_cents + c.print_cost_cents + c.other_cost_cents)::bigint as cost_cents,
  (coalesce(sum(s.sold_price_cents) filter (where s.status = 'sold'), 0)
    - (c.postage_cost_cents + c.print_cost_cents + c.other_cost_cents))::bigint as profit_cents,
  case
    when (c.postage_cost_cents + c.print_cost_cents + c.other_cost_cents) = 0 then null
    else round(
      coalesce(sum(s.sold_price_cents) filter (where s.status = 'sold'), 0)::numeric
      / (c.postage_cost_cents + c.print_cost_cents + c.other_cost_cents) * 100, 1)
  end as breakeven_pct,
  count(s.id)::int as spots_total,
  count(s.id) filter (where s.status = 'sold')::int as spots_sold,
  count(s.id) filter (where s.status = 'held')::int as spots_held,
  count(s.id) filter (where s.status = 'open')::int as spots_open,
  count(s.id) filter (where s.status = 'house')::int as spots_house
from public.campaigns c
left join public.campaign_spots s on s.campaign_id = c.id
group by c.id;

-- ---------------------------------------------------------------------------
-- RLS: admin-only for every table. The QR redirect and client portal use the
-- service-role key on the server, which bypasses RLS.
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'card_formats','format_spots','contacts','campaigns','campaign_spots',
    'activities','follow_ups','qr_codes','scans','goals'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin all" on public.%I for all to authenticated
       using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Lock down anon entirely; nothing is public through the Data API.
revoke all on all tables in schema public from anon;
revoke execute on function public.is_admin() from anon;
