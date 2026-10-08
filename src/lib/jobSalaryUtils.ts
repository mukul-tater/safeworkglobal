/** Display symbols for supported job salary currencies. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  CZK: 'CZK',
  SAR: 'SAR',
  QAR: 'QAR',
};

/**
 * Listed UAE salaries were converted at this rate (nearest rupee thousand).
 * Display uses the same rate so AED and INR stay paired.
 */
export const INR_PER_AED = 23;

function formatGrouped(amount: number): string {
  return Math.round(amount).toLocaleString('en-IN');
}

/** AED first, rupees in parentheses. Amounts are monthly INR unless currency is AED. */
export function formatJobSalaryAedAndInr(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR',
): string | null {
  if (min == null && max == null) return null;
  if (currency !== 'INR' && currency !== 'AED') return null;

  const toAed = (amount: number) =>
    currency === 'AED' ? Math.round(amount) : Math.round(amount / INR_PER_AED);
  const toInr = (amount: number) =>
    currency === 'INR' ? Math.round(amount) : Math.round(amount * INR_PER_AED);

  const aedLabel = (amount: number) => `AED ${formatGrouped(toAed(amount))}`;
  const inrLabel = (amount: number) => `₹${formatGrouped(toInr(amount))}`;

  if (min != null && max != null) {
    if (min === max) return `${aedLabel(min)} (${inrLabel(min)})`;
    return `${aedLabel(min)} – ${aedLabel(max).replace('AED ', '')} (${inrLabel(min)} – ${inrLabel(max)})`;
  }
  if (min != null) return `From ${aedLabel(min)} (${inrLabel(min)})`;
  return `Up to ${aedLabel(max!)} (${inrLabel(max!)})`;
}

/** Converts with a verified rate supplied by fx_rates; never guesses. */
export function convertSalaryToINR(amount: number, currency: string, inrPerUnit?: number | null): number | null {
  if (currency === 'INR') return Math.round(amount);
  if (inrPerUnit == null || !Number.isFinite(inrPerUnit) || inrPerUnit <= 0) return null;
  return Math.round(amount * inrPerUnit);
}

function formatNativeAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = amount.toLocaleString('en-IN');
  if (currency === 'INR' || currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    return `${sym}${formatted}`;
  }
  return `${sym} ${formatted}`;
}

export interface JobSalaryDisplay {
  primary: string;
  inrLine: string | null;
}

function formatInrAmountLabel(inr: number): string {
  if (inr >= 100_000) {
    const lakhs = inr / 100_000;
    const rounded = Math.round(lakhs * 10) / 10;
    const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
    return `₹${text}L`;
  }
  return `₹${inr.toLocaleString('en-IN')}`;
}

function formatInrPrimaryLine(
  min: number | null | undefined,
  max: number | null | undefined,
  emptyLabel: string,
): string {
  if (min == null && max == null) return emptyLabel;
  if (min != null && max != null) {
    if (min === max) return formatInrAmountLabel(min);
    return `${formatInrAmountLabel(min)} – ${formatInrAmountLabel(max)}`;
  }
  if (min != null) return `From ${formatInrAmountLabel(min)}`;
  return `Up to ${formatInrAmountLabel(max!)}`;
}

/** Primary salary line in the job's native currency. */
export function getJobSalaryDisplay(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR',
  emptyLabel = 'Salary on application',
): JobSalaryDisplay {
  if (min == null && max == null) {
    return { primary: emptyLabel, inrLine: null };
  }

  return {
    primary: formatJobSalaryNative(min, max, currency, emptyLabel),
    inrLine: null,
  };
}

/** Formats a salary range in the job's own currency (no FX conversion). */
export function formatJobSalaryNative(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR',
  emptyLabel = 'Salary on application',
): string {
  if (min == null && max == null) return emptyLabel;
  if (min != null && max != null) {
    if (min === max) return formatNativeAmount(min, currency);
    return `${formatNativeAmount(min, currency)} – ${formatNativeAmount(max, currency)}`;
  }
  if (min != null) return `From ${formatNativeAmount(min, currency)}`;
  return `Up to ${formatNativeAmount(max!, currency)}`;
}

/** Practical monthly salary range for skilled overseas blue-collar jobs (INR). */
export const SALARY_FLOOR_INR = 50_000;
export const SALARY_CEILING_INR = 100_000;

/** Salary filter bounds for the public jobs page (INR/month). */
export const SALARY_FILTER_MIN = 0;
export const SALARY_FILTER_MAX = 200_000;
export const SALARY_FILTER_STEP = 5_000;

const LEVEL_OFFSET: Record<string, number> = {
  ENTRY: 0,
  INTERMEDIATE: 3_000,
  SENIOR: 6_000,
  EXPERT: 9_000,
};

function formatAmount(n: number): string {
  if (n >= 100_000) {
    const lakhs = n / 100_000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return `₹${Math.round(n / 1000)}K`;
}

/** Generate a realistic ₹50K–₹1L/month salary band for overseas job listings. */
export function generateOverseasJobSalary(experienceLevel?: string | null): {
  salary_min: number;
  salary_max: number;
  currency: 'INR';
  salary_display: string;
} {
  const offset = LEVEL_OFFSET[experienceLevel ?? 'INTERMEDIATE'] ?? 3_000;
  const jitter = Math.floor(Math.random() * 5_000);

  const salary_min = Math.min(
    SALARY_FLOOR_INR + offset + jitter,
    SALARY_CEILING_INR - 15_000
  );

  const salary_max = Math.min(
    SALARY_CEILING_INR,
    salary_min + 5_000 + Math.floor(Math.random() * 10_000)
  );

  const max = Math.max(salary_max, salary_min + 5_000);

  return {
    salary_min,
    salary_max: max,
    currency: 'INR',
    salary_display: `${formatAmount(salary_min)} – ${formatAmount(max)}`,
  };
}

/** Normalize an existing salary into the ₹50K–₹1L band (deterministic from job id). */
export function normalizeSalaryForJob(
  experienceLevel?: string | null,
  seed = 0
): ReturnType<typeof generateOverseasJobSalary> {
  const offset = LEVEL_OFFSET[experienceLevel ?? 'INTERMEDIATE'] ?? 3_000;
  const jitter = seed % 5_000;

  const salary_min = Math.min(
    SALARY_FLOOR_INR + offset + jitter,
    SALARY_CEILING_INR - 15_000
  );

  const salary_max = Math.min(
    SALARY_CEILING_INR,
    salary_min + 5_000 + (seed % 10_000)
  );

  const max = Math.max(salary_max, salary_min + 5_000);

  return {
    salary_min,
    salary_max: max,
    currency: 'INR',
    salary_display: `${formatAmount(salary_min)} – ${formatAmount(max)}`,
  };
}
