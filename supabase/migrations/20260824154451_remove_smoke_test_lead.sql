-- Removes the one contacts/leads row inserted while verifying the
-- production RLS fix in 20260824154318_fix_anon_grants.sql. Delete by
-- exact id, so this is a no-op (and safe to re-run) on any database
-- that never had this row, e.g. the preview project.

delete from leads where contact_id = 'f17e2a7a-e332-4454-82df-323e229649f9';
delete from contacts where id = 'f17e2a7a-e332-4454-82df-323e229649f9';
