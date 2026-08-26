-- Generic key/value table for site-wide defaults that need scheduled
-- refresh, starting with the calculator's mortgage rate (see
-- docs/phase2-cashflow-calculator-spec.md §6). Locked down like every
-- other non-public table -- no anon policy at all. The client never
-- reads this directly; app/api/mortgage-rate/route.ts reads it
-- server-side with the service-role key and returns only the one
-- value the calculator needs.

create table if not exists site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_config enable row level security;
