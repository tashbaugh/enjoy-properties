import { describe, it, expect, vi, beforeEach } from 'vitest';

const parseMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock };
  },
}));

const { draftWelcomeMessageSlots } = await import('./claude-welcome-message');

const CONTEXT_WITH_SEARCH = { firstName: 'Jane', propertyType: 'single-family', bedrooms: 3 };
const CONTEXT_WITHOUT_SEARCH = { firstName: 'Jane' };

beforeEach(() => {
  parseMock.mockReset();
});

describe('draftWelcomeMessageSlots -- no usable search context', () => {
  it('returns the fallback without calling the model', async () => {
    const result = await draftWelcomeMessageSlots(CONTEXT_WITHOUT_SEARCH);
    expect(result.source).toBe('fallback');
    expect(parseMock).not.toHaveBeenCalled();
  });
});

describe('draftWelcomeMessageSlots -- model call fails (B7b)', () => {
  it('returns the fallback and does not throw when the API call rejects', async () => {
    parseMock.mockRejectedValue(new Error('invalid_request_error: spend limit reached'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await draftWelcomeMessageSlots(CONTEXT_WITH_SEARCH);

    expect(result.source).toBe('fallback');
    expect(result.search_context_sentence).toBeTruthy();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('draftWelcomeMessageSlots -- model call succeeds (B7)', () => {
  it('marks the result source as "model" and returns the parsed slots', async () => {
    parseMock.mockResolvedValue({
      parsed_output: {
        search_context_sentence: 'a sentence about 3-bedroom single-family homes',
        search_context_short: '3BR single-family search',
      },
    });

    const result = await draftWelcomeMessageSlots(CONTEXT_WITH_SEARCH);

    expect(result.source).toBe('model');
    expect(result.search_context_sentence).toBe('a sentence about 3-bedroom single-family homes');
  });

  it('falls back when the model returns no parsed output', async () => {
    parseMock.mockResolvedValue({ parsed_output: null });

    const result = await draftWelcomeMessageSlots(CONTEXT_WITH_SEARCH);

    expect(result.source).toBe('fallback');
  });
});
