-- Removes the contact/lead used for the real production notify-new-lead
-- test (confirming the actual email/SMS send, not just local logic).
-- Delete by exact email match, so this is a no-op (and safe to re-run)
-- on any database that never had this row, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email = 'prod-notify-test@example.com'
);
delete from contacts where email = 'prod-notify-test@example.com';
