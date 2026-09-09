-- Remediation for the notify-new-lead abuse vector found in the
-- pre-publication audit: an unauthenticated caller could loop
-- /api/notify-new-lead on any contact id (enumerable via the old
-- anon SELECT policy) to trigger unlimited real Resend/Twilio sends.

-- notified_at makes agent notification idempotent per lead (not per
-- contact -- a past client inquiring again about a different property
-- is a genuinely new lead and should still notify Tyler, so the claim
-- is scoped to the lead row, not the contact). An atomic
-- `update ... where notified_at is null` (see lib/notify-agent.ts)
-- caps real sends to at most one per lead, ever, regardless of how
-- many times notification is requested for it.
alter table leads add column if not exists notified_at timestamptz;

-- Backfill existing leads as already-notified. Without this, the
-- idempotency guard above would treat every historical lead as
-- never-notified the moment it's deployed, letting anyone who still
-- has the old enumerated id list trigger one real send per existing
-- row in a single burst.
update leads set notified_at = created_at where notified_at is null;

-- Generic fixed-window rate limit store, keyed by an arbitrary bucket
-- string (e.g. "leads:contact:<ip>"). Serverless instances don't share
-- memory, so counting requires a shared, persistent store -- see
-- lib/rate-limit.ts. Locked down like every other non-public table:
-- no anon policy, service-role only.
create table if not exists rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_created_idx
  on rate_limit_hits (bucket, created_at);

alter table rate_limit_hits enable row level security;
