# Handoff: Privacy Policy & Terms and Conditions Pages

**Why now:** Twilio's A2P Campaign registration form requires live URLs to a privacy policy and terms of service before the campaign can be submitted for approval. This is currently the blocker on completing A2P registration (Brand is already approved).

**Priority:** Get these live and reachable before returning to the Twilio Campaign form — Twilio's reviewers may also check these pages as part of vetting.

---

## What to build

Two new static routes:

- `app/privacy/page.tsx` — `enjoyproperties.us/privacy`
- `app/terms/page.tsx` — `enjoyproperties.us/terms`

Content for both is finalized and attached as markdown files (`privacy-policy.md`, `terms-and-conditions.md`). Render as simple long-form text pages — no special components needed, just headings/paragraphs matching the existing site's typography.

## Before publishing — two placeholders need real values — **DONE**

Both documents originally contained:
- `[EMAIL ADDRESS]` — filled in as `tyler@enjoyproperties.us`, confirmed directly rather than guessed
- `[DATE TO BE SET WHEN PUBLISHED]` (appeared twice per doc: Effective Date, Last Updated) — set to August 30, 2026, the actual publish date

## Structure / styling notes

- Reuse the site's existing global layout (nav, footer) so these pages are consistent with `/` and `/invest` — this is boilerplate legal content, not a design-forward page.
- Standard readable long-form styling is fine: constrained max-width text column, normal heading hierarchy (the markdown files use `#`/`##` — map directly to `h1`/`h2`).
- Internal link check: the Terms page links to `/privacy` (`[Privacy Policy](/privacy)`) — make sure that resolves correctly once both routes exist.
- No forms, no Supabase writes, no client-side interactivity needed on either page — fully static content.

## Metadata

Add basic page `<title>`/meta description for each (e.g., "Privacy Policy | Enjoy Properties" / "Terms and Conditions | Enjoy Properties") consistent with how other routes set metadata in this app.

## After deploy — **DONE**

Confirmed both URLs resolve on production:
- `https://enjoyproperties.us/privacy`
- `https://enjoyproperties.us/terms`

Tyler will use these two URLs directly in the Twilio A2P Campaign registration form's "Provide link to the Campaign's privacy policy" and "Provide link to Campaign's terms and conditions" fields.
