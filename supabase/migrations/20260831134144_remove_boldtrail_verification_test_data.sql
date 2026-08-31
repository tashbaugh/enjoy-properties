-- Removes two batches of test data:
-- 1. A contact with the literal string "Lead Email Address" as its
--    email -- debris from an early Zapier Action-step configuration
--    attempt where fields were typed as static label text instead of
--    mapped as dynamic variables, predating the field-mapping fix.
-- 2. The test0@ire.dev contact/leads/interactions from the successful
--    post-fix end-to-end verification (confirmed the welcome email
--    actually sends now that RESEND_API_KEY and
--    BROKERAGE_PHYSICAL_ADDRESS are both set).
--
-- Delete by exact email match, so this is a no-op (and safe to re-run)
-- on any database that never had these rows, e.g. the preview project.

delete from interactions where contact_id in (
  select id from contacts where email in ('Lead Email Address', 'test0@ire.dev')
);
delete from leads where contact_id in (
  select id from contacts where email in ('Lead Email Address', 'test0@ire.dev')
);
delete from contacts where email in ('Lead Email Address', 'test0@ire.dev');
