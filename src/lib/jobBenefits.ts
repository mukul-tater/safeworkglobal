export const STANDARD_JOB_BENEFITS = [
  'Flight tickets',
  'Accommodation',
  'Food (usually included in salary) - Minimum 200 and kitchen facilities',
  'Local transport',
  'MOL',
  'Work visa and Emirates ID',
  'Legal contract and job security',
  'Airport pickup',
  '8-10 hours of duty + overtime (extra pay)',
  'Medical facility + Insurance in Dubai',
  'Return airfare after 2 years',
  'PBBY Insurance in India',
  'Uniform provided by company',
  '6-day work week',
  '2-year contract',
] as const;

export type StandardJobBenefit = (typeof STANDARD_JOB_BENEFITS)[number];

export const JOB_BENEFIT_INFO: Partial<Record<StandardJobBenefit, string>> = {
  'PBBY Insurance in India': 'Pravasi Bharatiya Bima Yojana (PBBY) cover in India.',
  '6-day work week': '8–10 hours per day, 6 days a week.',
  '2-year contract': 'Standard employment period of 2 years.',
  'Uniform provided by company': 'Company-issued work uniform.',
};

export interface ParsedJobBenefits {
  selected: StandardJobBenefit[];
  additional: string;
}

const standardLookup = new Map(
  STANDARD_JOB_BENEFITS.map((b) => [b.toLowerCase(), b]),
);

/** Maps older job-listing labels onto the current standard set. */
const BENEFIT_ALIASES: Record<string, StandardJobBenefit> = {
  accommodations: 'Accommodation',
  insurance: 'Medical facility + Insurance in Dubai',
  transportation: 'Local transport',
  visa: 'Work visa and Emirates ID',
  'food or food allowance (min. aed 200) + kitchen facilities':
    'Food (usually included in salary) - Minimum 200 and kitchen facilities',
  'food - minimum 200 and kitchen facilities':
    'Food (usually included in salary) - Minimum 200 and kitchen facilities',
  'return air fare after 2 years': 'Return airfare after 2 years',
  'pbby insurance': 'PBBY Insurance in India',
  uniform: 'Uniform provided by company',
  '6 days per week': '6-day work week',
  '2 year contract': '2-year contract',
  '2 years contract': '2-year contract',
};

function isDroppedBenefit(value: string): boolean {
  return /attendance\s+bonus/i.test(value) || /11\s*\+\s*1/i.test(value);
}

function resolveStandardBenefit(value: string): StandardJobBenefit | undefined {
  if (isDroppedBenefit(value)) return undefined;
  const key = value.toLowerCase();
  return standardLookup.get(key) ?? BENEFIT_ALIASES[key];
}

export function jobBenefitInfo(benefit: string): string | undefined {
  return JOB_BENEFIT_INFO[benefit as StandardJobBenefit];
}

export function parseJobBenefits(raw: string | null | undefined): ParsedJobBenefits {
  if (!raw?.trim()) {
    return { selected: [], additional: '' };
  }

  const selected: StandardJobBenefit[] = [];
  const extras: string[] = [];

  for (const part of raw.split(/\n+/)) {
    const trimmed = part.trim();
    if (!trimmed || isDroppedBenefit(trimmed)) continue;
    const match = resolveStandardBenefit(trimmed);
    if (match) {
      if (!selected.includes(match)) selected.push(match);
    } else {
      extras.push(trimmed);
    }
  }

  return {
    selected,
    additional: extras.join(', '),
  };
}

export function serializeJobBenefits(parsed: ParsedJobBenefits): string {
  const lines: string[] = [...parsed.selected];
  const extraParts = parsed.additional
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s && !isDroppedBenefit(s));

  lines.push(...extraParts);
  return lines.join('\n');
}

export function listPublicJobBenefits(raw?: string | null): string[] {
  const fromJob = listJobBenefits(raw);
  if (fromJob.length > 0) return fromJob;
  return [...STANDARD_JOB_BENEFITS];
}

export const PUBLIC_JOB_BENEFITS_TEXT = STANDARD_JOB_BENEFITS.join('\n');

const COMPARE_EMPTY = '—';

export interface JobCompareBenefitRows {
  stay: string;
  food: string;
  hours: string;
  contract: string;
}

const FOOD_BENEFIT: StandardJobBenefit =
  'Food (usually included in salary) - Minimum 200 and kitchen facilities';
const HOURS_BENEFIT: StandardJobBenefit = '8-10 hours of duty + overtime (extra pay)';
const WEEK_BENEFIT: StandardJobBenefit = '6-day work week';
const CONTRACT_BENEFIT: StandardJobBenefit = '2-year contract';
const LEGAL_CONTRACT_BENEFIT: StandardJobBenefit = 'Legal contract and job security';

function extraBenefitLine(additional: string, pattern: RegExp): string | null {
  const hit = additional
    .split(',')
    .map((part) => part.trim())
    .find((part) => part && pattern.test(part));
  return hit || null;
}

/** Short compare-sheet labels taken only from benefits the job actually lists. */
export function jobCompareBenefitRows(raw: string | null | undefined): JobCompareBenefitRows {
  const { selected, additional } = parseJobBenefits(raw);
  const has = (benefit: StandardJobBenefit) => selected.includes(benefit);

  const hourParts = [
    has(HOURS_BENEFIT) ? '8–10 + OT' : null,
    has(WEEK_BENEFIT) ? '6-day week' : null,
  ].filter((part): part is string => Boolean(part));

  return {
    stay: has('Accommodation') ? 'Accommodation' : extraBenefitLine(additional, /accommodat|housing/i) ?? COMPARE_EMPTY,
    food: has(FOOD_BENEFIT) ? 'Included' : extraBenefitLine(additional, /\bfood\b|meal/i) ?? COMPARE_EMPTY,
    hours: hourParts.join(' · ') || extraBenefitLine(additional, /hour|overtime|shift/i) || COMPARE_EMPTY,
    contract: has(CONTRACT_BENEFIT)
      ? '2 years'
      : has(LEGAL_CONTRACT_BENEFIT)
        ? 'Legal contract'
        : extraBenefitLine(additional, /contract/i) ?? COMPARE_EMPTY,
  };
}

export function listJobBenefits(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const items: string[] = [];
  for (const line of raw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || isDroppedBenefit(trimmed)) continue;
    const match = resolveStandardBenefit(trimmed);
    if (match) {
      items.push(match);
      continue;
    }
    items.push(...trimmed.split(/[,;]+/).map((s) => s.trim()).filter(Boolean));
  }
  return items;
}
