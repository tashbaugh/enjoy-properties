# Enjoy Properties

Lead generation and client communication platform for a licensed Texas real estate practice. Live at [enjoyproperties.us](https://www.enjoyproperties.us).

Built and operated by [Tyler Ashbaugh](https://www.linkedin.com/in/tylerashbaugh), a REALTOR with Texas Premier Realty and a software engineer of 22 years. This is production software running a real business, not a demo.

---

## What it does

Captures buyer, seller, renter, and investor leads across several entry points; runs a cash-flow calculator behind an email gate; syncs leads bidirectionally with BoldTrail; and drives automated welcome email and SMS follow-up under strict regulatory constraints.

## Stack

Next.js 16 (App Router), React 19, TypeScript (`strict`), Tailwind v4, Supabase (Postgres, PostgREST, RLS), Twilio, Resend, Anthropic API, FRED, Vercel Cron, Vitest.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your own keys
npm run dev
npm test
```

Requires Node 24.x, matching production, and a Supabase project with the migrations in `supabase/migrations/` applied.

---

## Why the interesting parts are interesting

Real estate sits at the intersection of several regulatory regimes: Fair Housing, TCPA, CAN-SPAM, and TREC advertising rules. All of them apply to automated outbound communication exactly as they apply to a human agent. Most of the engineering below exists because of that.

### Access control, and why lead capture is server-side

The forms originally inserted into Supabase directly from the browser using the anon key. RLS was scoped narrowly: insert-only on `contacts` and `leads`, with a column-level grant letting the client read back only the new row's `id`, so no PII was reachable through a key that ships in the JS bundle by design.

A security audit found that wasn't enough. The narrow SELECT still permitted enumerating every contact ID, and those IDs fed a separate unauthenticated notification endpoint that would send real email and SMS for any ID handed to it.

The fix wasn't to patch the endpoint. Lead capture moved into a server route using the service-role client, so the browser no longer talks to those tables at all, and the endpoint accepting a client-supplied ID was deleted. Both tables now carry RLS with zero anon policies, matching the locked-down posture already used everywhere else in the schema.

Read together: [the lockdown migration](supabase/migrations/20260908104000_lock_down_contacts_leads_anon_access.sql) for the reasoning, and [`app/api/leads/route.ts`](app/api/leads/route.ts) for the implementation.

### Idempotency where it costs money

Rate limiting bounds request volume. It isn't what prevents duplicate Twilio and Resend sends.

That's `lib/notify-agent.ts`, which claims a lead atomically. The Supabase builder chain there resolves, in effect, to:

```sql
UPDATE leads SET notified_at = $2
WHERE id = $1 AND notified_at IS NULL
RETURNING ...
```

Postgres re-evaluates the `WHERE` after acquiring the row lock, so concurrent callers for the same lead cannot both win. One send per lead, ever. The timestamp is supplied by the application rather than computed database-side, which doesn't affect the guarantee since it comes from the null check under lock.

Rate limits use per-form buckets rather than one shared ceiling, since a burst on the calculator shouldn't starve the contact form, and are backed by a Postgres table rather than in-memory state, because serverless instances don't share memory.

### Signed unsubscribe tokens

Unsubscribe links carry `{contactId}.{HMAC-SHA256(contactId)}` rather than a bare ID, verified with `crypto.timingSafeEqual`. Without the signature, anyone could unsubscribe any address by incrementing an ID. The same comparison helper backs the BoldTrail webhook's shared-secret check.

### Two Twilio credentials, deliberately

An API Key/Secret pair for sending; the account Auth Token only for verifying inbound webhook signatures. Twilio signs webhooks with the Auth Token, so it can't be avoided, but the Auth Token grants full account access with no partial revoke while the API Key is scoped and independently revocable. Separating them limits what a leak of the sending credential can do.

### Constraining the model

`lib/claude-welcome-message.ts` uses fixed-template slot-fill, not freeform generation. The model returns two short strings against a Zod schema. The surrounding message is static and human-reviewed.

The system prompt hard-codes constraints: never reference protected-class characteristics, never use investor or cash-flow framing regardless of the lead's stated activity, never promise a specific property or terms, and reference only criteria the lead actually provided. When there's no usable context, the function returns a deterministic fallback before the API client is even constructed, so no request is made at all.

Fair Housing applies to an automated welcome message the same way it applies to a display ad. A model that improvises when it has nothing to work with is a liability in that setting.

### Compliance machinery

- Welcome emails are gated on `BROKERAGE_PHYSICAL_ADDRESS` being set. If it's missing the send is skipped and logged as an error, never sent without the CAN-SPAM required address.
- SMS uses double opt-in that's stricter than required. Even when a lead source carries its own consent checkbox, `sms_consent` stays false until the contact replies YES to a dedicated opt-in text, verified against Twilio's request signature. The flag is captured now and will gate the follow-up SMS sequence, which isn't built yet: the consent model was designed before the feature that needs it.
- `STOP` and `START` set `sms_opted_out` per contact, checked before every outbound send. `HELP` triggers an informational reply and stores no state.
- TREC brokerage identification, the IABS link, and the Fair Housing notice render site-wide via the root layout, including the default 404 page.

---

## Tests

Vitest, covering `lib/calculator.ts` and `lib/unsubscribe-token.ts`, the two modules that are pure logic carrying real financial and security weight. Token tests cover tampered signatures, wrong-secret rejection, length mismatch in both directions, and malformed input, not just the round trip.

No component-level tests yet. That's a gap, not a decision.

## Notes for reviewers

The migration history is worth reading as a record of a security issue being found, fixed, and verified in production rather than designed correctly on the first pass. The commit log documents how each change was confirmed, including a production bug traced through `raw_payload` to a camelCase/snake_case mapping mismatch rather than guessed at.

`tsconfig.json` has `strict` enabled, with two uses of `any` in the codebase, both in `lib/analytics.ts` for the untyped `window.gtag` and `window.fbq` globals.
