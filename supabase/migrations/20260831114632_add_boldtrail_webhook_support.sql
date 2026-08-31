-- app/api/webhooks/boldtrail-lead (docs/handoff-boldtrail-webhook.md).

-- 'boldtrail' joins the existing source values for leads that arrive
-- via the BoldTrail -> Zapier webhook rather than the site's own forms.
alter table contacts drop constraint contacts_source_check;
alter table contacts add constraint contacts_source_check
  check (source in ('public_record', 'referral', 'content', 'ad', 'boldtrail'));

-- Full Zapier payload, stored verbatim. Covers every BoldTrail field the
-- handoff flags as "not yet mapped to an existing column" (geolocation,
-- BoldTrail's own source URL, drip status, lead details link, assigned
-- agent, email status, has-lender) in one column instead of one each --
-- same snapshot pattern as leads.calculator_inputs/calculator_results.
-- Also carries BoldTrail's raw lead-status string for stage values this
-- route doesn't yet have a mapping for, so the mapping table can grow
-- from real data instead of being guessed up front.
alter table leads add column if not exists raw_payload jsonb;
