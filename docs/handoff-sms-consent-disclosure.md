# Handoff: Add Visible SMS Consent Disclosure to Contact Forms

**Why:** A2P Campaign rejected again (Error 30896). Twilio's reviewer confirmed they found the `/contact` URL correctly this time (previous fix worked), but says the opt-in flow itself "lacks consent details on types of messages that will be sent."

**Root cause:** The Privacy Policy page has the required disclosure language, but it's not visible directly on the actual contact form — Twilio's reviewer wants it in the opt-in flow itself (near the phone field), not just linked/referenced elsewhere.

**Required elements** (per Twilio's rejection notice), all four need to be visibly present:
1. Type of messages the consumer will receive
2. Message frequency
3. "Message and data rates may apply"
4. Opt-out instructions ("Reply STOP to unsubscribe" or equivalent)

---

## What to add

A short disclosure block, displayed near the phone number field on **every** page/section with a `ContactForm` instance. Confirmed locations so far:
- `/contact` (the new general page)
- `#buy` — "Get in touch" section
- `#rent` — "Find a rental" section
- `#list-rental` — "List your rental" section (landlords)

**Two things to verify/clarify with Tyler before considering this complete:**

1. **`/invest` page** — per the original build plan, this page has (or was planned to have) its own cash flow calculator with a separate lead-capture form. If that form exists and collects a phone number, it needs the same disclosure. Confirm whether it's live and has its own `ContactForm` instance.

2. **No dedicated "sell" form currently exists on the site.** The live sections are Buy / Rent / List a Rental (landlord) / Invest — there's no homeowner-seller-specific form. If sellers are expected to route through `/contact` instead, that's already covered. If a dedicated seller form is planned but not yet built, flag that as separate scope, not part of this fix.

**Suggested copy** (small text, e.g. below the phone field, similar styling to a standard form disclaimer):

> By providing your phone number, you agree to receive text messages from Tyler Ashbaugh, Texas Premier Realty regarding your inquiry. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time. See our [Privacy Policy](/privacy) and [Terms](/terms).

This single sentence covers all four required elements:
- "text messages... regarding your inquiry" — type of messages
- "Message frequency varies" — frequency disclosure
- "Message and data rates may apply" — rates disclosure (exact required phrase)
- "Reply STOP to unsubscribe" — opt-out instructions

## Placement notes

- Small/muted text styling is fine (this is standard practice — visible but not visually dominant, similar to how terms disclaimers typically appear near submit buttons)
- Place it between the phone field and the submit button, or directly below the phone field — needs to be clearly associated with providing a phone number, not just floating elsewhere on the page
- Keep the `/privacy` and `/terms` links functional (they already exist and work)

## After this is live

Resubmit the A2P Campaign — **no changes needed to the campaign registration form fields this time** (the `/contact` URL was already correctly recognized). This is purely a website content fix; once the disclosure is visible on the actual page, the same campaign submission should pass review.

---

## Resolution — implemented Sep 3, 2026

**Both open items resolved by checking the actual code, not asked:**
1. `/invest` does have its own `ContactForm` instance (its "Get in touch" section, separate from the cash flow calculator) — confirmed and covered.
2. The calculator's own gate form collects only name + email, no phone field at all — no disclosure needed there, since it never asks for a phone number.
3. The "no dedicated seller form" question was resolved by the companion handoff (`handoff-seller-form.md`), built in the same pass — sellers now have their own `#sell` section, which also gets this disclosure automatically (see below).

**Implementation:** added the disclosure directly inside the shared `ContactForm` component (between the phone field and submit button), rather than duplicating it per page — every current usage (`#buy`, `#sell`, `#rent`, `#list-rental`, `/invest`, `/contact`) and any future one gets it automatically with zero per-page work.

**Verified via raw HTML (`curl`, no JS execution)** — the exact context Twilio's reviewer complained about: all four required phrases present, and the disclosure appears exactly once per page for single-form pages (`/invest`, `/contact`) and exactly four times on the homepage (one per section). `/privacy` and `/terms` links confirmed functional within the disclosure itself.
