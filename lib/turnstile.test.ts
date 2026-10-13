import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstileToken } from './turnstile';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('verifyTurnstileToken', () => {
  it('returns 503 without calling Cloudflare when TURNSTILE_SECRET_KEY is unset', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const result = await verifyTurnstileToken('some-token', '1.2.3.4');
    expect(result).toEqual({ ok: false, status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ok:true when Cloudflare reports success', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });

    const result = await verifyTurnstileToken('valid-token', '1.2.3.4');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns 400 when Cloudflare reports failure', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    fetchMock.mockResolvedValue({ json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) });

    const result = await verifyTurnstileToken('bad-token', '1.2.3.4');

    expect(result).toEqual({ ok: false, status: 400 });
  });

  it('returns 503 when the request to Cloudflare itself fails', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    fetchMock.mockRejectedValue(new Error('network error'));

    const result = await verifyTurnstileToken('some-token', '1.2.3.4');

    expect(result).toEqual({ ok: false, status: 503 });
  });

  it('returns 400 when Cloudflare returns an unparseable response', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    fetchMock.mockResolvedValue({ json: async () => { throw new Error('not json'); } });

    const result = await verifyTurnstileToken('some-token', '1.2.3.4');

    expect(result).toEqual({ ok: false, status: 400 });
  });
});
