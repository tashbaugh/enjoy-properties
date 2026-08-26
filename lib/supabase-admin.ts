import { createClient } from '@supabase/supabase-js';

// Service-role client for server-only routes (API routes, cron jobs).
// Never import this from a client component -- SUPABASE_SERVICE_ROLE_KEY
// bypasses RLS entirely. Kept separate from lib/supabase.ts (the anon
// client) so the two are never accidentally interchangeable.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
