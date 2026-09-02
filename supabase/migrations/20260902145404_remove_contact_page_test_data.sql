-- Removes the two contacts/leads created while verifying the new
-- /contact page's reason-select mapping (renting -> buyer + lease tag,
-- not-sure -> buyer, no tag) end-to-end via a real browser submission.
-- Delete by exact email match, so this is a no-op (and safe to re-run)
-- on any database that never had these rows, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email in (
    'contact-test-renting@example.com',
    'contact-test-notsure@example.com'
  )
);
delete from contacts where email in (
  'contact-test-renting@example.com',
  'contact-test-notsure@example.com'
);
