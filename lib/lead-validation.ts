import { z } from 'zod';

// Matches every sourceDetail the forms currently send -- plain page
// identifiers (e.g. "landing-page", "lease-tenant") and the UTM-suffixed
// form buildSourceDetail() produces (e.g. "invest-page | calculator |
// google/spring-promo/cpc"). UTM values come straight from the URL query
// string, so this also bounds what an attacker-crafted UTM value can
// contain -- an odd one fails validation rather than being escaped.
const SOURCE_DETAIL_PATTERN = /^[\w\s|/.\-:+%]*$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// source_detail/tags are stored for analytics only -- rejecting an
// unusual one is an acceptable trade-off to avoid having to sanitize
// free text pulled from the URL.
const MAX_JSON_STRING_BYTES = 8 * 1024;

function withinJsonSizeLimit(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  try {
    return JSON.stringify(value).length <= MAX_JSON_STRING_BYTES;
  } catch {
    return false;
  }
}

export const LeadRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().max(254).regex(EMAIL_PATTERN),
  phone: z.string().max(30).nullable().optional(),
  source: z.enum(['public_record', 'referral', 'content', 'ad']),
  contactType: z.enum(['buyer', 'seller', 'investor', 'past_client']),
  // Every tag the components currently send -- grepped from
  // components/ContactForm.tsx and components/CashFlowCalculator.tsx.
  tags: z.array(z.enum(['lease', 'calculator'])).max(5).nullable().optional(),
  sourceDetail: z.string().trim().min(1).max(200).regex(SOURCE_DETAIL_PATTERN),
  calculatorInputs: z.unknown().optional().refine(withinJsonSizeLimit, {
    message: 'calculatorInputs exceeds size limit',
  }),
  calculatorResults: z.unknown().optional().refine(withinJsonSizeLimit, {
    message: 'calculatorResults exceeds size limit',
  }),
  formSource: z.enum(['contact', 'calculator']),
});

export type LeadRequestBody = z.infer<typeof LeadRequestSchema>;
