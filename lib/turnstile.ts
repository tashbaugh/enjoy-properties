const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerifyResult = { ok: true } | { ok: false; status: 400 | 503 };

/**
 * An unset secret or a failed request to Cloudflare returns 503, not
 * 400 -- those are this server's problem, not a sign the submitter is
 * a bot. A 503 here deliberately means "bot protection is down," never
 * "silently let the request through" -- that's the failure this exists
 * to fix (mirrors the BoldTrail webhook's convention of failing loudly
 * rather than silently disabling a safeguard).
 */
export async function verifyTurnstileToken(token: string, remoteIp: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('turnstile: TURNSTILE_SECRET_KEY is unset, bot protection is disabled');
    return { ok: false, status: 503 };
  }

  const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });

  let res: Response;
  try {
    res = await fetch(VERIFY_URL, { method: 'POST', body });
  } catch (err) {
    console.error('turnstile: siteverify request failed', err);
    return { ok: false, status: 503 };
  }

  const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
  if (!data?.success) {
    return { ok: false, status: 400 };
  }

  return { ok: true };
}
