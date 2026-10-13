import { describe, it, expect } from 'vitest';
import { escapeHtml } from './html';

describe('escapeHtml', () => {
  it('escapes a script tag so it cannot execute', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes an injected anchor tag', () => {
    expect(escapeHtml('<a href="https://example.com">x</a>')).toBe(
      '&lt;a href=&quot;https://example.com&quot;&gt;x&lt;/a&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Smith & Sons')).toBe('Smith &amp; Sons');
  });

  it('escapes single and double quotes', () => {
    expect(escapeHtml(`O'Brien "The Closer"`)).toBe('O&#39;Brien &quot;The Closer&quot;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe');
  });
});
