-- Removes the contact/lead rows created while verifying the Phase 3
-- unsubscribe route and follow-up-reminders cron. Delete by exact
-- email match, so this is a no-op (and safe to re-run) on any database
-- that never had this row, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email = 'phase3-unsub-test@example.com'
);
delete from contacts where email = 'phase3-unsub-test@example.com';
