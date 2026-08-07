const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
type UtmKey = (typeof UTM_KEYS)[number];
type UtmParams = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = 'ep_utm';

/**
 * Reads UTM params from the current URL and persists them for the session.
 * Call this once on initial page load (e.g. in a top-level layout or the
 * landing pages themselves). Only overwrites storage if the current URL
 * actually has UTM params — so navigating to /invest afterward doesn't
 * wipe out the original ad campaign attribution.
 */
export function captureUtmParams(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const captured: UtmParams = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) captured[key] = value;
  });

  if (Object.keys(captured).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  }
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Combines the page-level source detail (e.g. "landing-page") with any
 * captured UTM data into a single string for leads.source_detail. */
export function buildSourceDetail(pageDetail: string): string {
  const utm = getStoredUtmParams();
  if (!utm.utm_source) return pageDetail;

  const parts = [utm.utm_source, utm.utm_campaign, utm.utm_medium].filter(Boolean);
  return `${pageDetail} | ${parts.join('/')}`;
}

/** Returns 'ad' if this visit came from a tracked campaign, else falls
 * back to the page's default contact source. */
export function resolveContactSource(
  fallback: 'public_record' | 'referral' | 'content' | 'ad'
): 'public_record' | 'referral' | 'content' | 'ad' {
  const utm = getStoredUtmParams();
  return utm.utm_source ? 'ad' : fallback;
}
