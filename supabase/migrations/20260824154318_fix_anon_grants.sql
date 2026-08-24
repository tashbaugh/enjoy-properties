-- The original RLS policies on contacts/leads were applied manually
-- (outside CLI migration tracking) before this repo had a migrations
-- folder, which is why `supabase db push` found "anon can insert
-- contacts" already present and aborted before reaching the
-- column-level grants below -- ContactForm's `.select('id')` after
-- insert was failing in production with "permission denied for table
-- contacts" because that GRANT never actually ran.
--
-- Idempotent by construction (drop-then-create / revoke-then-grant)
-- so it converges to the correct end state regardless of whatever
-- partial state already exists on a given project.

revoke select on contacts from anon;
grant select (id) on contacts to anon;

drop policy if exists "anon can insert contacts" on contacts;
create policy "anon can insert contacts"
  on contacts for insert
  to anon
  with check (true);

drop policy if exists "anon can read contact id only" on contacts;
create policy "anon can read contact id only"
  on contacts for select
  to anon
  using (true);

drop policy if exists "anon can insert leads" on leads;
create policy "anon can insert leads"
  on leads for insert
  to anon
  with check (true);
