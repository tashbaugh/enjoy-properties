-- Removes the contact/lead rows created while verifying the BoldTrail
-- webhook end-to-end (auth gate, field mapping, idempotency, contact
-- merge). Delete by exact email match, so this is a no-op (and safe to
-- re-run) on any database that never had this row, e.g. the preview
-- project.

delete from leads where contact_id in (
  select id from contacts where email = 'test0@ire.dev'
);
delete from contacts where email = 'test0@ire.dev';
