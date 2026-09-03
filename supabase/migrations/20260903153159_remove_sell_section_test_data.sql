-- Removes the contact/lead created while verifying the new #sell
-- section's mapping (contact_type='seller', no tags, source_detail=
-- 'landing-page-sell') via a real browser submission. Delete by exact
-- email match, so this is a no-op (and safe to re-run) on any
-- database that never had this row, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email = 'sell-section-test@example.com'
);
delete from contacts where email = 'sell-section-test@example.com';
