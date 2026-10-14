-- Phase 1 database checks. Run after migrations against a disposable database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase1_checks.sql
-- Everything runs in a transaction and is rolled back.

begin;

do $$
declare
  cid uuid;
  fin record;
  n int;
begin
  -- Acceptance test 6: a 9x12 campaign gets exactly 15 spots with the right sizes and prices.
  insert into campaigns (name, format_id, postage_cost_cents, print_cost_cents, other_cost_cents)
  values ('Check 9x12', '9a120000-0000-4000-8000-000000000001', 250000, 150000, 10000)
  returning id into cid;

  select count(*) into n from campaign_spots where campaign_id = cid;
  assert n = 15, format('expected 15 spots, got %s', n);

  select count(*) into n from campaign_spots where campaign_id = cid
    and code = 'F1' and side = 'front' and width_in = 5.5 and height_in = 3.5 and price_cents = 125000;
  assert n = 1, 'F1 should be a 5.5x3.5 featured double at $1,250';

  select count(*) into n from campaign_spots where campaign_id = cid
    and code like 'F%' and code <> 'F1' and width_in = 2.7 and height_in = 3.5 and price_cents = 70000;
  assert n = 6, 'F2-F7 should be 2.7x3.5 singles at $700';

  select count(*) into n from campaign_spots where campaign_id = cid
    and side = 'back' and width_in = 2.7 and height_in = 3.4 and price_cents = 60000;
  assert n = 8, 'B1-B8 should be 2.7x3.4 singles at $600';

  -- Acceptance test 5: breakeven and profit match a hand calculation.
  update campaign_spots set status = 'sold', sold_price_cents = price_cents
    where campaign_id = cid and code = 'F1';
  update campaign_spots set status = 'sold', sold_price_cents = 60000, paid_cents = 30000
    where campaign_id = cid and code in ('F2', 'B1');

  select * into fin from campaign_financials where campaign_id = cid;
  assert fin.revenue_cents = 245000, format('revenue %s', fin.revenue_cents);
  assert fin.collected_cents = 60000, format('collected %s', fin.collected_cents);
  assert fin.cost_cents = 410000, format('cost %s', fin.cost_cents);
  assert fin.profit_cents = -165000, format('profit %s', fin.profit_cents);
  assert fin.breakeven_pct = 59.8, format('breakeven %s', fin.breakeven_pct);
  assert fin.spots_sold = 3 and fin.spots_open = 12, 'spot counts';

  -- sold_at is set on sale and cleared when the spot reopens.
  select count(*) into n from campaign_spots where campaign_id = cid and sold_at is not null;
  assert n = 3, 'sold_at set on sold spots';
  update campaign_spots set status = 'open' where campaign_id = cid and code = 'B1';
  select count(*) into n from campaign_spots where campaign_id = cid and code = 'B1' and sold_at is null;
  assert n = 1, 'sold_at cleared on reopen';

  -- The community format: 15 for sale plus one house spot.
  insert into campaigns (name, format_id) values ('Check community', '6a250000-0000-4000-8000-000000000002')
  returning id into cid;
  select count(*) into n from campaign_spots where campaign_id = cid and status = 'open' and price_cents = 25000;
  assert n = 15, format('expected 15 open community spots, got %s', n);
  select count(*) into n from campaign_spots where campaign_id = cid and status = 'house';
  assert n = 1, 'expected one house spot';

  raise notice 'Phase 1 database checks passed';
end $$;

rollback;
