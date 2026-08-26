import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

// Fixed skeleton, Claude fills narrow slots only -- deliberate design
// choice per docs/phase3-automation-spec.md §2.3. Never let this module
// draft a full message; it only ever returns these two short strings.

const SlotsSchema = z.object({
  search_context_sentence: z.string(),
  search_context_short: z.string(),
});

export type WelcomeMessageSlots = z.infer<typeof SlotsSchema>;

export type LeadSearchContext = {
  firstName: string;
  priceMin?: number;
  priceMax?: number;
  areas?: string[];
  propertyType?: string;
  bedrooms?: number;
};

const FALLBACK_SLOTS: WelcomeMessageSlots = {
  search_context_sentence: "I'll help you zero in on exactly what you're looking for.",
  search_context_short: "I'll help you find exactly what you're looking for.",
};

const SYSTEM_PROMPT = `You draft two short slots for a real estate agent's automated welcome message, filling in a fixed template -- not the message itself.

Hard rules, no exceptions:
- Never reference family status, children, religion, national origin, or any other protected-class characteristic. Fair Housing applies to this automated channel exactly as much as display ad copy.
- Never use investor or cash-flow-system language, regardless of what the lead's search activity suggests.
- Never promise a specific property is available or make commitments about price or terms.
- Reference only the search criteria actually provided -- do not invent details.
- Output strict JSON matching the schema. No markdown, no preamble.`;

function hasUsableContext(context: LeadSearchContext): boolean {
  return Boolean(
    context.priceMin || context.priceMax || context.propertyType || context.bedrooms ||
      (context.areas && context.areas.length > 0)
  );
}

function describeContext(context: LeadSearchContext): string {
  const parts: string[] = [];
  if (context.propertyType) parts.push(`property type: ${context.propertyType}`);
  if (context.bedrooms) parts.push(`bedrooms: ${context.bedrooms}+`);
  if (context.priceMin || context.priceMax) {
    const min = context.priceMin ? `$${context.priceMin.toLocaleString()}` : 'any';
    const max = context.priceMax ? `$${context.priceMax.toLocaleString()}` : 'any';
    parts.push(`price range: ${min} - ${max}`);
  }
  if (context.areas && context.areas.length > 0) parts.push(`areas: ${context.areas.join(', ')}`);
  return parts.join('; ');
}

/**
 * Drafts the two search-context slots for the welcome email/SMS skeleton.
 * Returns a generic, deterministic fallback (no API call) when the lead's
 * payload has no usable search context, rather than letting the model
 * invent specifics from nothing.
 */
export async function draftWelcomeMessageSlots(
  context: LeadSearchContext
): Promise<WelcomeMessageSlots> {
  if (!hasUsableContext(context)) {
    return FALLBACK_SLOTS;
  }

  const client = new Anthropic();

  const response = await client.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Lead first name: ${context.firstName}\nSearch context: ${describeContext(context)}\n\nWrite:\n- search_context_sentence: one natural sentence for an email, referencing this search context\n- search_context_short: a ~10-word fragment for an SMS referencing the same context`,
      },
    ],
    output_config: {
      format: zodOutputFormat(SlotsSchema),
    },
  });

  return response.parsed_output ?? FALLBACK_SLOTS;
}
