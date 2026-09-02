# Handoff: Dedicated `/contact` Page + General Inquiry Form

**Why:** Two problems, one fix.
1. The top-nav "Get in touch" button currently points to `#buy`, which is semantically wrong for a renter or landlord clicking it from the nav — they land on the buyer-specific form.
2. Twilio's A2P Campaign was rejected (Error 30909) with a request for "the exact URL where users sign up." A dedicated `/contact` route is a cleaner, more unambiguous answer than pointing to an anchor within the single-page homepage.

---

## What to build

**New route:** `app/contact/page.tsx` — `enjoyproperties.us/contact`

**Content:** A new `ContactForm` instance (reuse the existing component/pattern from the `#buy`/`#rent`/`#list-rental` sections), with one addition:

**Add a dropdown/select field:** "What are you looking for?" with options:
- Buying
- Renting
- Listing a rental
- Not sure yet

Map the selection to `contacts.contact_type`:
- Buying → `buyer`
- Renting → `buyer` (reuse existing convention — tenants map to `buyer` per the lease-tagging pattern already in place) + add `"lease"` to `tags[]`
- Listing a rental → `seller` + add `"lease"` to `tags[]`
- Not sure yet → leave `contact_type` null/unset, or a sensible default if the schema requires a value — Claude Code's call on what's cleanest given current constraints

**`source_detail`:** tag these leads distinctly as `"general-contact-page"` so they stay distinguishable from the section-specific forms (`"landing-page"`, `"lease-tenant"`, `"lease-landlord"`, etc.) in reporting/review later.

**Everything else about the form** (validation, Supabase insert pattern, UTM capture via `lib/utm.ts`, the new lead-notification trigger, welcome message trigger) should work identically to the existing `ContactForm` instances — this is a new placement/context for the same component, not new logic.

## Nav change

Update the top-nav "Get in touch" button to point to `/contact` instead of `#buy`.

**Leave everything else untouched:** the `#buy`, `#rent`, `#list-rental` anchor sections and their existing `ContactForm` instances stay exactly as they are on the homepage. This is additive — a new general-purpose entry point, not a replacement for the section-specific ones.

## Separate, still-open item (not part of this task, but related)

Before resubmitting the A2P Campaign, still need to confirm whether `ContactForm` instances render server-side or client-only — if client-only, Twilio's (likely non-JS) reviewer crawler may not see form content in the raw HTML regardless of how clean the URL is. Worth checking this specifically for the new `/contact` page once built, since that's the URL that'll actually go into the campaign resubmission.

## After build

1. Confirm `enjoyproperties.us/contact` resolves and the form works end-to-end (submits to Supabase, triggers welcome message + notification, same as other forms)
2. Confirm the "Get in touch" nav button now goes to `/contact`
3. Resubmit the A2P Campaign with `https://www.enjoyproperties.us/contact` as the specified sign-up URL

---

## Resolution — implemented Sep 2, 2026

**"Not sure yet" decision:** `contacts.contact_type` is `NOT NULL` (a Postgres CHECK constraint), so "leave it null" wasn't actually available without a schema change. Defaulted it to `'buyer'` (no tag) rather than migrating the column — the most neutral/common lead type, easily corrected once Tyler actually talks to the lead, and not worth a schema change for this.

**Implementation:** rather than a separate form component, extended the existing `ContactForm` with an optional `showReasonSelect` prop. When true, a "What are you looking for?" `<select>` (required, no default — visitor must explicitly choose) determines `contactType`/`tags` internally instead of the caller passing a single fixed `contactType` like every other placement does. `contactType` became an optional prop as a result; the three existing homepage instances (`#buy`/`#rent`/`#list-rental`) are completely unaffected — same fixed-prop behavior as before.

**The "still-open" SSR question — resolved, not left open.** `/contact` builds as a statically prerendered route (`○` in the build output), and `curl`ing it directly (no JS execution) confirms every form label and every dropdown option — "What are you looking for", "Buying", "Renting", "Listing a rental", "Not sure yet", "Name", "Email", "Phone" — is present in the raw HTML. A non-JS crawler (like Twilio's reviewer) will see the complete form. This directly unblocks the A2P resubmission with `https://www.enjoyproperties.us/contact` as the sign-up URL.

**Verified end-to-end** via a real Puppeteer-driven browser submission (not just curl): submitted once with "Renting" and once with "Not sure yet", confirmed in the database that `contact_type`/`tags` landed exactly as specified (`buyer` + `{lease}` for renting; `buyer` + no tags for not-sure) and `leads.source_detail` = `'general-contact-page'` on both. Zero console/page errors. Test data cleaned up afterward.

**Tyler's remaining step:** resubmit the A2P Campaign with `https://www.enjoyproperties.us/contact` as the sign-up URL — not something this session can do (no Twilio Console access).
