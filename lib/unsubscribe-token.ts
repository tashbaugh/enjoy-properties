import { createHmac } from 'crypto';
import { timingSafeStringEqual } from '@/lib/timing-safe-equal';

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
  if (!timingSafeStringEqual(expectedSig, providedSig)) {
    return null;
  }

  return contactId;
}
