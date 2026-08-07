declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

/**
 * Fires a lead-conversion event to both ad platforms. Call this once,
 * right after a successful contacts/leads insert in ContactForm — not
 * before, so we only report conversions Supabase actually recorded.
 */
export function trackLeadConversion(contactType: string) {
  if (typeof window === 'undefined') return;

  // Google Ads conversion
  window.gtag?.('event', 'conversion', {
    send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL}`,
  });

  // Meta Pixel standard Lead event, tagged with contact_type for later segmentation
  window.fbq?.('track', 'Lead', { content_category: contactType });
}
