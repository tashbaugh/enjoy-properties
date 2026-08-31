# Handoff: Immediate New-Lead Notification

**Why:** Right now, the only way Tyler finds out about a new lead is manually checking the Supabase table editor, or waiting for the daily follow-up-reminder digest cron job. Neither is fast enough — speed-to-lead matters a lot in real estate, and there's currently a real gap between "lead captured + welcome message sent" and "Tyler actually knows a lead came in."

**Goal:** The moment a new lead is inserted (from any source — `ContactForm`, calculator, or the BoldTrail Zapier webhook), Tyler gets notified directly, in addition to (not instead of) the existing welcome message flow to the lead themselves.

---

## Where this hooks in

Same insertion path(s) that already trigger the Claude-personalized welcome message — likely:
- `ContactForm` client-side Supabase insert (site's own forms)
- `app/api/webhooks/boldtrail-lead` (just finished this session)
- Possibly the calculator's lead-capture insert too, if that's a separate code path

Add the notification call alongside the existing welcome-message trigger, not as a replacement for it. If there's already a shared "on new lead created" function/hook that both paths call into, add it there once rather than duplicating logic across each insert site.

## What the notification should contain

Keep it short and scannable — this is a "glance at your phone and know what you're dealing with" message, not a full record dump:

- Lead name
- Source (`contacts.source` / `leads.source_detail` — e.g., "Website — buyer inquiry" or "BoldTrail")
- Contact info (email, phone)
- `contact_type` (buyer/seller/investor/past_client) if available
- A direct link back to the lead — either the Supabase table row if there's no internal `/admin` view yet, or the BoldTrail `Lead Details Link` if the lead came from there and that URL was captured in `raw_payload`

## Channel(s) — CONFIRMED: both email and SMS

**Email:** to `AGENT_NOTIFICATION_EMAIL` — confirmed set in Vercel as of this session.

**SMS:** to Tyler's personal cell, **(210) 419-2016** — this is the *destination* number for the notification text, distinct from the business `TWILIO_FROM_NUMBER` ((830) 590-1070), which remains the *sending* number for all outbound messages (to leads and now to this notification). Reuse the existing `lib/twilio.ts` send wrapper — this is just another outbound send from the same Twilio number, addressed to Tyler instead of a lead.

Send both on every new lead — not a fallback/either-or, both channels fire.

## Implementation notes

- **Don't block the lead-insert or welcome-message flow on this.** If the notification send fails (bad email, Resend hiccup, etc.), the lead record and welcome message to the actual lead should still succeed — this notification is a convenience layer for Tyler, not a critical-path dependency. Fail gracefully and log, same pattern already used elsewhere in this codebase (e.g., the Claude Opus fallback, the cron job's failed-send handling).
- **Log the notification send itself** — either reuse the `interactions` table with a new `direction`/`channel` combination that makes sense (e.g., `channel: 'email'`, but this isn't really a lead-facing interaction, so consider whether it even belongs in that table, or whether a simpler log/console output is sufficient here) — flagging this as a design judgment call for Claude Code rather than a strict requirement, since `interactions` is scoped to contact-facing communication in the current schema.
- **Rate/volume consideration:** at current lead volume this is a non-issue, but worth a brief sanity check that a burst of leads (e.g., a paid ad campaign driving a spike) wouldn't cause notification spam that becomes noise — probably fine to ignore for now given volume, just flagging for awareness.

## Decisions — resolved

1. ~~Confirm `AGENT_NOTIFICATION_EMAIL` value~~ — confirmed set in Vercel.
2. ~~Email vs. email+SMS~~ — both channels confirmed, fire on every new lead.
3. ~~Confirm Tyler's cell number~~ — (210) 419-2016.

No open decisions remain — ready to build as specified.

## Out of scope for this build

- No internal `/admin` dashboard — that's a separate, larger piece of work if wanted later. This notification should link back to Supabase's table editor or BoldTrail directly, not a custom internal view.
- No "mark as seen/acknowledged" tracking — this is a one-way push notification, not a task-management system.

---

## Resolution — implemented Aug 31, 2026

**Found before building:** the handoff's premise that `ContactForm`/the calculator already have "the existing welcome-message flow" doesn't hold — both are pure client-side inserts (browser → Supabase directly via the anon key) with no server-side send logic at all. Only the BoldTrail webhook currently drafts/sends anything, since it's the only path that runs server-side where secrets can safely live. Confirmed via source (`grep` for `supabase.from(` in both components) before building around it.

**Architecture chosen (discussed with Tyler before building):** a new `app/api/notify-new-lead/route.ts` that both client components call via `fetch` right after their insert succeeds, plus a direct in-process call from the BoldTrail route — all three funnel into one shared `lib/notify-agent.ts`. Considered a Postgres Database Webhook (fires uniformly on any `leads` insert, zero client changes) but deliberately went with the explicit-route approach instead: a DB-level trigger wouldn't show up anywhere in the Next.js/Vercel codebase, and everything else in this project has stayed intentionally legible in application code (no n8n, no VPS) rather than reaching for infra that's invisible without separately checking another dashboard.

**`notifyAgentOfNewLead(contactId)` takes only a contact id, not a lead id** — neither client insert path can read a lead id back (anon has insert-only RLS on `leads`, no select policy), so the function looks up the contact's most recent lead itself via the service-role client, which isn't RLS-restricted. It fetches contact info (name/email/phone/source/contact_type) and the latest lead's `source_detail`/`raw_payload`, uses `raw_payload.lead_details_link` as the direct-link-back for BoldTrail leads, falls back to a generic Supabase table editor link (derived from `NEXT_PUBLIC_SUPABASE_URL`'s project ref, not hardcoded, so it differs correctly between production and preview) otherwise.

**Notification logging:** kept out of `interactions` (per the doc's own framing as a judgment call) — this is Tyler-facing, not contact-facing, so it doesn't fit that table's scope. Failures are `console.error`-logged only, same as the cron job's failed-send handling.

**`app/api/notify-new-lead` is deliberately unauthenticated.** It's called from the browser after a public insert, so there's no secret it could hold that wouldn't be visible in the client bundle anyway. Worst-case abuse is a duplicate notification for a real existing contact id (not new data exposure, not a write) — the same trust posture as the anon-insert endpoints this site already exposes publicly.

**Fire-and-forget, verified at runtime, not just by code inspection** — per Tyler's explicit ask to confirm this in practice: used Puppeteer to intercept the `notify-new-lead` request and artificially delay its response 3 seconds, then measured how long each component's own success state (`ContactForm`'s "Thanks — I'll be in touch shortly", the calculator's unlocked breakdown panel) took to appear. Both rendered in under a second — 826ms and 550ms respectively — well before the delayed response, with zero console/page errors, confirming the `.catch(() => {})`-guarded, never-`await`ed fetch neither blocks the success state nor produces an unhandled rejection that could interact with existing error handling.
