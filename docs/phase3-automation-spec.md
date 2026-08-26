# Phase 3 — Lead Automation
**Architecture: Next.js API routes + Vercel Cron.** No n8n, no VPS. Zapier remains the required bridge from BoldTrail (its only supported outbound integration), but everything downstream of that webhook runs as serverless functions in the same repo as the rest of enjoyproperties.us — same deploy pipeline, same environment, same pattern already established for the Phase 2 mortgage-rate cron.

---

## 1. Schema changes

One addition to `leads`, needed for idempotency — Zapier polls BoldTrail every 5–15 minutes and can retry on transient failures, so the webhook receiver needs a way to recognize "I've already processed this lead" rather than creating duplicate rows on a retry:

```sql
alter table leads
  add column external_source text,
  add column external_id text;

create unique index leads_external_source_id_idx
  on leads (external_source, external_id)
  where external_id is not null;
```

BoldTrail-sourced leads get `external_source = 'boldtrail'`, `external_id = <BoldTrail's lead ID from the webhook payload>`, `source_detail = 'boldtrail-zapier'`, and `tags` includes `'boldtrail'` — consistent with the tagging pattern already used for `'lease'` and `'calculator'`.

**A second addition, on `contacts` — required for CAN-SPAM/CTIA compliance, not optional:**
```sql
alter table contacts
  add column email_opted_out boolean not null default false,
  add column sms_opted_out boolean not null default false,
  add column sms_consent boolean not null default false;
```
`sms_consent` defaults to `false` for every contact and only flips to `true` after an affirmative reply to a dedicated opt-in text — see §2.4. Every send in this workflow (and any future one) must check the opt-out flags before sending, and check `sms_consent` before any SMS specifically. Without these, an unsubscribe or STOP reply has nowhere to actually take effect — a decorative unsubscribe link that doesn't update a real flag isn't compliant, it just looks compliant.

## 2. Workflow 1 — New lead → welcome message

### 2.1 Zapier configuration
- **Trigger:** BoldTrail "New Lead," via the agent-level Zapier Key already located under Lead Engine → Lead Dropbox (Contacts + Users scope, no broker permission needed).
- **Action:** "Webhooks by Zapier" — POST to `https://enjoyproperties.us/api/webhooks/boldtrail-lead`, with a shared-secret header or query param (see §2.2) — Zapier's free/low tiers don't sign requests, so this shared secret is the actual security boundary, not optional.
- **Field mapping:** build this against the real sample payload Zapier shows you when the Zap is live — don't hardcode field names from documentation, since BoldTrail's exact trigger payload shape should be confirmed against a live test lead before the field-mapping step is finalized.

### 2.2 API route — `app/api/webhooks/boldtrail-lead/route.ts`
1. **Verify the shared secret** — check a header (e.g. `x-webhook-secret`) against `BOLDTRAIL_WEBHOOK_SECRET`. Reject with 401 on mismatch. This is the only thing standing between this endpoint and the open internet, since it has to be publicly reachable for Zapier to hit it.
2. **Idempotency check** — look up `leads` by `(external_source='boldtrail', external_id=<payload id>)`. If a row already exists, return 200 immediately without re-sending anything (handles Zapier retries cleanly).
3. **Upsert `contacts`** — look up by email; insert if new.
4. **Insert `leads`** — `contact_type` mapped from whatever BoldTrail's lead-type field indicates, `source_detail: 'boldtrail-zapier'`, `tags: ['boldtrail']`, `external_source: 'boldtrail'`, `external_id`, `next_follow_up_at: now() + interval '1 day'` (gives the Workflow 2 reminder cron something to act on if no manual follow-up gets logged first).
5. **Draft the welcome message** — call `lib/claude-welcome-message.ts` (see §2.3).
6. **Send** — email via Resend, SMS via Twilio (see §2.4).
7. **Log to `interactions`** — one row per channel (`channel: 'email'` / `'sms'`, `direction: 'outbound'`, `ai_generated: true`, `content`: the actual sent text).
8. **Timeout awareness** — Vercel Hobby caps serverless functions at 10s; Pro extends to 60s. Claude API + Resend + Twilio calls run in sequence could approach that on Hobby. Run the email and SMS sends in parallel (`Promise.all`) rather than sequentially, and confirm which Vercel tier the project is on before assuming headroom.

### 2.3 Message content — fixed skeleton, Claude fills narrow slots only

**Deliberate design choice, not a shortcut:** letting Claude freely compose the entire message for every lead, sent completely unsupervised with no per-message human review, is a meaningfully bigger Fair Housing/TCPA risk surface than a pre-approved template with a couple of narrow variable slots. The skeleton below gets reviewed once, by you; Claude's freedom is limited to one or two sentences referencing the lead's actual search activity. This is a stronger safeguard than freeform generation *and* simpler to build.

**Email skeleton:**
```
Subject: Welcome, {{first_name}} — let's find your next home in San Antonio

Hi {{first_name}},

Thanks for searching homes on my site! I'm Tyler Ashbaugh, a San Antonio
REALTOR® with Texas Premier Realty — and before this, I spent 20+ years as
a software engineer, which comes in handy when it's time to dig into the
numbers on a property.

{{search_context_sentence}}

I'll keep an eye on new listings that match what you're looking for, and
I'm happy to answer any questions any time — just reply to this email or
give me a call.

Information About Brokerage Services: {{iabs_link}}

Talk soon,
Tyler Ashbaugh, REALTOR®
Texas Premier Realty, LLC
TREC Lic. #833862-SA
(210) 419-2016

---
{{brokerage_physical_address}}
Don't want these emails? {{unsubscribe_link}}
```
The IABS line, physical address, and unsubscribe link are not optional additions — they're CAN-SPAM and TREC requirements, not stylistic choices. See §2.5 for what still needs sourcing before this is send-ready.

**SMS skeleton** (keep the whole thing under 160 characters to stay in a single segment — the STOP line below eats into that budget, unlike BoldTrail's native texting where opt-out language doesn't count against the limit; this is raw Twilio, so it does):
```
Hi {{first_name}}, it's Tyler with Texas Premier Realty — thanks for
checking out homes on my site! {{search_context_short}} Reply STOP to
opt out. - Tyler, (210) 419-2016
```

**`{{search_context_sentence}}` / `{{search_context_short}}`** are the only Claude-generated content — one natural sentence (email) or ~10-word fragment (SMS) referencing whatever search criteria or property info came through the webhook payload (price range, area, property type). If the payload doesn't include usable search context, fall back to a generic sentence ("I'll help you zero in on exactly what you're looking for") rather than inventing specifics.

**System prompt constraints for `lib/claude-welcome-message.ts`:**
- Never reference family status, children, religion, national origin, or any other protected-class characteristic — Fair Housing applies to this automated channel exactly as much as it does to display ad copy.
- Never use investor/cash-flow-system language, regardless of lead type — held for Month 4–6 per the sequencing decision.
- Never promise a specific property is available or make commitments about price/terms.
- Output strict JSON: `{ "search_context_sentence": "...", "search_context_short": "..." }` — no markdown, no preamble, so the response parses reliably without extra cleanup.

### 2.4 Compliance mechanics — findings and required design change

**Verified against BoldTrail's actual registration flow (screenshots reviewed):** the consent checkbox on BoldTrail's IDX site is **pre-checked by default**, and the disclosure names "San Antonio, New Braunfels" (likely a misconfigured brand-name field — worth having Daryl or BoldTrail support fix directly) with InsideRE, LLC as the acting vendor. It does **not** name Tyler Ashbaugh, Texas Premier Realty, or reference any contact method outside BoldTrail's own platform. Two independent problems: a pre-checked box is a weak consent mechanism on its own regardless of wording quality (fails the "clear, unambiguous affirmative act" standard), and even a well-executed checkbox here would only authorize contact *through BoldTrail's own system*, not through a separately-built Twilio pipeline under Tyler's own identity. **Not legal advice — this specific fact pattern (pre-checked box + ambiguously-named consenting party, in a Fifth Circuit jurisdiction with live uncertainty post-Bradford v. Sovereign Pest Control) warrants actual legal review before any SMS sends from this workflow, regardless of the design below.**

**Design decision: treat BoldTrail's wall consent as insufficient for this pipeline. Every BoldTrail-sourced lead requires a fresh, explicit SMS opt-in before any marketing text goes out under Tyler's own name.**

- `contacts.sms_consent` stays `false` by default for every lead entering via this workflow, regardless of what BoldTrail's payload claims about consent captured on its own wall.
- The first SMS-capable touch for a new BoldTrail lead is **not** the welcome message — it's a double opt-in request:
  ```
  Hi {{first_name}}, it's Tyler Ashbaugh with Texas Premier Realty. Reply
  YES to get home search texts and updates. Msg & data rates may apply.
  Msg frequency varies. Reply STOP to opt out.
  ```
- Only on an affirmative "YES" (or equivalent) reply does the Twilio inbound webhook (§2.5/2.6) set `sms_consent = true` — at which point future automated SMS in this and any later workflow can send.
- Until/unless that reply comes in, the lead still gets the full welcome **email** (not gated by any of this — CAN-SPAM's opt-out model applies there, not PEWC) and simply doesn't receive SMS.
- This adds one more inbound-webhook responsibility beyond STOP/START/HELP: recognizing an affirmative opt-in reply and flipping `sms_consent` accordingly. Worth building into the same Twilio inbound handler rather than a separate route.

**Before send, every call to Resend/Twilio in this workflow must check `contacts.email_opted_out` / `contacts.sms_opted_out` and skip sending if true.** This isn't a nice-to-have — it's the difference between an unsubscribe link that works and one that's decorative.

**Email unsubscribe:** `app/api/unsubscribe/route.ts` — a simple GET route taking a token (signed contact ID, not a raw ID, to prevent someone unsubscribing another person's email by guessing), setting `email_opted_out = true`, and showing a plain confirmation page. `{{unsubscribe_link}}` in the template points here.

**SMS opt-out:** two layers, not one —
1. Enable Twilio's Advanced Opt-Out (handles STOP/START/HELP at the carrier level, stops future *Twilio* sends automatically).
2. Add a Twilio inbound-message webhook (`app/api/webhooks/twilio-inbound/route.ts`) that checks if the inbound body is a STOP-family keyword and, if so, sets `sms_opted_out = true` on the matching contact — otherwise Twilio stops sending but Supabase never finds out, and some other part of the system could still show the contact as textable.

**Still needs sourcing, not something I can fill in:**
- **Brokerage physical mailing address** for `{{brokerage_physical_address}}` — recommend Texas Premier Realty's business address rather than your personal address on file with TREC. Get this from Daryl or the brokerage's own materials.
- **Completed IABS form + hosted link** for `{{iabs_link}}` — should already exist as a completed (not blank) PDF linked from the enjoyproperties.us homepage per the existing TREC footer requirement; reuse that same link here rather than creating a second one.

### 2.5 Sending — Resend (email) + Twilio (SMS)

- `lib/resend.ts` — thin wrapper, first real usage of Resend in the project (Phase 1/2 only used Resend as a planned line item, this is the first actual send).
- `lib/twilio.ts` — thin wrapper around Twilio's SMS send.
- **A2P 10DLC registration** — U.S. carriers filter or throttle unregistered business SMS traffic. Confirm Twilio brand + campaign registration is complete *before* this workflow goes live, not after — an unregistered number can have messages silently dropped with no obvious error, which would look like "the workflow is broken" when it's actually a carrier-compliance gap.

### 2.6 Logging
Two `interactions` rows per new lead (one per channel), matching the existing table shape — no schema change needed here, `interactions` already supports this from Phase 1.

## 3. Workflow 2 — Follow-up reminders

- `app/api/cron/follow-up-reminders/route.ts`, scheduled daily via `vercel.json` (add alongside the existing mortgage-rate cron entry), protected by the same `CRON_SECRET` pattern.
- **Query:** `leads` where `next_follow_up_at <= now()` and `stage` isn't `closed` or `lost`.
- **Action:** send yourself a reminder (email via Resend, or a text to your own number via Twilio) summarizing each due lead — name, contact info, stage, how long it's been.
- **After sending, set `next_follow_up_at = null`** on each reminded lead — don't auto-reschedule it. This stops the same stale lead from re-notifying you every day; the next reminder only fires once you've logged a new interaction and manually set a new `next_follow_up_at`.
- **Not logged to `interactions`** — this is an internal task-reminder to you, not a contact-facing touchpoint, so it doesn't fit that table's shape. Not building a dedicated `tasks` table for this yet either — a reminder email/text is enough at current volume.

## 4. Environment variables

| Variable | Purpose |
|---|---|
| `BOLDTRAIL_WEBHOOK_SECRET` | Shared secret validating the Zapier → API route call |
| `ANTHROPIC_API_KEY` | Claude API, welcome-message drafting |
| `RESEND_API_KEY` | Email sending |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | SMS sending |
| `CRON_SECRET` | Already exists from Phase 2 — reused for the follow-up-reminder cron |
| `SUPABASE_SERVICE_ROLE_KEY` | Already exists — server-side writes, not anon |

## 5. File structure summary

```
app/api/webhooks/boldtrail-lead/route.ts   — Workflow 1 entry point
app/api/webhooks/twilio-inbound/route.ts   — catches STOP/START/HELP replies, syncs sms_opted_out
app/api/unsubscribe/route.ts               — email unsubscribe link target, sets email_opted_out
app/api/cron/follow-up-reminders/route.ts  — Workflow 2 entry point
lib/claude-welcome-message.ts              — Claude API call, fixed skeleton + slot-fill
lib/resend.ts                              — email send wrapper
lib/twilio.ts                              — SMS send wrapper
vercel.json                                — add follow-up-reminders cron entry
```

## 6. Explicitly out of scope for this phase
- No dedicated `tasks` table — the follow-up cron sends a direct reminder, doesn't create task records.
- No retry/dead-letter queue for failed sends — if Resend or Twilio fails, log the error and move on; revisit if failure rate becomes a real problem at higher volume.
- No lead-type-specific message variants beyond the single skeleton above — BoldTrail's IDX registration flow is overwhelmingly buyer/renter-side property search, so building separate landlord/investor variants for a case that rarely occurs through this specific channel is premature. Revisit if BoldTrail's lead-type data shows real variety once volume exists.
