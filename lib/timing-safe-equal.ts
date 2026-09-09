import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison. crypto.timingSafeEqual throws on
 * mismatched buffer lengths rather than returning false, so the length
 * check has to happen first -- that check itself only leaks length,
 * not content, which is the standard tradeoff for this pattern.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
