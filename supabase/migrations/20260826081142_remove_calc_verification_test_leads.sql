-- Removes the two contacts/leads rows created while running the
-- explicit Phase 2 verification pass (live free-tier calc, in-place
-- unlock, calculator_inputs/calculator_results contents, tags,
-- source_detail, trackLeadConversion). Delete by exact email match, so
-- this is a no-op (and safe to re-run) on any database that never had
-- these rows, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email in (
    'calc-verify-1787731797494@example.com',
    'calc-verify-datalayer@example.com'
  )
);
delete from contacts where email in (
  'calc-verify-1787731797494@example.com',
  'calc-verify-datalayer@example.com'
);
