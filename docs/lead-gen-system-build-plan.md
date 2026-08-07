# Investor & Residential Lead-Gen System — Build Plan

**Owner:** Solo agent, San Antonio, TX — part-time, software engineer background
**Niche:** Real estate investing + general SA residential
**Budget:** <$200/mo target
**Priority order:** Lead gen & nurture → Marketing/content engine → (later) transaction management, client experience

---

## 1. Design principles

- **Build once, distribute everywhere.** Written content is the source of truth; everything else (social captions, short video scripts, email nurture) is derived from it via AI, not created from scratch each time.
- **You are the CRM vendor.** At <$200/mo and with your background, a self-built data layer beats a SaaS CRM — full schema control, no per-seat fees, and it becomes the foundation every other tool plugs into.
- **Automation is the connective tissue, not a feature.** n8n (or similar) sits in the middle so new lead sources, channels, or AI models can be added later without re-architecting anything.
- **MLS is not your data source for investor leads.** You only have portal access (no API), so off-market/investor sourcing runs through public records instead — which is actually the *better* dataset for this (distressed, absentee-owner, and probate properties mostly aren't on MLS anyway).

---

## 2. Recommended tech stack & monthly cost

| Layer | Tool | Why | Est. cost |
|---|---|---|---|
| Frontend / website | Next.js on **Vercel** (Hobby tier) | Free at low traffic, scales seamlessly, you already know how to build in React | $0 |
| Database / backend | **Supabase** (Postgres + Auth + Storage) | Generous free tier, real SQL, you own the schema | $0–25 |
| Automation / orchestration | **n8n**, self-hosted on a small VPS (Hetzner/DigitalOcean) | Visual workflow engine; open source; glue between every tool | ~$6–12 |
| AI | **Claude API** (pay-as-you-go) | Content generation, lead personalization, deal analysis narratives | ~$10–30 (usage-based) |
| Email | **Resend** | Free tier ~3k emails/mo, clean API | $0 |
| SMS | **Twilio** | Pay-per-message (~$0.008/msg) + $1.15/mo number | ~$5–15 |
| Domain | Any registrar | Personal brand domain | ~$1/mo (annual) |
| Skip tracing (Phase 4+) | Pay-per-lookup service, added later | Only once off-market sourcing is live | Variable, start manual |

**Total to start: roughly $25–50/mo**, leaving headroom under your $200 ceiling for paid ads once the funnel is proven.

---

## 3. Core data model (Supabase / Postgres)

Sketch of the minimum schema — expand as needed:

```
contacts
  id, name, email, phone, source (public_record | referral | content | ad),
  contact_type (buyer | seller | investor | past_client),
  created_at, last_contact_at, tags[]

properties
  id, address, apn, county_data (jsonb), owner_name, absentee_flag,
  tax_delinquent_flag, estimated_value, notes

leads
  id, contact_id (FK), property_id (FK, nullable), stage
    (new | contacted | nurturing | qualified | under_contract | closed | lost),
  score (int), source_detail, next_follow_up_at

interactions
  id, contact_id (FK), channel (email | sms | call | site_visit),
  direction (inbound | outbound), content, ai_generated (bool), created_at

content_pieces
  id, title, pillar_post (text), status (draft | published),
  derived_assets (jsonb — social captions, video script, etc.), published_at
```

This is deliberately simple — it's the backbone everything else (n8n workflows, AI prompts, dashboards) reads from and writes to.

---

## 4. Build order (phased, fits flexible/bursty time)

### Phase 1 — Foundation (first solid work session) — **IN PROGRESS**
- **Domain: `enjoyproperties.us`** — chosen, broker-agnostic (safe to use pre-sponsorship). `enjoyproperties.com` was checked and is a premium/squatter listing at $5,870 — not worth acquiring; staying on `.us`.
- Site structure: **two routes**, not one landing page or a full blog:
  - `/` — general SA residential, `contact_type: buyer`, `source_detail: landing-page`
  - `/invest` — investor niche (cash flow/cap rate framing), `contact_type: investor`, `source_detail: invest-page`
  - Blog/content section deliberately deferred to Phase 4 (content engine) to avoid building infra that gets reworked once Claude-driven content workflows exist.
- Shared `ContactForm` component writes to both `contacts` and `leads` in one submit (client-side Supabase insert, no API route needed at this scale).
- Lead visibility: **Supabase table editor** is sufficient for now — no internal `/admin` page being built this phase.
- All 5 core tables (`contacts`, `properties`, `leads`, `interactions`, `content_pieces`) created **now**, even though only `contacts`/`leads` are used yet — avoids a schema migration when Phase 3 n8n workflows need `interactions`.
- RLS: locked down by default; explicit `anon insert` policies added only on `contacts` and `leads` (public form writes), everything else owner/service-role only.
- Stack: Next.js (App Router, TS, Tailwind) on Vercel; Supabase client via `@supabase/supabase-js`.
- **Compliance note:** no TREC broker-ID text goes on the site until sponsorship is finalized — footer component built now with a placeholder slot so it's a one-line add later, not a redesign.

### Business sequencing decision — **LOCKED IN**
- Starting cold (no existing sphere of influence). Given this, active selling focus for **Months 1–3** is **residential sales + leases (both tenant-side and landlord-side)**, not investor deals — lower trust barrier, faster cycle time (1–3 weeks for a lease vs. 4–8 weeks for a sale), better fit for a brand-new agent with zero track record.
- **Investor niche is not abandoned — it's deferred on the *marketing spend* axis only, not the build axis.** Cash flow calculator (Phase 2), CAD data pull/scoring (Phase 5), and 1–2 investor pillar posts/month (Phase 4, informal/early) continue in the background at near-zero incremental cost, since they're build/content work rather than active outreach.
- Paid ad budget ($300–500/mo) goes 100% to residential + lease campaigns in Months 1–3. Shift 30–40% of spend to investor campaigns starting **Month 4–6**, once early residential/lease deals give the investor pitch a real track record to lean on ("I've closed X deals and analyzed Y properties" beats a cold pitch with no history).
- Direct mail to the CAD-sourced investor list also holds until Month 4–6 for the same reason — list-building now, mailing later.

### Leases — parallel path alongside sales (both tenant and landlord side)
- Both sides pursued from day one: representing tenants (renters) and landlords/owners listing units for lease.
- **Economics:** residential lease commission is typically 50–100% of one month's rent, net ~$720–1,440 after TPR's 10% transaction fee (no minimum) — smaller than a sale but far faster to close (1–3 weeks lead-to-signed vs. 4–8 weeks for a purchase) and a much lower trust bar for a new agent to clear with cold leads.
- **Landlord side ≠ property management.** Per TPR's Statement of Understanding, placing a tenant is fine solo; ongoing management (rent collection, maintenance, escrow) requires separate broker written approval, an escrow account, and a PM course. Stay lease-only — don't let a landlord client's expectations drift into management without that explicit approval.
- **Schema:** no migration needed. Reuse existing `contact_type` values (`buyer` for tenants, `seller` for landlords) and add a `"lease"` entry to the existing `tags[]` array to distinguish deal type. Keeps Phase 1's "create all tables now, no future migrations" principle intact.
- **Landing page content:** add tenant/landlord blocks (own `ContactForm` instances, `sourceDetail: "lease-tenant"` / `"lease-landlord"`) to `/` rather than building a full third route — avoids fragmenting the two-route structure decided in Phase 1.
- **Fair Housing flag — elevated for rentals specifically:** rental ad copy draws the tightest fair housing scrutiny of any real estate marketing (source-of-income, familial status, disability accommodation language are the common problem areas). Any Claude-generated rental listing copy needs a human review pass before publishing — more strictly than sale listing copy.
- **Bold Trails dependency to confirm:** verify with Daryl whether the IDX feed includes LERA's rental listings, not just for-sale — determines whether Bold Trails serves the lease funnel at all or whether a separate rental listing source (Zillow Rental Manager, Apartments.com, etc.) is needed.

### Paid ads plan — **LOCKED IN**
- **Platform split (Months 1–3, residential + lease only):** Google Search ~60% ($180–300/mo), Meta ~40% ($120–200/mo). No Display or Performance Max — low-intent, burns budget. Investor campaigns (`/invest`) held until Month 4–6 per the sequencing decision above.
- **Google Search campaigns:** "SA Home Buyers" (buyer-intent keywords → `/`) and "SA Rentals" (tenant-intent keywords → tenant-lease section). Negative keywords exclude portal/competitor terms (`zillow`, `realtor.com`) and off-intent terms (`jobs`, `free`).
- **Meta campaigns:** Lead Ads for tenant-side and landlord-side leasing. Must declare **Special Ad Category: Housing** on every campaign (mandatory as of 2026 — Meta auto-detects real-estate imagery and applies restrictions even if undeclared). This removes age/gender/ZIP targeting and enforces a 15-mile minimum radius; targeting precision comes from ad creative/messaging, not audience filters. Google now applies similar HEC (Housing/Employment/Credit) restrictions — build compliant copy once, don't treat either platform as a workaround for the other.
- **Ad copy compliance:** no age/family/lifestyle targeting language, no "exclusive" or demographic references; all Claude-drafted ad and landing copy gets a human Fair Housing pass before publishing (consistent with the elevated rental-copy review noted above).
- **Meta lead routing — Option B chosen:** Meta ads point traffic to the site (`ContactForm`) rather than using Meta's native Lead Ads forms. Keeps one lead pipeline (UTM capture → Supabase → both conversion pixels) instead of standing up a Meta webhook → n8n → Supabase sync, which would pull Phase 3 automation forward before n8n exists in the stack. Revisit native Lead Ads once n8n is live (Phase 3) and performance data justifies the added complexity.

### Lead attribution & conversion tracking — **BUILT**
- `lib/utm.ts`: captures `utm_source/medium/campaign/term/content` from the landing URL into `sessionStorage` on first load, persists across internal navigation so attribution survives a visitor browsing multiple pages before converting.
- `ContactForm` writes `contacts.source` as `'ad'` automatically when UTM params are present (else falls back to the page's default), and appends UTM data to `leads.source_detail` (e.g. `"landing-page | google/buyers"`).
- `lib/analytics.ts` + root layout: Google Ads gtag and Meta Pixel both load site-wide; `trackLeadConversion()` fires both platforms' lead-conversion events immediately after a successful Supabase insert (not before, so only confirmed leads report as conversions).

### Phase 2 — Lead magnet + capture
- Build an **interactive investor cash flow / cap rate calculator** as a lead magnet (plays directly to your analytical edge, doubles as content and demonstrates expertise)
- Every calculator use + email capture writes a `contacts` + `leads` row
- Add a simple newsletter signup for market updates

### Phase 3 — Automation engine online
- Deploy n8n on a small VPS
- First workflow: **new lead → Claude API drafts a personalized welcome email/SMS → sent via Resend/Twilio → logged in `interactions`**
- Second workflow: follow-up reminders based on `next_follow_up_at`

### Phase 4 — Content engine
- Weekly cadence: **one pillar post** — e.g., "Analyzing this SA fourplex: real numbers" (written, using real or anonymized listing data + your cash flow calculator)
- n8n workflow: on publish, call Claude API to generate 3–5 social captions + a short video script from the pillar post, store in `content_pieces.derived_assets`
- This is your signature content type — it's differentiated (most agents don't do real numbers-based analysis), automatable, and speaks directly to the investor niche

### Phase 5 — Off-market/investor sourcing
- Pull Bexar County Appraisal District public data (absentee owners, tax delinquency, homestead status)
- Build a scored list (e.g., absentee + tax delinquent = high priority) → feeds into `properties` and `leads`
- Start with manual mail merge for direct mail; automate skip tracing later once volume justifies the cost

### Phase 6 — Referral/sphere automation
- Simple recurring workflow: quarterly automated (but personalized via Claude) check-in to past clients and your investor network, logged as `interactions`

---

## 5. Compliance notes — verify before automating outreach

These aren't optional and apply regardless of tech stack:

- **TCPA / Do-Not-Call:** cold SMS/calls require consent; scrub against the National DNC registry before any automated outreach campaign.
- **TREC advertising rules:** once you're with a broker, all marketing (website, social, ads) must include required broker identification per TREC rules — build this into your site/content templates from day one so you're not retrofitting later.
- **Fair Housing:** AI-generated ad copy and targeting (especially paid ads) needs a human review pass — automated copy can inadvertently violate fair housing advertising rules around language or ad targeting.
- **Public records use:** pulling from county appraisal/tax data is legal and common practice, but keep records of your data source for compliance/audit purposes.

None of this blocks the build — it just needs a review checkpoint before any workflow starts sending unsupervised outbound messages.

---

## 6. Where AI (Claude API) plugs in specifically

- **Content generation:** pillar post → social captions → video scripts (Phase 4)
- **Lead personalization:** tailoring first-touch emails/SMS based on lead source and property data (Phase 3)
- **Deal analysis narrative:** turning raw cash-flow numbers into a readable investor-facing writeup (Phase 2/4)
- **Lead scoring/summarization:** as `interactions` accumulate, periodic Claude-generated summaries of a lead's engagement history so you can triage manually (later phase)
- **Website chat/FAQ assistant:** answering visitor questions about your niche and process (later phase, once traffic justifies it)

---

## 7. Expansion path

Because n8n sits in the middle as the orchestration layer, adding new pieces later doesn't require re-architecting:
- New lead source → new workflow trigger, same `leads` table
- Paid ads → new source tag, same nurture logic
- Transaction management (your Phase 2 priority from the original interview) → new `transactions` table, hooks into existing `contacts`/`leads`
- Team/mentor step-in on deals → just another `interactions` channel and a notification workflow

---

*Fee schedules, TCPA/TREC specifics, and county data formats should be verified directly — this document is a technical build plan, not legal or compliance advice.*
