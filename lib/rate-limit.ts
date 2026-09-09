import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Fixed-window rate limit backed by a Supabase table -- serverless
 * instances don't share memory, so counting requires a shared store.
 * Prunes hits for this bucket older than the window on every call, so
 * a given bucket never accumulates more than ~`limit` rows.
 *
 * Not perfectly race-proof under concurrent requests for the same
 * bucket (count-then-insert, not a single atomic statement) -- fine
 * for this project's threat model (a public lead-gen site, not a
 * high-concurrency API), especially since the real backstop against
 * unbounded spend is notify-agent's per-lead idempotency, not this.
 */
export async function checkRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  await supabaseAdmin.from('rate_limit_hits').delete().eq('bucket', bucket).lt('created_at', windowStart);

  const { count } = await supabaseAdmin
    .from('rate_limit_hits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', bucket)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= limit) {
    return false;
  }

  await supabaseAdmin.from('rate_limit_hits').insert({ bucket });
  return true;
}
