/**
 * Normalizes a US phone number to its last 10 digits for matching --
 * stored contacts.phone values aren't guaranteed to be in any single
 * format (ContactForm accepts free text), while inbound Twilio webhooks
 * always send E.164 (+12105551234). Comparing last-10-digit strings
 * sidesteps formatting differences without assuming either side's shape.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(-10);
}
