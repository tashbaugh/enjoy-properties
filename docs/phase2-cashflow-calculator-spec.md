# Phase 2 — Investor Cash Flow / Cap Rate Calculator
**Spec for implementation.** Lives on `enjoyproperties.us/invest`, embedded — not a standalone route (decision log: see `lead-gen-system-build-plan.md`, Phase 2).

---

## 1. UX flow

1. Visitor lands on `/invest`, scrolls to the calculator section.
2. Fills in property/financing/expense inputs. **Free-tier results (cap rate, monthly cash flow) compute and update live as they type — no submit button, no gate.** This live-feedback loop is the "wow" moment that demonstrates the analytical-edge positioning; don't gate it.
3. Below the free results, a "Get the full breakdown" panel: email (+ optional first name) input, single submit.
4. On submit: write to Supabase (`contacts` + `leads`, see §4), fire `trackLeadConversion()`, then reveal the gated results **in place** (no redirect, no page reload — just unlock the panel using local component state).
5. Gated results stay visible for the rest of the session (don't re-lock on scroll/refresh within session — that's a bad-faith gate pattern, actively avoid it. Refreshing the page can safely re-lock, that's a reasonable/normal SaaS pattern).

## 2. Inputs

**Property details**
| Field | Default | Notes |
|---|---|---|
| Purchase price | — (required) | $ |
| Estimated monthly rent | — (required) | $ |
| Annual property tax | — (required) | $. Placeholder hint: "~2–2.5% of value is typical for Bexar County" |
| Annual insurance | — (required) | $ |
| Monthly HOA | 0 | $, optional |

**Financing**
| Field | Default | Notes |
|---|---|---|
| Down payment | 20% | % of purchase price |
| Interest rate | 7.0% | Annual. Flag in code comments that this default should be refreshed periodically — don't let it go stale silently |
| Loan term | 30 years | |

**Operating assumptions** (all editable, sensible defaults so a first-time user doesn't have to know real estate jargon to get a number)
| Field | Default | Notes |
|---|---|---|
| Vacancy rate | 5% | % of gross rent |
| Maintenance reserve | 8% | % of gross rent |
| Self-manage or PM? | Self-manage | Toggle. If PM selected: PM fee % of gross rent, default 9% |
| Closing costs | 3% | % of purchase price — used only in cash-on-cash calc |

**5-year projection assumptions**
| Field | Default | Notes |
|---|---|---|
| Annual appreciation | 3% | |
| Annual rent growth | 2% | |

## 3. Calculations

Put these in `lib/calculator.ts` as pure functions — no React, no side effects, fully unit-testable, and reusable later for Phase 4 pillar-post content generation.

```
loanAmount = purchasePrice * (1 - downPaymentPct)
downPaymentDollar = purchasePrice * downPaymentPct

monthlyRate = interestRate / 12
n = loanTermYears * 12
monthlyPI = loanAmount * monthlyRate * (1+monthlyRate)^n / ((1+monthlyRate)^n - 1)

effectiveMonthlyRent = monthlyRent * (1 - vacancyPct)
monthlyOpEx = (annualPropertyTax/12) + (annualInsurance/12) + monthlyHOA
            + (monthlyRent * maintenancePct)
            + (monthlyRent * pmPct)              // 0 if self-managed

// Free tier
monthlyCashFlow = effectiveMonthlyRent - monthlyOpEx - monthlyPI
annualNOI = (effectiveMonthlyRent - monthlyOpEx) * 12
capRate = annualNOI / purchasePrice

// Gated tier
totalCashInvested = downPaymentDollar + (purchasePrice * closingCostPct)
annualCashFlow = monthlyCashFlow * 12
cashOnCashReturn = annualCashFlow / totalCashInvested

// 5-year table, year 1..5
propertyValue[y] = purchasePrice * (1 + appreciationPct)^y
loanBalance[y]   = standard amortization remaining-balance formula at month (y*12)
equity[y]        = propertyValue[y] - loanBalance[y]
projectedRent[y] = monthlyRent * (1 + rentGrowthPct)^y
projectedCashFlow[y] = recompute monthlyCashFlow using projectedRent[y], same opex/PI structure
```

**Expense breakdown to display (gated):** mortgage P&I, property tax, insurance, HOA, vacancy reserve, maintenance reserve, PM fee (if applicable) — as a simple table, monthly and annual columns.

**Disclaimer — include in the UI, small text under the gated results:** "Estimates based on the assumptions above, not a guarantee of actual performance. Consult a tax or financial professional before making an investment decision." This isn't a TREC requirement, just good practice — a public-facing tool making return projections should say plainly that it's assumption-driven.

## 4. Schema changes

Two new nullable columns on the existing `leads` table — light migration, no data loss, consistent with Phase 1's "create tables now, alter later as needed" approach:

```sql
alter table leads
  add column calculator_inputs jsonb,
  add column calculator_results jsonb;
```

- `calculator_inputs`: raw form state at time of submission (purchase price, rent, all assumptions used) — this is what makes the lead usable for a real follow-up conversation instead of just a name and email.
- `calculator_results`: computed outputs at time of submission (cap rate, cash flow, cash-on-cash, the 5-yr table). Storing this as a snapshot — not recomputing later — means if the formulas or default assumptions change down the road, historical leads still reflect what the visitor actually saw.

**Tagging:** add `"calculator"` to `leads.tags[]` (same array-tag pattern already used for `"lease"`) to distinguish calculator-driven leads from any other `/invest` contact form activity.

**contacts / leads field values for this flow:**
- `contacts.source` = `'ad'` if UTM present, else `'content'` (falls back per existing `ContactForm` logic)
- `contacts.contact_type` = `'investor'`
- `leads.source_detail` = `'invest-page | calculator'`
- `leads.tags` includes `'calculator'`

## 5. Component structure

- `app/invest/page.tsx` — imports and renders `<CashFlowCalculator />` in the existing `/invest` layout.
- `components/CashFlowCalculator.tsx` — client component (`'use client'`). Owns all form state via `useState`, calls `lib/calculator.ts` functions on every keystroke for the free tier, renders results live.
- `lib/calculator.ts` — pure calculation functions, no framework dependency.
- Email capture step reuses the existing Supabase insert pattern from `ContactForm` (client-side insert, no API route needed at this scale) — but as its own small component or an extended mode of `ContactForm`, since it needs to also write `calculator_inputs`/`calculator_results` and unlock the results panel post-insert rather than showing a generic "thanks" state.
- `trackLeadConversion()` fires immediately after the Supabase insert succeeds, matching the rest of the site's conversion definition (fires once, post-confirmed-write, not on click or form-start).

## 6. Interest rate auto-update — FRED API via Vercel Cron

The 7.0% interest rate default will go stale silently if left hardcoded. Fix this with a scheduled fetch rather than a manual reminder — decoupled from Phase 3/n8n entirely, since n8n isn't live yet and this doesn't need to wait for it.

**Status as of the initial calculator build (Aug 2026): not implemented.** The shipped version uses a static hardcoded default (6.6%, the mid-6% national average at build time per a one-off web search) — this section wasn't part of the spec handed off for that build pass.

**Source:** FRED (Federal Reserve Economic Data) API, series `MORTGAGE30US` — the Freddie Mac Primary Mortgage Market Survey 30-year fixed rate, released weekly (Thursdays). Free API key, no cost, simple REST/JSON.

**Schema:** one small table, not a new column on `leads`:
```sql
create table site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
```
Store as `{ "key": "mortgage_rate_30yr", "value": {"rate": 7.02, "source": "FRED MORTGAGE30US", "as_of": "2026-08-20"} }`. A generic key/value table rather than a single-purpose one, since other site-wide defaults (e.g. property tax rate assumption) may want the same treatment later.

**Implementation — Vercel Cron:**
- `app/api/cron/update-mortgage-rate/route.ts` — a route handler that:
  1. Calls `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=...&file_type=json&sort_order=desc&limit=1`
  2. Parses the latest observation value
  3. Upserts it into `site_config` under `mortgage_rate_30yr`
- `vercel.json` cron entry, scheduled weekly after the Thursday 10am ET release — e.g. Friday morning to give the data a buffer:
```json
{
  "crons": [
    { "path": "/api/cron/update-mortgage-rate", "schedule": "0 14 * * 5" }
  ]
}
```
  (14:00 UTC Friday = 9am Central)
- Protect the route with Vercel's `CRON_SECRET` env var check (Vercel sends it as a bearer token automatically on cron-triggered requests) so the endpoint can't be hit publicly to force-refresh or spam the FRED API.
- `FRED_API_KEY` as a Vercel environment variable, not committed to the repo.

**RLS:** keep `site_config` locked down like every other non-public table — no anon select policy. The calculator doesn't read it directly; instead, add a small server-side API route (e.g. `app/api/mortgage-rate/route.ts`) that reads `site_config` using the service-role key and returns just `{ rate: 7.02 }` to the client. `CashFlowCalculator.tsx` fetches from that route, not from Supabase directly. This keeps the "locked down by default, explicit anon-insert only on `contacts`/`leads`" posture from Phase 1 intact — `site_config` never gets a public-facing policy at all.

**Consuming the value:** `CashFlowCalculator.tsx` calls `/api/mortgage-rate` on page load and uses the returned value as the interest rate field's default — still fully editable by the visitor, this only changes what they see pre-filled.

**Fallback:** if the `site_config` row is missing or the cron hasn't run yet (first deploy), fall back to a hardcoded default in code — same 7.0% placeholder, just as a safety net rather than the primary source.

## 7. Explicitly out of scope for this phase

- No PDF export / email-me-a-copy feature — the unlock-in-place UX covers the "give me something for my email" incentive without the extra build surface.
- No saved/returning-user state (e.g. "resume my calculation") — out of scope until there's a reason to build accounts.
- No server-side recalculation/validation of the free-tier numbers before insert — trust the client-computed values for now given the low stakes (it's a lead magnet, not a transaction). Revisit if this ever becomes something with real money attached.
