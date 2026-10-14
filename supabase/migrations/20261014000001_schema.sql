-- Mailer CRM: core schema (all tables from the spec)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- One-row-per-admin table. Ryan's Supabase auth user id goes here.
create table public.admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Card formats
-- ---------------------------------------------------------------------------

create table public.card_formats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  name text not null,
  width_in numeric not null check (width_in > 0),
  height_in numeric not null check (height_in > 0),
  homes_default int check (homes_default >= 0),
  notes text
);

create table public.format_spots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  format_id uuid not null references public.card_formats on delete cascade,
  code text not null,
  side text not null check (side in ('front','back')),
  size_label text not null,
  width_in numeric not null check (width_in > 0),
  height_in numeric not null check (height_in > 0),
  default_price_cents int not null default 0 check (default_price_cents >= 0),
  default_status text not null default 'open' check (default_status in ('open','house')),
  x_in numeric,              -- position on the card for the spot board (optional)
  y_in numeric,
  sort_order int not null default 0,
  unique (format_id, code)
);
create index on public.format_spots (format_id, sort_order);

-- ---------------------------------------------------------------------------
-- Contacts (CRM). Created before campaign_spots because spots reference it.
-- ---------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  category text,
  website text,
  facebook_url text,
  address text,
  source text,
  pipeline_stage text not null default 'lead'
    check (pipeline_stage in ('lead','contacted','interested','customer','lost')),
  tags text[] not null default '{}',
  notes text,
  portal_slug text unique,
  portal_password_hash text,
  portal_enabled boolean not null default false
);
create index on public.contacts (pipeline_stage);
create index on public.contacts (lower(business_name));

-- ---------------------------------------------------------------------------
-- Campaigns and their spots
-- ---------------------------------------------------------------------------

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  name text not null,
  format_id uuid not null references public.card_formats,
  area text,
  routes text,
  homes int check (homes >= 0),
  status text not null default 'planning'
    check (status in ('planning','selling','production','mailed','closed')),
  sales_open_date date,
  sales_deadline date,
  artwork_deadline date,
  drop_date date,
  postage_cost_cents int not null default 0 check (postage_cost_cents >= 0),
  print_cost_cents int not null default 0 check (print_cost_cents >= 0),
  other_cost_cents int not null default 0 check (other_cost_cents >= 0),
  min_spots_to_go int check (min_spots_to_go >= 0),
  run_months int not null default 1 check (run_months >= 1),
  notes text
);

create table public.campaign_spots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  campaign_id uuid not null references public.campaigns on delete cascade,
  code text not null,
  side text not null check (side in ('front','back')),
  size_label text not null,
  width_in numeric not null,
  height_in numeric not null,
  price_cents int not null default 0 check (price_cents >= 0),
  category text,
  status text not null default 'open' check (status in ('open','held','sold','house')),
  contact_id uuid references public.contacts on delete set null,
  sold_price_cents int check (sold_price_cents >= 0),
  paid_status text not null default 'unpaid'
    check (paid_status in ('unpaid','partial','paid','refunded')),
  paid_cents int not null default 0 check (paid_cents >= 0),
  payment_method text check (payment_method in ('stripe','check','cash','zelle','other')),
  stripe_ref text,
  creative_status text not null default 'none'
    check (creative_status in ('none','assets_in','proof_sent','approved')),
  sold_at timestamptz,
  x_in numeric,
  y_in numeric,
  sort_order int not null default 0,
  unique (campaign_id, code)
);
create index on public.campaign_spots (campaign_id, sort_order);
create index on public.campaign_spots (contact_id);

-- When a campaign is created, copy its format's spots into campaign_spots.
create or replace function public.copy_format_spots_to_campaign()
returns trigger
language plpgsql
as $$
begin
  insert into public.campaign_spots
    (campaign_id, code, side, size_label, width_in, height_in, price_cents, status,
     x_in, y_in, sort_order)
  select new.id, fs.code, fs.side, fs.size_label, fs.width_in, fs.height_in,
         fs.default_price_cents, fs.default_status, fs.x_in, fs.y_in, fs.sort_order
  from public.format_spots fs
  where fs.format_id = new.format_id;
  return new;
end;
$$;

create trigger campaigns_copy_format_spots
after insert on public.campaigns
for each row execute function public.copy_format_spots_to_campaign();

-- Keep sold_at in step with status changes.
create or replace function public.campaign_spot_sold_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'sold' and (tg_op = 'INSERT' or old.status is distinct from 'sold') then
    new.sold_at = coalesce(new.sold_at, now());
  elsif new.status <> 'sold' then
    new.sold_at = null;
  end if;
  return new;
end;
$$;

create trigger campaign_spots_sold_at
before insert or update of status on public.campaign_spots
for each row execute function public.campaign_spot_sold_at();

-- ---------------------------------------------------------------------------
-- CRM activity
-- ---------------------------------------------------------------------------

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  contact_id uuid not null references public.contacts on delete cascade,
  campaign_id uuid references public.campaigns on delete set null,
  channel text not null check (channel in ('call','text','fb_dm','email','in_person','other')),
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  summary text not null,
  occurred_at timestamptz not null default now()
);
create index on public.activities (contact_id, occurred_at desc);
create index on public.activities (occurred_at);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  contact_id uuid not null references public.contacts on delete cascade,
  campaign_id uuid references public.campaigns on delete set null,
  due_date date not null,
  note text,
  done_at timestamptz
);
create index on public.follow_ups (due_date) where done_at is null;

-- ---------------------------------------------------------------------------
-- QR codes and scans
-- ---------------------------------------------------------------------------

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique check (slug ~ '^[0-9A-Za-z]{6,8}$'),
  contact_id uuid references public.contacts on delete set null,
  campaign_id uuid references public.campaigns on delete set null,
  campaign_spot_id uuid references public.campaign_spots on delete set null,
  label text,
  destination_url text not null,
  add_utm boolean not null default true,
  active boolean not null default true
);

create table public.scans (
  id bigserial primary key,
  qr_code_id uuid not null references public.qr_codes on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  device text check (device in ('ios','android','desktop','other')),
  city text,
  region text,
  is_unique boolean not null default false
);
create index on public.scans (qr_code_id, scanned_at);
create index on public.scans (qr_code_id, ip_hash, scanned_at);

-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  period text not null unique check (period ~ '^\d{4}-\d{2}$'),
  revenue_goal_cents int check (revenue_goal_cents >= 0),
  spots_goal int check (spots_goal >= 0)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'card_formats','format_spots','contacts','campaigns','campaign_spots',
    'activities','follow_ups','qr_codes','goals'
  ] loop
    execute format(
      'create trigger %I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
