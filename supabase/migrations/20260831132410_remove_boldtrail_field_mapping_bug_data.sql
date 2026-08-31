-- Removes two rows: the real production row created by Tyler's live
-- Zapier Action-step test while the route still had the camelCase/
-- snake_case field-name mismatch bug (name landed as the "BoldTrail
-- Lead" fallback, stage as 'new', score as null -- all wrong), and the
-- local row used to re-verify the fix against the real payload shape.
-- Delete by exact email match, so this is a no-op (and safe to re-run)
-- on any database that never had these rows, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email in ('test0@ire.dev', 'test0-refix@ire.dev')
);
delete from contacts where email in ('test0@ire.dev', 'test0-refix@ire.dev');
