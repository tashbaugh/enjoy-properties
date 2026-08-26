// Pure investor cash flow / cap rate calculations for the /invest lead
// magnet. No React, no side effects — see docs/phase2-cashflow-calculator-spec.md
// §3 for the formulas this implements.

export type CalculatorInputs = {
  purchasePrice: number;
  monthlyRent: number;
  annualPropertyTax: number;
  annualInsurance: number;
  monthlyHoa: number;
  downPaymentPct: number; // 0–1
  // Default reflects the ~mid-6% national average as of Aug 2026 (Freddie
  // Mac PMMS / NerdWallet) — a live market rate, not a fixed assumption,
  // so it should be refreshed periodically rather than left stale.
  interestRate: number; // annual, 0–1
  loanTermYears: number;
  vacancyPct: number; // 0–1
  maintenancePct: number; // 0–1
  selfManage: boolean;
  pmPct: number; // 0–1, applied only when !selfManage
  closingCostPct: number; // 0–1
  appreciationPct: number; // 0–1
  rentGrowthPct: number; // 0–1
};

export const DEFAULT_INPUTS: CalculatorInputs = {
  purchasePrice: 0,
  monthlyRent: 0,
  annualPropertyTax: 0,
  annualInsurance: 0,
  monthlyHoa: 0,
  downPaymentPct: 0.2,
  interestRate: 0.066,
  loanTermYears: 30,
  vacancyPct: 0.05,
  maintenancePct: 0.08,
  selfManage: true,
  pmPct: 0.09,
  closingCostPct: 0.03,
  appreciationPct: 0.03,
  rentGrowthPct: 0.02,
};

export type FreeTierResults = {
  monthlyCashFlow: number;
  annualNOI: number;
  capRate: number;
};

export type ExpenseBreakdown = {
  mortgagePI: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  vacancyReserve: number;
  maintenanceReserve: number;
  pmFee: number;
};

export type YearProjection = {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  projectedRent: number;
  projectedCashFlow: number;
};

export type GatedResults = {
  totalCashInvested: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  expenseBreakdown: ExpenseBreakdown;
  fiveYearProjection: YearProjection[];
};

/** Standard fixed-rate monthly principal & interest payment. */
export function calculateMonthlyPI(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  const monthlyRate = annualInterestRate / 12;
  const n = loanTermYears * 12;
  if (monthlyRate === 0) return loanAmount / n;

  const factor = Math.pow(1 + monthlyRate, n);
  return (loanAmount * monthlyRate * factor) / (factor - 1);
}

/** Remaining loan balance after `monthsElapsed` payments. */
export function calculateLoanBalance(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number,
  monthsElapsed: number
): number {
  const monthlyRate = annualInterestRate / 12;
  const n = loanTermYears * 12;
  if (monthlyRate === 0) return loanAmount * (1 - monthsElapsed / n);

  const factorN = Math.pow(1 + monthlyRate, n);
  const factorP = Math.pow(1 + monthlyRate, monthsElapsed);
  return (loanAmount * (factorN - factorP)) / (factorN - 1);
}

function monthlyOpEx(inputs: CalculatorInputs, monthlyRent: number): number {
  const pmPct = inputs.selfManage ? 0 : inputs.pmPct;
  return (
    inputs.annualPropertyTax / 12 +
    inputs.annualInsurance / 12 +
    inputs.monthlyHoa +
    monthlyRent * inputs.maintenancePct +
    monthlyRent * pmPct
  );
}

/** Live, ungated results — cap rate and monthly cash flow. */
export function calculateFreeTierResults(inputs: CalculatorInputs): FreeTierResults {
  const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPct);
  const monthlyPI = calculateMonthlyPI(loanAmount, inputs.interestRate, inputs.loanTermYears);

  const effectiveMonthlyRent = inputs.monthlyRent * (1 - inputs.vacancyPct);
  const opEx = monthlyOpEx(inputs, inputs.monthlyRent);

  const monthlyCashFlow = effectiveMonthlyRent - opEx - monthlyPI;
  const annualNOI = (effectiveMonthlyRent - opEx) * 12;
  const capRate = inputs.purchasePrice > 0 ? annualNOI / inputs.purchasePrice : 0;

  return { monthlyCashFlow, annualNOI, capRate };
}

/** Full breakdown unlocked after email capture. */
export function calculateGatedResults(inputs: CalculatorInputs): GatedResults {
  const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPct);
  const downPaymentDollar = inputs.purchasePrice * inputs.downPaymentPct;
  const monthlyPI = calculateMonthlyPI(loanAmount, inputs.interestRate, inputs.loanTermYears);

  const { monthlyCashFlow } = calculateFreeTierResults(inputs);

  const totalCashInvested = downPaymentDollar + inputs.purchasePrice * inputs.closingCostPct;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCashReturn = totalCashInvested > 0 ? annualCashFlow / totalCashInvested : 0;

  const pmPct = inputs.selfManage ? 0 : inputs.pmPct;
  const expenseBreakdown: ExpenseBreakdown = {
    mortgagePI: monthlyPI,
    propertyTax: inputs.annualPropertyTax / 12,
    insurance: inputs.annualInsurance / 12,
    hoa: inputs.monthlyHoa,
    vacancyReserve: inputs.monthlyRent * inputs.vacancyPct,
    maintenanceReserve: inputs.monthlyRent * inputs.maintenancePct,
    pmFee: inputs.monthlyRent * pmPct,
  };

  const fiveYearProjection: YearProjection[] = Array.from({ length: 5 }, (_, i) => {
    const year = i + 1;
    const propertyValue = inputs.purchasePrice * Math.pow(1 + inputs.appreciationPct, year);
    const loanBalance = calculateLoanBalance(
      loanAmount,
      inputs.interestRate,
      inputs.loanTermYears,
      year * 12
    );
    const projectedRent = inputs.monthlyRent * Math.pow(1 + inputs.rentGrowthPct, year);
    const projectedEffectiveRent = projectedRent * (1 - inputs.vacancyPct);
    const projectedOpEx = monthlyOpEx(inputs, projectedRent);
    const projectedCashFlow = projectedEffectiveRent - projectedOpEx - monthlyPI;

    return {
      year,
      propertyValue,
      loanBalance,
      equity: propertyValue - loanBalance,
      projectedRent,
      projectedCashFlow,
    };
  });

  return { totalCashInvested, annualCashFlow, cashOnCashReturn, expenseBreakdown, fiveYearProjection };
}
