import { describe, it, expect } from 'vitest';
import { LeadRequestSchema } from './lead-validation';

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '2104190000',
    source: 'content',
    contactType: 'buyer',
    sourceDetail: 'landing-page',
    formSource: 'contact',
    ...overrides,
  };
}

describe('LeadRequestSchema -- accepts current form traffic', () => {
  // Exact values grepped from app/page.tsx, app/invest/page.tsx,
  // app/contact/page.tsx, components/CashFlowCalculator.tsx.
  const sourceDetails = [
    'landing-page',
    'landing-page-sell',
    'lease-tenant',
    'lease-landlord',
    'invest-page',
    'general-contact-page',
    'invest-page | calculator',
  ];

  it.each(sourceDetails)('accepts sourceDetail %s', (sourceDetail) => {
    const result = LeadRequestSchema.safeParse(baseBody({ sourceDetail }));
    expect(result.success).toBe(true);
  });

  it('accepts a sourceDetail with a UTM suffix appended by buildSourceDetail', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({ sourceDetail: 'invest-page | google/spring-promo/cpc' })
    );
    expect(result.success).toBe(true);
  });

  it('accepts the "lease" tag', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ tags: ['lease'] }));
    expect(result.success).toBe(true);
  });

  it('accepts the "calculator" tag with calculator form source', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({ formSource: 'calculator', tags: ['calculator'], sourceDetail: 'invest-page | calculator' })
    );
    expect(result.success).toBe(true);
  });

  it('accepts a request with no phone, tags, or calculator fields', () => {
    const { phone, ...rest } = baseBody();
    expect(LeadRequestSchema.safeParse(rest).success).toBe(true);
  });

  it('accepts calculator inputs/results within the size limit', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({
        formSource: 'calculator',
        calculatorInputs: { purchasePrice: 300000, monthlyRent: 2200 },
        calculatorResults: { monthlyCashFlow: 150, capRate: 0.06 },
      })
    );
    expect(result.success).toBe(true);
  });
});

describe('LeadRequestSchema -- rejects malicious/oversized input', () => {
  it('rejects a name over 100 characters', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ name: 'A'.repeat(101) }));
    expect(result.success).toBe(false);
  });

  it('rejects an email over 254 characters', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ email: `${'a'.repeat(250)}@x.com` }));
    expect(result.success).toBe(false);
  });

  it('rejects a phone over 30 characters', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ phone: '1'.repeat(31) }));
    expect(result.success).toBe(false);
  });

  it('rejects a sourceDetail over 200 characters', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ sourceDetail: 'a'.repeat(201) }));
    expect(result.success).toBe(false);
  });

  it('rejects a sourceDetail containing HTML/script markup', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({ sourceDetail: '<script>alert(1)</script>' })
    );
    expect(result.success).toBe(false);
  });

  it('rejects an empty sourceDetail', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ sourceDetail: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 tags', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ tags: Array(6).fill('lease') }));
    expect(result.success).toBe(false);
  });

  it('rejects a tag outside the allowlist', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ tags: ['not-a-real-tag'] }));
    expect(result.success).toBe(false);
  });

  it('rejects an unknown source', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ source: 'other' }));
    expect(result.success).toBe(false);
  });

  it('rejects an unknown contactType', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ contactType: 'other' }));
    expect(result.success).toBe(false);
  });

  it('rejects an unknown formSource', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ formSource: 'other' }));
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ name: '   ' }));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = LeadRequestSchema.safeParse(baseBody({ email: 'not-an-email' }));
    expect(result.success).toBe(false);
  });

  it('rejects calculatorInputs over the 8KB size limit', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({ calculatorInputs: { blob: 'x'.repeat(8 * 1024) } })
    );
    expect(result.success).toBe(false);
  });

  it('rejects calculatorResults over the 8KB size limit', () => {
    const result = LeadRequestSchema.safeParse(
      baseBody({ calculatorResults: { blob: 'x'.repeat(8 * 1024) } })
    );
    expect(result.success).toBe(false);
  });
});
