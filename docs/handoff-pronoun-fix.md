# Handoff: Fix "We/Us/Our" Pronoun Framing on Privacy & Terms Pages

**Why:** A2P Campaign rejected a third time (Error 30915) — not a website content gap this time, but a classification challenge. Twilio's reviewer read the Privacy Policy's opening line — `Tyler Ashbaugh ("we," "us," or "our"), a REALTOR® with Texas Premier Realty, LLC, operates the website...` — and concluded the business isn't a true sole proprietorship, since "we/us/our" is defined as including a registered LLC.

**Important nuance:** TREC rules *require* naming the sponsoring broker (Texas Premier Realty, LLC) with equal visual prominence — that requirement isn't going away and shouldn't change. What's fixable is the pronoun framing: nothing requires collapsing "Tyler individually" and "the LLC" into a single "we." Tyler is an independently contracted sales agent *sponsored by* the brokerage, not a member/owner/employee of it — that's a real, legally meaningful distinction, and the rewrite below reflects it accurately rather than just gaming Twilio's reviewer.

**Also worth flagging:** this rewording is a reasonable, good-faith fix for Twilio's specific stated objection, but sole-proprietor-vs-entity classification touches real tax/business questions. Worth keeping in mind alongside the still-open TCPA legal review item — that review should ideally confirm this framing is accurate, not just that it satisfies Twilio.

---

## Privacy Policy — replace opening paragraph

**Current:**
> Tyler Ashbaugh ("we," "us," or "our"), a REALTOR® with Texas Premier Realty, LLC, operates the website enjoyproperties.us (the "Site"). This Privacy Policy explains how we collect, use, and protect your personal information when you use the Site or communicate with us.

**Replace with:**
> I, Tyler Ashbaugh ("I," "me," or "my"), operate the website enjoyproperties.us (the "Site"). I am a licensed Texas REALTOR® sales agent (TREC License #833862-SA), sponsored by Texas Premier Realty, LLC (TREC Broker License #9014663-BB), a licensed real estate brokerage. I am an independently contracted sales agent — not an employee, member, or owner of the brokerage. This Privacy Policy explains how I collect, use, and protect your personal information when you use the Site or communicate with me.

## Privacy Policy — replace "we/us/our" with "I/me/my" throughout the rest of the document

Every subsequent section (1–9) currently uses "we/us/our" — all of these should become "I/me/my," e.g.:
- "we may collect" → "I may collect"
- "We use the information you provide to" → "I use the information you provide to"
- "We do not send text messages without your affirmative consent" → "I do not send text messages without your affirmative consent"
- "We do not sell, rent, or share your mobile phone number..." → "I do not sell, rent, or share your mobile phone number..."
- "We may share your information with: **Texas Premier Realty, LLC**, our sponsoring brokerage..." → "I may share your information with: **Texas Premier Realty, LLC**, my sponsoring brokerage..."
- Continue this pattern through sections 4–8

**Leave unchanged:** the footer block (broker name/logo/TREC license line) — that's the required equal-prominence disclosure and isn't part of what triggered the rejection.

---

## Terms and Conditions — same fix

**Current opening:**
> Welcome to enjoyproperties.us (the "Site"), operated by Tyler Ashbaugh, a REALTOR® with Texas Premier Realty, LLC. By using this Site or communicating with us through it, you agree to the following terms.

**Replace with:**
> Welcome to enjoyproperties.us (the "Site"), operated by me, Tyler Ashbaugh. I am a licensed Texas REALTOR® sales agent (TREC License #833862-SA), sponsored by Texas Premier Realty, LLC (TREC Broker License #9014663-BB) — an independently contracted relationship, not an employment or ownership one. By using this Site or communicating with me through it, you agree to the following terms.

Apply the same "we/us/our" → "I/me/my" pattern through the rest of the document, e.g.:
- "you agree that we may contact you by email or phone" → "you agree that I may contact you by email or phone"
- "Section 5 Fair Housing: We do not discriminate..." → "I do not discriminate..."
- Section 4 (Broker Identification) and Section 5 (Fair Housing) already correctly refer to "Tyler Ashbaugh and Texas Premier Realty, LLC" as two separate named parties rather than a blended "we" — leave those as-is, they're already framed correctly.

---

## After this is live

Resubmit the A2P Campaign — no registration form field changes needed, this is purely a website wording fix targeting the specific line Twilio's reviewer quoted.

---

## Resolution — implemented Sep 10, 2026

**Applied against the current live content, not the stale text quoted in this handoff.** Between this handoff being written and being picked up, other work had already landed on both pages (a new Cookies & Tracking Technologies section, an AI-tools sharing disclosure, SEO/structured-data additions) — none of that touched the pronoun framing, so the fix applied cleanly on top of it without conflict. Both `docs/*.md` source files and the live `app/privacy/page.tsx` / `app/terms/page.tsx` pages were updated together, plus `docs/lead-gen-system-build-plan.md`-adjacent files weren't touched (out of scope).

**Beyond the explicit examples, also fixed for full consistency** (implied by the handoff's own "every subsequent section... all of these should become I/me/my," not literally enumerated):
- Section headings themselves — "Information We Collect" → "Information I Collect," "How We Use Your Information" → "How I Use Your Information," "How We Share Your Information" → "How I Share Your Information." Leaving headings saying "We" while the body said "I" would have been inconsistent and could plausibly re-trigger the same reviewer concern.
- The new Section 4 (Cookies) and the AI-tools bullet in Section 5, which didn't exist when this handoff was written — same "we" → "I" pattern applied there too.
- "See our Privacy Policy" (Terms, Section 3) → "See my Privacy Policy" — a stray instance not in the handoff's example list but caught by grepping both files for `\b(we|us|our)\b` after the main pass.

**Verified via `grep -noiE '\b(we|us|our)\b'` against all four files** (both markdown sources and both live pages) — every remaining match is a false positive (`enjoyproperties.us` the domain, or the "Contact Us" section heading, which reads as a generic imperative label regardless of business structure) — not the pronoun issue. Confirmed via raw HTML (`curl`, no JS) that the old framing is completely gone and the new framing is present on both live pages, and via screenshot that the page renders correctly.

**Tyler's remaining step:** resubmit the A2P Campaign — no Twilio registration form changes needed, per the original handoff.
