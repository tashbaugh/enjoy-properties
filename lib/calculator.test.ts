import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPI,
  calculateLoanBalance,
  calculateFreeTierResults,
  calculateGatedResults,
  DEFAULT_INPUTS,
  type CalculatorInputs,
} from './calculator';

describe('calculateMonthlyPI', () => {
  it('matches a standard amortization reference figure ($100k, 6%, 30yr ~ $599.55)', () => {
    expect(calculateMonthlyPI(100000, 0.06, 30)).toBeCloseTo(599.55, 1);
  });

  it('handles 0% interest as a straight-line payment (no compounding)', () => {
    expect(calculateMonthlyPI(120000, 0, 10)).toBeCloseTo(1000, 5);
  });

  it('scales linearly with loan amount for a fixed rate/term', () => {
    const base = calculateMonthlyPI(100000, 0.06, 30);
    const doubled = calculateMonthlyPI(200000, 0.06, 30);
    expect(doubled).toBeCloseTo(base * 2, 5);
  });
});

describe('calculateLoanBalance', () => {
  it('equals the original loan amount at month 0', () => {
    expect(calculateLoanBalance(200000, 0.06, 30, 0)).toBeCloseTo(200000, 5);
  });

  it('reaches ~0 at the end of the term when paid down at the computed P&I', () => {
    // The real correctness property both functions share: whatever
    // calculateMonthlyPI charges is exactly what amortizes the loan to
    // zero by the final month.
    expect(calculateLoanBalance(200000, 0.06, 30, 360)).toBeCloseTo(0, 2);
  });

  it('handles 0% interest as straight-line principal reduction', () => {
    expect(calculateLoanBalance(120000, 0, 10, 60)).toBeCloseTo(60000, 5);
  });
});

describe('calculateFreeTierResults', () => {
  const inputs: CalculatorInputs = {
    ...DEFAULT_INPUTS,
    purchasePrice: 200000,
    monthlyRent: 2000,
    annualPropertyTax: 3000,
    annualInsurance: 1200,
    monthlyHoa: 0,
    downPaymentPct: 0.2,
    interestRate: 0.06,
    loanTermYears: 30,
    vacancyPct: 0.05,
    maintenancePct: 0.08,
    selfManage: true,
  };

  it('computes cap rate and monthly cash flow against a hand-checked example', () => {
    // effective rent 2000*0.95=1900; opEx = 250 (tax) + 100 (insurance)
    // + 0 (hoa) + 160 (maintenance, 8% of rent) = 510; PI on a 160k
    // loan at 6%/30yr = 0.8 * $599.55/100k ~= 959.28
    const results = calculateFreeTierResults(inputs);
    expect(results.monthlyCashFlow).toBeCloseTo(1900 - 510 - 959.28, 1);
    expect(results.annualNOI).toBeCloseTo((1900 - 510) * 12, 1);
    expect(results.capRate).toBeCloseTo(((1900 - 510) * 12) / 200000, 3);
  });

  it('does not charge a PM fee when self-managing, even if pmPct is set', () => {
    const withPm = calculateFreeTierResults({ ...inputs, selfManage: false, pmPct: 0.1 });
    const selfManaged = calculateFreeTierResults(inputs);
    expect(selfManaged.monthlyCashFlow).toBeGreaterThan(withPm.monthlyCashFlow);
  });

  it('guards cap rate against divide-by-zero at purchasePrice 0', () => {
    const results = calculateFreeTierResults({ ...inputs, purchasePrice: 0 });
    expect(results.capRate).toBe(0);
    expect(Number.isFinite(results.capRate)).toBe(true);
  });
});

describe('calculateGatedResults', () => {
  const inputs: CalculatorInputs = {
    ...DEFAULT_INPUTS,
    purchasePrice: 200000,
    monthlyRent: 2000,
    annualPropertyTax: 3000,
    annualInsurance: 1200,
    monthlyHoa: 0,
    downPaymentPct: 0.2,
    interestRate: 0.06,
    loanTermYears: 30,
    vacancyPct: 0.05,
    maintenancePct: 0.08,
    closingCostPct: 0.03,
    appreciationPct: 0.03,
    rentGrowthPct: 0.02,
    selfManage: true,
  };

  it('computes total cash invested and cash-on-cash return against a hand-checked example', () => {
    const results = calculateGatedResults(inputs);
    // down payment 40000 + closing costs (3% of 200k) 6000 = 46000
    expect(results.totalCashInvested).toBeCloseTo(46000, 1);
    const { monthlyCashFlow } = calculateFreeTierResults(inputs);
    expect(results.cashOnCashReturn).toBeCloseTo((monthlyCashFlow * 12) / 46000, 4);
  });

  it('guards cash-on-cash return against divide-by-zero when nothing is invested', () => {
    const results = calculateGatedResults({ ...inputs, purchasePrice: 0, downPaymentPct: 0, closingCostPct: 0 });
    expect(results.cashOnCashReturn).toBe(0);
  });

  it('produces exactly 5 years of projection, each compounding on the last', () => {
    const results = calculateGatedResults(inputs);
    expect(results.fiveYearProjection).toHaveLength(5);
    expect(results.fiveYearProjection.map((y) => y.year)).toEqual([1, 2, 3, 4, 5]);

    const [y1, y2] = results.fiveYearProjection;
    expect(y2.propertyValue).toBeCloseTo(y1.propertyValue * 1.03, 1);

    // Equity should climb every year as the loan amortizes and the
    // property appreciates -- both work in the same direction here.
    for (let i = 1; i < results.fiveYearProjection.length; i++) {
      expect(results.fiveYearProjection[i].equity).toBeGreaterThan(results.fiveYearProjection[i - 1].equity);
    }
  });
});
