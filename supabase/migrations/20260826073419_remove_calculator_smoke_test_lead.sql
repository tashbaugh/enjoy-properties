-- Removes the contacts/leads row inserted while verifying the Phase 2
-- calculator end-to-end (docs/phase2-cashflow-calculator-spec.md). Delete
-- by exact email match, so this is a no-op (and safe to re-run) on any
-- database that never had this row, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email = 'calc-smoke-test@example.com'
);
delete from contacts where email = 'calc-smoke-test@example.com';
