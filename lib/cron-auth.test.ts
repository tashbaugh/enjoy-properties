import { describe, it, expect, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { isAuthorizedCron } from './cron-auth';

function requestWithAuth(header: string | null): NextRequest {
  return {
    headers: { get: (name: string) => (name === 'authorization' ? header : null) },
  } as unknown as NextRequest;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isAuthorizedCron', () => {
  it('rejects every request when CRON_SECRET is unset, even "Bearer undefined"', () => {
    vi.stubEnv('CRON_SECRET', '');
    expect(isAuthorizedCron(requestWithAuth('Bearer undefined'))).toBe(false);
    expect(isAuthorizedCron(requestWithAuth('Bearer secret'))).toBe(false);
  });

  it('rejects an incorrect secret', () => {
    vi.stubEnv('CRON_SECRET', 'the-real-secret');
    expect(isAuthorizedCron(requestWithAuth('Bearer wrong-secret'))).toBe(false);
  });

  it('rejects a missing authorization header', () => {
    vi.stubEnv('CRON_SECRET', 'the-real-secret');
    expect(isAuthorizedCron(requestWithAuth(null))).toBe(false);
  });

  it('accepts the correct secret', () => {
    vi.stubEnv('CRON_SECRET', 'the-real-secret');
    expect(isAuthorizedCron(requestWithAuth('Bearer the-real-secret'))).toBe(true);
  });
});
