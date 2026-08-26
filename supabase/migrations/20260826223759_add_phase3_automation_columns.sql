-- Phase 3 automation (docs/phase3-automation-spec.md §1).

-- leads: idempotency for the BoldTrail webhook -- Zapier polls every
-- 5-15 min and retries on transient failures, so the receiver needs a
-- way to recognize "already processed this lead" rather than
-- duplicating rows on retry.
alter table leads
  add column if not exists external_source text,
  add column if not exists external_id text;

create unique index if not exists leads_external_source_id_idx
  on leads (external_source, external_id)
  where external_id is not null;

-- contacts: CAN-SPAM/CTIA opt-out + SMS consent tracking -- required,
-- not optional. sms_consent defaults false for every contact and only
-- flips true after an affirmative reply to a dedicated opt-in text
-- (see spec §2.4); every send must check the relevant opted_out flag,
-- and every SMS specifically must check sms_consent, before sending.
alter table contacts
  add column if not exists email_opted_out boolean not null default false,
  add column if not exists sms_opted_out boolean not null default false,
  add column if not exists sms_consent boolean not null default false;
