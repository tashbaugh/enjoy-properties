-- Lead capture moved server-side (app/api/leads, using the
-- service-role client) to close the notify-new-lead abuse vector --
-- the browser no longer talks to contacts/leads directly, so anon
-- doesn't need any access to either table anymore. This brings them
-- in line with properties/interactions/content_pieces/site_config:
-- RLS enabled, zero anon policies, service-role only.

drop policy if exists "anon can insert contacts" on contacts;
drop policy if exists "anon can read contact id only" on contacts;
revoke select on contacts from anon;
revoke insert on contacts from anon;

drop policy if exists "anon can insert leads" on leads;
revoke insert on leads from anon;
