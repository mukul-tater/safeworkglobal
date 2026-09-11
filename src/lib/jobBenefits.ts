export const STANDARD_JOB_BENEFITS = [
  'Flight tickets',
  'Accommodation',
  'Food - Minimum 200 and kitchen facilities',
  'Local transport',
  'MOL',
  'Work visa and Emirates ID',
  'Legal contract and job security',
  'Airport pickup',
  '8-10 hours of duty + overtime (extra pay)',
  'Medical facility + Insurance in Dubai',
  '11+1',
  'Return airfare after 2 years',
  'PBBY Insurance in India',
  'Uniform provided by company',
  'Attendance bonus (26 working days)',
  '6-day work week',
  '2-year contract',
] as const;

export type StandardJobBenefit = (typeof STANDARD_JOB_BENEFITS)[number];

export const JOB_BENEFIT_INFO: Partial<Record<StandardJobBenefit, string>> = {
  '11+1': '11 month work and 1 month paid salary extra.',
  'PBBY Insurance in India': 'Pravasi Bharatiya Bima Yojana (PBBY) cover in India.',
  'Attendance bonus (26 working days)': 'Monthly bonus if the worker completes 26 days in a month.',
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
    'Food - Minimum 200 and kitchen facilities',
  'return air fare after 2 years': 'Return airfare after 2 years',
  'pbby insurance': 'PBBY Insurance in India',
  uniform: 'Uniform provided by company',
  'attendance bonus': 'Attendance bonus (26 working days)',
  '6 days per week': '6-day work week',
  '2 year contract': '2-year contract',
  '2 years contract': '2-year contract',
};

function resolveStandardBenefit(value: string): StandardJobBenefit | undefined {
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
    if (!trimmed) continue;
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
    .filter(Boolean);

  lines.push(...extraParts);
  return lines.join('\n');
}

export function listPublicJobBenefits(): string[] {
  return [...STANDARD_JOB_BENEFITS];
}

export const PUBLIC_JOB_BENEFITS_TEXT = STANDARD_JOB_BENEFITS.join('\n');

export function listJobBenefits(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const items: string[] = [];
  for (const line of raw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = resolveStandardBenefit(trimmed);
    if (match) {
      items.push(match);
      continue;
    }
    items.push(...trimmed.split(/[,;]+/).map((s) => s.trim()).filter(Boolean));
  }
  return items;
}
