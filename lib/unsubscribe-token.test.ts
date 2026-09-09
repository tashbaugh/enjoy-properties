import { describe, it, expect, beforeEach } from 'vitest';
import { buildUnsubscribeToken, verifyUnsubscribeToken } from './unsubscribe-token';

const CONTACT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_CONTACT_ID = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  process.env.UNSUBSCRIBE_SECRET = 'test-secret-do-not-use-in-prod';
});

describe('sign/verify round trip', () => {
  it('verifies a token it just built, returning the original contact id', () => {
    const token = buildUnsubscribeToken(CONTACT_ID);
    expect(verifyUnsubscribeToken(token)).toBe(CONTACT_ID);
  });

  it('produces different tokens for different contact ids', () => {
    const tokenA = buildUnsubscribeToken(CONTACT_ID);
    const tokenB = buildUnsubscribeToken(OTHER_CONTACT_ID);
    expect(tokenA).not.toBe(tokenB);
  });
});

describe('tampered token rejection', () => {
  it('rejects a token with the contact id swapped but the original signature kept', () => {
    const token = buildUnsubscribeToken(CONTACT_ID);
    const [, signature] = token.split('.');
    expect(verifyUnsubscribeToken(`${OTHER_CONTACT_ID}.${signature}`)).toBeNull();
  });

  it('rejects a token with a single character flipped in the signature', () => {
    const token = buildUnsubscribeToken(CONTACT_ID);
    const [contactId, signature] = token.split('.');
    const flippedChar = signature[0] === 'a' ? 'b' : 'a';
    expect(verifyUnsubscribeToken(`${contactId}.${flippedChar}${signature.slice(1)}`)).toBeNull();
  });

  it('rejects a truncated signature (length mismatch)', () => {
    const token = buildUnsubscribeToken(CONTACT_ID);
    const [contactId, signature] = token.split('.');
    expect(verifyUnsubscribeToken(`${contactId}.${signature.slice(0, -4)}`)).toBeNull();
  });

  it('rejects a signature with extra characters appended (length mismatch)', () => {
    const token = buildUnsubscribeToken(CONTACT_ID);
    const [contactId, signature] = token.split('.');
    expect(verifyUnsubscribeToken(`${contactId}.${signature}extra`)).toBeNull();
  });
});

describe('wrong-secret rejection', () => {
  it('rejects a token signed under a different secret', () => {
    process.env.UNSUBSCRIBE_SECRET = 'secret-one';
    const token = buildUnsubscribeToken(CONTACT_ID);

    process.env.UNSUBSCRIBE_SECRET = 'secret-two';
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });
});

describe('malformed input', () => {
  it('rejects an empty string', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
  });

  it('rejects a token missing the signature segment', () => {
    expect(verifyUnsubscribeToken(CONTACT_ID)).toBeNull();
  });

  it('rejects a token missing the contact id segment', () => {
    expect(verifyUnsubscribeToken('.somesignature')).toBeNull();
  });
});
