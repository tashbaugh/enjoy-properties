-- Core schema per docs/lead-gen-system-build-plan.md section 3.
-- All 5 tables created up front (Phase 1 decision) even though only
-- contacts/leads are written to yet, to avoid a later migration when
-- Phase 3 (n8n) needs interactions.

create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  source text not null check (source in ('public_record', 'referral', 'content', 'ad')),
  contact_type text not null check (contact_type in ('buyer', 'seller', 'investor', 'past_client')),
  tags text[],
  created_at timestamptz not null default now(),
  last_contact_at timestamptz
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  address text,
  apn text,
  county_data jsonb,
  owner_name text,
  absentee_flag boolean not null default false,
  tax_delinquent_flag boolean not null default false,
  estimated_value numeric,
  notes text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  property_id uuid references properties (id) on delete set null,
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'nurturing', 'qualified', 'under_contract', 'closed', 'lost')),
  score integer,
  source_detail text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  channel text check (channel in ('email', 'sms', 'call', 'site_visit')),
  direction text check (direction in ('inbound', 'outbound')),
  content text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists content_pieces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pillar_post text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  derived_assets jsonb,
  published_at timestamptz
);

-- RLS: locked down by default (Phase 1 decision). Only contacts/leads get
-- explicit anon policies, since those are the only tables the public
-- ContactForm writes to. properties/interactions/content_pieces stay
-- owner/service-role only.
alter table contacts enable row level security;
alter table properties enable row level security;
alter table leads enable row level security;
alter table interactions enable row level security;
alter table content_pieces enable row level security;

-- contacts: anon can insert (public form submissions). Anon read access is
-- restricted to the `id` column only -- ContactForm needs the new row's id
-- back to link the leads insert, but must not be able to read name/email/
-- phone back out through the same public anon key that ships in the JS
-- bundle, which would let anyone query captured lead PII directly via the
-- REST API.
revoke select on contacts from anon;
grant select (id) on contacts to anon;

create policy "anon can insert contacts"
  on contacts for insert
  to anon
  with check (true);

create policy "anon can read contact id only"
  on contacts for select
  to anon
  using (true);

-- leads: anon can insert only. ContactForm never reads leads back.
create policy "anon can insert leads"
  on leads for insert
  to anon
  with check (true);
