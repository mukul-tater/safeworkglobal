export const STANDARD_JOB_BENEFITS = [
  'Flight tickets',
  'Accommodation',
  'Food or food allowance (min. AED 200) + kitchen facilities',
  'Local transport',
  'MOL',
  'Work visa and Emirates ID',
  'Legal contract and job security',
  'Airport pickup',
  '8-10 hours of duty + overtime (extra pay)',
  'Medical facility + Insurance in Dubai',
  '11+1',
  'Return airfare after 2 years',
] as const;

export type StandardJobBenefit = (typeof STANDARD_JOB_BENEFITS)[number];

export const JOB_BENEFIT_INFO: Partial<Record<StandardJobBenefit, string>> = {
  '11+1': '11 month work and 1 month paid salary extra.',
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
  'return air fare after 2 years': 'Return airfare after 2 years',
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
