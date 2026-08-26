-- Phase 2 cash flow calculator (docs/phase2-cashflow-calculator-spec.md §4).
-- Snapshot columns, not recomputed later, so a historical lead still
-- reflects what the visitor actually saw even if formulas or default
-- assumptions change down the road.
--
-- Note: the spec's own wording says "leads.tags[]" for the "calculator"
-- tag, but tags actually only exists on `contacts` in this schema (same
-- as the existing "lease" tag) -- there is no tags column on `leads` to
-- add here.

alter table leads
  add column if not exists calculator_inputs jsonb,
  add column if not exists calculator_results jsonb;
