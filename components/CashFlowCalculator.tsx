'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { captureUtmParams, buildSourceDetail, resolveContactSource } from '@/lib/utm';
import { trackLeadConversion } from '@/lib/analytics';
import {
  DEFAULT_INPUTS,
  calculateFreeTierResults,
  calculateGatedResults,
  type CalculatorInputs,
} from '@/lib/calculator';

// UI form state mirrors CalculatorInputs but keeps percentages as whole
// numbers ("20" not "0.2") since that's what a visitor expects to type.
type FormState = {
  purchasePrice: string;
  monthlyRent: string;
  annualPropertyTax: string;
  annualInsurance: string;
  monthlyHoa: string;
  downPaymentPct: string;
  interestRate: string;
  loanTermYears: string;
  vacancyPct: string;
  maintenancePct: string;
  selfManage: boolean;
  pmPct: string;
  closingCostPct: string;
  appreciationPct: string;
  rentGrowthPct: string;
};

// Rounds to 1 decimal place when converting a stored decimal fraction
// (e.g. 0.066) to a whole-number-ish percent string for display — a plain
// `* 100` can land on 6.6000000000000005 due to binary float rounding.
const pctString = (decimal: number) => String(Math.round(decimal * 1000) / 10);

const INITIAL_FORM: FormState = {
  purchasePrice: '',
  monthlyRent: '',
  annualPropertyTax: '',
  annualInsurance: '',
  monthlyHoa: '0',
  downPaymentPct: pctString(DEFAULT_INPUTS.downPaymentPct),
  interestRate: pctString(DEFAULT_INPUTS.interestRate),
  loanTermYears: String(DEFAULT_INPUTS.loanTermYears),
  vacancyPct: pctString(DEFAULT_INPUTS.vacancyPct),
  maintenancePct: pctString(DEFAULT_INPUTS.maintenancePct),
  selfManage: true,
  pmPct: pctString(DEFAULT_INPUTS.pmPct),
  closingCostPct: pctString(DEFAULT_INPUTS.closingCostPct),
  appreciationPct: pctString(DEFAULT_INPUTS.appreciationPct),
  rentGrowthPct: pctString(DEFAULT_INPUTS.rentGrowthPct),
};

function toCalculatorInputs(form: FormState): CalculatorInputs {
  const num = (v: string) => Number(v) || 0;
  return {
    purchasePrice: num(form.purchasePrice),
    monthlyRent: num(form.monthlyRent),
    annualPropertyTax: num(form.annualPropertyTax),
    annualInsurance: num(form.annualInsurance),
    monthlyHoa: num(form.monthlyHoa),
    downPaymentPct: num(form.downPaymentPct) / 100,
    interestRate: num(form.interestRate) / 100,
    loanTermYears: num(form.loanTermYears),
    vacancyPct: num(form.vacancyPct) / 100,
    maintenancePct: num(form.maintenancePct) / 100,
    selfManage: form.selfManage,
    pmPct: num(form.pmPct) / 100,
    closingCostPct: num(form.closingCostPct) / 100,
    appreciationPct: num(form.appreciationPct) / 100,
    rentGrowthPct: num(form.rentGrowthPct) / 100,
  };
}

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percent = (n: number) => `${(n * 100).toFixed(1)}%`;

const labelClasses = 'text-xs font-semibold uppercase tracking-wide text-ink-soft';
const inputClasses =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30';

function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClasses}>{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft/70">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-ink-soft/70">{hint}</span>}
    </label>
  );
}

export default function CashFlowCalculator() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [gateForm, setGateForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'unlocked' | 'error'>('idle');

  // True once the visitor touches the interest rate field themselves --
  // guards the /api/mortgage-rate fetch below from clobbering an edit
  // that happens to land during the brief fetch window.
  const userEditedRate = useRef(false);

  useEffect(() => {
    captureUtmParams();
  }, []);

  useEffect(() => {
    fetch('/api/mortgage-rate')
      .then((res) => res.json())
      .then((data: { rate: number | null }) => {
        // data.rate is already a percent (e.g. 6.65, not 0.0665) -- same
        // shape the form field displays, just rounded to 1 decimal.
        if (typeof data.rate === 'number' && !userEditedRate.current) {
          setField('interestRate', String(Math.round(data.rate * 10) / 10));
        }
      })
      .catch(() => {
        // Network/API failure -- silently keep the static DEFAULT_INPUTS
        // fallback already in INITIAL_FORM, per spec §6.
      });
  }, []);

  const inputs = useMemo(() => toCalculatorInputs(form), [form]);
  const freeTier = useMemo(() => calculateFreeTierResults(inputs), [inputs]);
  const gated = useMemo(() => calculateGatedResults(inputs), [inputs]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: gateForm.name || 'Investor lead',
        email: gateForm.email,
        source: resolveContactSource('content'),
        contact_type: 'investor',
        tags: ['calculator'],
      })
      .select('id')
      .single();

    if (contactError || !contact) {
      setStatus('error');
      return;
    }

    const { error: leadError } = await supabase.from('leads').insert({
      contact_id: contact.id,
      stage: 'new',
      source_detail: buildSourceDetail('invest-page | calculator'),
      calculator_inputs: inputs,
      calculator_results: { freeTier, gated },
    });

    if (leadError) {
      setStatus('error');
      return;
    }

    trackLeadConversion('investor');
    setStatus('unlocked');
  }

  const unlocked = status === 'unlocked';

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-ink">Cash Flow Calculator</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Enter a property&apos;s numbers below — cap rate and cash flow update as you type.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <NumberField
          label="Purchase price"
          suffix="$"
          value={form.purchasePrice}
          onChange={(v) => setField('purchasePrice', v)}
        />
        <NumberField
          label="Estimated monthly rent"
          suffix="$"
          value={form.monthlyRent}
          onChange={(v) => setField('monthlyRent', v)}
        />
        <NumberField
          label="Annual property tax"
          suffix="$"
          hint="~2–2.5% of value is typical for Bexar County"
          value={form.annualPropertyTax}
          onChange={(v) => setField('annualPropertyTax', v)}
        />
        <NumberField
          label="Annual insurance"
          suffix="$"
          value={form.annualInsurance}
          onChange={(v) => setField('annualInsurance', v)}
        />
        <NumberField
          label="Monthly HOA"
          suffix="$"
          value={form.monthlyHoa}
          onChange={(v) => setField('monthlyHoa', v)}
        />
        <NumberField
          label="Down payment"
          suffix="%"
          value={form.downPaymentPct}
          onChange={(v) => setField('downPaymentPct', v)}
        />
        <NumberField
          label="Interest rate"
          suffix="%"
          value={form.interestRate}
          onChange={(v) => {
            userEditedRate.current = true;
            setField('interestRate', v);
          }}
        />
        <NumberField
          label="Loan term"
          suffix="years"
          value={form.loanTermYears}
          onChange={(v) => setField('loanTermYears', v)}
        />
        <NumberField
          label="Vacancy rate"
          suffix="%"
          value={form.vacancyPct}
          onChange={(v) => setField('vacancyPct', v)}
        />
        <NumberField
          label="Maintenance reserve"
          suffix="%"
          value={form.maintenancePct}
          onChange={(v) => setField('maintenancePct', v)}
        />
        <NumberField
          label="Closing costs"
          suffix="%"
          hint="Used only in the cash-on-cash figure below"
          value={form.closingCostPct}
          onChange={(v) => setField('closingCostPct', v)}
        />
        <div className="flex flex-col gap-1.5">
          <span className={labelClasses}>Management</span>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                checked={form.selfManage}
                onChange={() => setField('selfManage', true)}
              />
              Self-manage
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                checked={!form.selfManage}
                onChange={() => setField('selfManage', false)}
              />
              Property manager
            </label>
          </div>
        </div>
        {!form.selfManage && (
          <NumberField
            label="PM fee"
            suffix="%"
            value={form.pmPct}
            onChange={(v) => setField('pmPct', v)}
          />
        )}
      </div>

      <div className="mt-8 grid gap-4 rounded-xl bg-paper p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Cap rate</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">
            {percent(freeTier.capRate)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Monthly cash flow
          </p>
          <p
            className={`mt-1 font-display text-3xl font-semibold ${
              freeTier.monthlyCashFlow >= 0 ? 'text-ink' : 'text-red-600'
            }`}
          >
            {currency(freeTier.monthlyCashFlow)}
          </p>
        </div>
      </div>

      {!unlocked ? (
        <form onSubmit={handleUnlock} className="mt-8 rounded-xl border border-line p-6">
          <h3 className="font-display text-lg font-semibold text-ink">Get the full breakdown</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Cash-on-cash return, the full expense breakdown, and a 5-year equity projection —
            unlocked instantly, no redirect.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="First name (optional)"
              className={inputClasses}
              value={gateForm.name}
              onChange={(e) => setGateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="email"
              required
              placeholder="jane@email.com"
              className={inputClasses}
              value={gateForm.email}
              onChange={(e) => setGateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <button
            disabled={status === 'submitting'}
            className="mt-4 w-full rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {status === 'submitting' ? 'Unlocking...' : 'Show me the full breakdown'}
          </button>
          {status === 'error' && (
            <p className="mt-3 text-sm text-red-600">Something went wrong — try again.</p>
          )}
        </form>
      ) : (
        <div className="mt-8 rounded-xl border border-line p-6">
          <h3 className="font-display text-lg font-semibold text-ink">Full breakdown</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Total cash invested
              </p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {currency(gated.totalCashInvested)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Cash-on-cash return
              </p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {percent(gated.cashOnCashReturn)}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Monthly expenses
            </p>
            <table className="mt-2 w-full min-w-[360px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft/70">
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 font-medium">Monthly</th>
                  <th className="py-1 font-medium">Annual</th>
                </tr>
              </thead>
              <tbody className="text-ink">
                {[
                  ['Mortgage P&I', gated.expenseBreakdown.mortgagePI],
                  ['Property tax', gated.expenseBreakdown.propertyTax],
                  ['Insurance', gated.expenseBreakdown.insurance],
                  ['HOA', gated.expenseBreakdown.hoa],
                  ['Vacancy reserve', gated.expenseBreakdown.vacancyReserve],
                  ['Maintenance reserve', gated.expenseBreakdown.maintenanceReserve],
                  ...(form.selfManage ? [] : [['PM fee', gated.expenseBreakdown.pmFee] as const]),
                ].map(([label, monthly]) => (
                  <tr key={label} className="border-t border-line">
                    <td className="py-1.5">{label}</td>
                    <td className="py-1.5">{currency(monthly as number)}</td>
                    <td className="py-1.5">{currency((monthly as number) * 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              5-year projection
            </p>
            <table className="mt-2 w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft/70">
                  <th className="py-1 font-medium">Year</th>
                  <th className="py-1 font-medium">Value</th>
                  <th className="py-1 font-medium">Equity</th>
                  <th className="py-1 font-medium">Rent</th>
                  <th className="py-1 font-medium">Cash flow</th>
                </tr>
              </thead>
              <tbody className="text-ink">
                {gated.fiveYearProjection.map((row) => (
                  <tr key={row.year} className="border-t border-line">
                    <td className="py-1.5">Year {row.year}</td>
                    <td className="py-1.5">{currency(row.propertyValue)}</td>
                    <td className="py-1.5">{currency(row.equity)}</td>
                    <td className="py-1.5">{currency(row.projectedRent)}</td>
                    <td className="py-1.5">{currency(row.projectedCashFlow)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-ink-soft/70">
            Estimates based on the assumptions above, not a guarantee of actual performance.
            Consult a tax or financial professional before making an investment decision.
          </p>
        </div>
      )}
    </div>
  );
}
