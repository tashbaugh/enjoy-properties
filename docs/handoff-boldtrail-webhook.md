# Handoff: Finish `app/api/webhooks/boldtrail-lead`

**Source of payload:** Real (sample/test) lead record pulled directly from Tyler's kvCORE/BoldTrail account via Zapier's trigger test step. This is the actual field shape BoldTrail sends — not guessed or from docs.

---

## Full payload observed (buyer-type lead example)

```
Created: 2026-08-31
Is Seller: No
Street: 123 Fake Street
Lead's City (based on IP Address): Liberty
Lead's State (based on IP Address): NY
Lead's Zipcode (based on IP Address): 12345

// Conditional — only populated when Is Seller = Yes:
If Seller Lead, seller's street: (empty in this sample)
If Seller Lead, seller's city: (empty in this sample)
If Seller Lead, seller's state: (empty in this sample)
If Seller Lead, seller's zipcode: (empty in this sample)
If Seller Lead, seller's full address: 123 Fake Street Liberty NY 12345

URL or source that brought lead into your CRM: https://www.google.com/
How the lead made it into your database: none
Hashtags add to lead (e.g. #hotlead,#justbrowsing,#followup): pb80230ceansideDr,77388,western
Leadid: 0
On Drip: Yes
Lead Email Address: test0@ire.dev
Type of lead status: Contract
Firstname: test
Lastname: lead
Quality of lead (options are 0-5): 5
Phone: 801-555-0000
Lead Details Link: https://login.texaspremierrealty.com/leads?cid=0
Assigned Agent ID: 1000
Assigned Agent Email: testagent0@ire.dev
Assigned Agent name: Test Agent
Email Status: Subscribed
Has Lender: No
```

**Caveat:** this is a synthetic test record (`test0@ire.dev`, `Firstname: test`, `Leadid: 0`). Some fields — especially `Leadid` — may behave differently on a real production lead. Recommend testing the finished webhook against at least one real (or realistic manual) lead before considering this done, not just this sample.

---

## Field mapping — `contacts` table

| BoldTrail field | → | `contacts` column | Notes |
|---|---|---|---|
| `Firstname` + `Lastname` | → | `name` | Concatenate with a space; trim if either is empty |
| `Lead Email Address` | → | `email` | |
| `Phone` | → | `phone` | Normalize format (currently `801-555-0000`) to match however other sources store phone — check existing `ContactForm` normalization logic and reuse |
| *(fixed value)* | → | `source` | `'ad'` is already used for paid ads; use a new literal `'boldtrail'` here so it's distinguishable in the `source` enum/check constraint — confirm whether `contacts.source` is a free enum or a Postgres `CHECK` constraint that needs updating to allow this new value |
| `Is Seller` | → | `contact_type` | `Is Seller: No` → `'buyer'`, `Is Seller: Yes` → `'seller'`. **Open question:** does BoldTrail ever send renter/landlord/investor lead types, or is buyer/seller the only distinction? Not observable from this single sample — flag to Tyler to check with a few more real leads once live, since current schema also supports `'investor'`/`'past_client'` values that this mapping doesn't yet populate. |
| `Hashtags add to lead` | → | `tags[]` | Store raw comma-split values as-is (e.g. `['pb80230ceansideDr', '77388', 'western']`) — don't attempt semantic parsing yet, format isn't obviously human-authored in this sample |

## Field mapping — `leads` table

| BoldTrail field | → | `leads` column | Notes |
|---|---|---|---|
| *(fixed value)* | → | `source_detail` | `'boldtrail-zapier'` per existing convention noted in build plan |
| `Leadid` | → | `external_id` | **Caution:** this sample shows `0`, likely a test-record artifact. If a real webhook payload ever arrives with `Leadid` missing, null, or `0`, do NOT silently treat it as a valid idempotency key — either reject/flag for manual review, or fall back to a composite key (email + phone + `Created` timestamp) for deduplication purposes only, and log a warning. Confirm real `Leadid` behavior once a genuine lead comes through. |
| *(fixed value)* | → | `external_source` | `'boldtrail'` |
| `Quality of lead (options are 0-5)` | → | `score` | Direct pass-through, already 0-5 integer scale |
| `Type of lead status` | → | `stage` | **Needs an explicit mapping table** — BoldTrail's vocabulary doesn't match `leads.stage`'s enum (`new \| contacted \| nurturing \| qualified \| under_contract \| closed \| lost`). This sample shows `"Contract"` (likely maps to `under_contract`), but the full set of BoldTrail status values isn't known from one sample. **Recommend:** default unmapped/unknown status values to `'new'` and log the raw BoldTrail value somewhere (e.g. a `raw_external_status` text column, or just log it) so the mapping table can be expanded as more real statuses are observed, rather than guessing the full enum now. |
| `Created` | → | `created_at` (or leave default) | If BoldTrail's `Created` timestamp should be authoritative over insert-time, map explicitly; otherwise let the table default `now()` apply and just note both timestamps exist if useful for debugging |

## Fields to capture but not yet mapped to an existing column

Store these somewhere retrievable (e.g., in a `raw_payload jsonb` column if one exists on `leads`/`contacts`, or defer if no such column exists yet — don't drop silently):

- `Lead's City/State/Zipcode (based on IP Address)` — approximate geolocation, could be useful later for regional lead-source analysis but not core to MVP
- `URL or source that brought lead into your CRM` — this is BoldTrail's own attribution field (e.g. `https://www.google.com/`), distinct from your own `utm_*` attribution system. Worth keeping for reference even if it doesn't drive current logic.
- `How the lead made it into your database` — showed `none` in this sample; unclear what other values look like
- `On Drip` — whether BoldTrail's own nurture drip is active for this lead; could matter for avoiding duplicate outreach if BoldTrail is *also* messaging this lead independently of your Supabase pipeline — worth being aware of, not necessarily building logic around yet
- `Lead Details Link` — direct link back to the lead in BoldTrail's dashboard, handy for manual lookup/debugging
- `Assigned Agent ID / Email / Name` — in this sample it's a "Test Agent," but on real leads this should always be Tyler. Worth a sanity-check assertion (log a warning if `Assigned Agent Email` isn't Tyler's, in case leads ever get routed elsewhere unexpectedly)
- `Email Status` — `Subscribed` in this sample; if BoldTrail tracks its own separate email opt-out status distinct from your `contacts.email_opted_out` column, decide whether to sync it or treat as informational only
- `Has Lender` — could matter for buyer-lead prioritization/scoring later, not core to MVP mapping

## Idempotency

Recall the existing schema already has `leads.external_source`/`external_id` plus an idempotency index (built this session per Claude Code's summary). Use `external_source = 'boldtrail'` + `external_id = Leadid` as the dedup key — **contingent on resolving the `Leadid: 0` concern above** before trusting it blindly in production.

## Auth / webhook security

This is a Zapier-triggered webhook, not a native BoldTrail webhook — Zapier's "Webhooks by Zapier" action will POST to `app/api/webhooks/boldtrail-lead` with whatever payload shape you configure in Zapier's action step (likely a direct field mapping, not necessarily the raw BoldTrail structure shown above — Zapier lets you remap field names in its own UI when building the action step).

`BOLDTRAIL_WEBHOOK_SECRET` (already an expected env var) should be enforced here — recommend having Zapier send it as a custom header (e.g. `X-Webhook-Secret`) on the outbound POST, and reject any request that doesn't match. Confirm this is set up in Zapier's Action step configuration once you're back there.

## Next steps for Tyler (not Claude Code)

1. Finish configuring Zapier's **Action** step (Step 2) — likely "Webhooks by Zapier" — POST — your production `app/api/webhooks/boldtrail-lead` URL, with the field mapping and the secret header configured
2. Once Claude Code has the webhook logic finished per this spec, run a real end-to-end test: trigger a new lead in BoldTrail → confirm it lands correctly in Supabase `contacts`/`leads` with correct field mapping
3. Watch specifically for the `Leadid` and `Type of lead status` open questions above — both need a second real data point to resolve confidently

---

## Resolution — implemented Aug 31, 2026

Built and verified end-to-end against production (real inserts, then cleaned up) with the real sample payload above, plus a second payload testing the merge/idempotency paths. Key decisions, several beyond what this handoff prescribed:

- **JSON contract, not raw BoldTrail field names — revised after a real bug.** The route originally specified camelCase keys (`firstName`, `isSeller`, `leadStatus`, etc.), on the assumption Tyler would map Zapier's Action step onto them. In practice the Action step was configured with BoldTrail's own snake_case naming instead (`firstname`, `is_seller`, `lead_status`, `lead_score`, `assigned_agent_email`, `external_id` for Leadid, `created_at`, `source_url`, `source_method`, `on_drip`, `has_lender`, `geo_city`/`geo_state`/`geo_zipcode`, `seller_full_address`, etc.) — every camelCase field lookup silently read as `undefined`. Caught via a real webhook call: `name` landed as the `'BoldTrail Lead'` fallback, `stage` as `'new'` instead of `under_contract`, `score` as `null`, and the assigned-agent mismatch warning never fired because the check itself never ran. **Fixed by changing the route to match the real (snake_case) keys already live in Zapier**, rather than asking Tyler to go back and rename every field mapping. Re-verified against the exact real payload shape (pulled from the bugged row's `raw_payload`, which stored correctly throughout since it's captured verbatim regardless of field-name matching) — all four fields now land correctly, and the assigned-agent warning fires as intended.
- **Phone:** stored as-is. `ContactForm` does no normalization today, so there's no existing logic to reuse — matches that pattern rather than introducing a new one.
- **`contacts.source` CHECK constraint:** was a hard allowlist (`public_record | referral | content | ad`) that didn't include `boldtrail` — added via migration.
- **Not-yet-mapped fields:** rather than one column per field, added `leads.raw_payload jsonb` storing the full payload verbatim (same snapshot pattern as `calculator_inputs`/`calculator_results`). Covers every field this handoff flagged as unmapped in one shot, including BoldTrail's raw lead-status string for growing the stage-mapping table later.
- **`Leadid: 0` handling:** implemented the composite-key-avoidance option, not rejection — a real inbound lead should never get silently dropped over an idempotency-key quirk. When `leadId` is missing/empty/`'0'`, the route skips the dedup check entirely (logs a warning) and always processes the lead; `external_id` stays `null` so it can't collide with a different lead under the partial unique index. Verified: a retry with a *valid* `leadId` does correctly short-circuit to `200 already processed` without creating a duplicate lead row.
- **Upsert-by-email:** if a contact already exists, reuse it and merge (not overwrite) `tags` — verified a second webhook call to the same email added a new tag without touching name/phone or duplicating the contact.
- **Assigned Agent sanity check:** confirmed with Tyler that `tyler@enjoyproperties.us` is the real BoldTrail-assigned-agent email; the route logs a warning (not a hard failure) when a payload's `assignedAgentEmail` doesn't match.
- **Welcome message send — important deviation from a literal reading of the original Phase 3 spec:** per spec §2.4, BoldTrail's own consent checkbox is treated as insufficient for an SMS send under Tyler's identity. So this route sends the welcome **email** (Claude-drafted search-context sentence, always falls back to the deterministic generic sentence since BoldTrail's payload has no structured price/area/bedroom fields to feed the model) but for SMS sends the **double opt-in request** ("Reply YES...") instead of the §2.3 welcome-skeleton SMS — that skeleton is effectively unused for a BoldTrail lead's first touch, since `sms_consent` starts `false` and nothing here sends real SMS content until an affirmative reply flips it via `app/api/webhooks/twilio-inbound`.
- **CAN-SPAM physical address gate:** `BROKERAGE_PHYSICAL_ADDRESS` still isn't set (same gap flagged in the original Phase 3 spec, never resolved). The route checks for it and **skips the email send entirely** (logs an error) rather than send a legally non-compliant email missing a required physical address. Verified this gate fires correctly. Contact/lead rows and the SMS opt-in request still go through regardless — only the email send is blocked on this.
