# Handoff: Add Seller Form (Missing Section)

**Why:** The site currently has Buy / Rent / List a Rental (landlord) / Invest — there's no form for homeowners looking to **sell**. This was an unintentional gap, not a deferred decision. Confirmed with Tyler.

**Build this alongside `handoff-sms-consent-disclosure.md`** — include the required SMS consent disclosure language from the start, so this new form doesn't need a follow-up pass.

---

## What to build

**New homepage section:** `#sell`, following the same pattern as the existing `#buy`, `#rent`, `#list-rental` sections — a `ContactForm` instance with its own heading/copy.

**Suggested copy** (Tyler: adjust tone/wording as you like — matches the voice of the other sections):

> ## Thinking About Selling?
> I help San Antonio homeowners sell with real market data and a clear process — no guesswork, no pressure. Tell me a bit about your property and I'll follow up with next steps.

**Nav update:** add a "Sell" item to the top nav, alongside Buy / Rent / List a Rental / Invest. Suggested order: Buy, Sell, Rent, List a Rental, Invest (buyer/seller pairing first, then lease-side, then investor) — but Tyler's call on exact ordering.

## Data mapping

- `contact_type`: `seller`
- `source_detail`: `"landing-page-sell"` (matches existing naming convention: `"landing-page"`, `"lease-tenant"`, `"lease-landlord"`)
- No `tags[]` addition needed (the existing `"lease"` tag is specific to rental-related contacts; a home sale isn't a lease transaction)

## SMS consent disclosure (required — see companion handoff)

Same disclosure block as the other forms, placed near the phone field:

> By providing your phone number, you agree to receive text messages from Tyler Ashbaugh, Texas Premier Realty regarding your inquiry. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time. See our [Privacy Policy](/privacy) and [Terms](/terms).

## After this is built

This becomes part of the same A2P resubmission as the consent-disclosure fix — no separate Twilio submission needed, just make sure this section is live before that resubmission happens, so the reviewer sees a complete, consistent site if they check multiple pages/sections.

---

## Resolution — implemented Sep 3, 2026

Used the suggested copy and nav order as-is — both read well and matched the existing sections' voice, no changes needed.

**Placement:** inserted between `#buy` and `#rent` (matching the suggested nav order Buy → Sell → Rent → List a Rental → Invest, so scroll order matches nav order like every other section already does). This required rebalancing the alternating section background colors across all four homepage sections (paper/white/paper/white) since inserting a section in the middle broke the existing pattern — fixed by flipping `#rent` and `#list-rental`'s section/card backgrounds to keep the visual rhythm intact, not just leaving two same-colored sections adjacent to each other.

**Disclosure:** came for free — built alongside `handoff-sms-consent-disclosure.md` in the same pass, and since that disclosure lives inside the shared `ContactForm` component itself, the new section never needed its own copy of it.

**Verified end-to-end** via a real browser submission: `contact_type` landed as `'seller'`, `tags` as `null`, `leads.source_detail` as `'landing-page-sell'` — exactly per spec. Zero console/page errors. Test data cleaned up afterward.
