import { createHmac, timingSafeEqual } from 'crypto';

// Signed contact ID, not a raw ID -- prevents unsubscribing someone
// else's email by guessing/incrementing an ID (spec §2.4).
function sign(contactId: string): string {
  return createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!).update(contactId).digest('hex');
}

export function buildUnsubscribeToken(contactId: string): string {
  return `${contactId}.${sign(contactId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [contactId, providedSig] = token.split('.');
  if (!contactId || !providedSig) return null;

  const expectedSig = sign(contactId);
  const expected = Buffer.from(expectedSig);
  const provided = Buffer.from(providedSig);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  return contactId;
}
