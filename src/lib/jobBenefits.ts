export const STANDARD_JOB_BENEFITS = [
  'Accommodations',
  'Insurance',
  'Transportation',
  'VISA',
] as const;

export type StandardJobBenefit = (typeof STANDARD_JOB_BENEFITS)[number];

export interface ParsedJobBenefits {
  selected: StandardJobBenefit[];
  additional: string;
}

const standardLookup = new Map(
  STANDARD_JOB_BENEFITS.map((b) => [b.toLowerCase(), b]),
);

export function parseJobBenefits(raw: string | null | undefined): ParsedJobBenefits {
  if (!raw?.trim()) {
    return { selected: [], additional: '' };
  }

  const selected: StandardJobBenefit[] = [];
  const extras: string[] = [];

  for (const part of raw.split(/\n+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = standardLookup.get(trimmed.toLowerCase());
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
  return raw
    .split(/\n+/)
    .flatMap((line) => line.split(/[,;]+/))
    .map((s) => s.trim())
    .filter(Boolean);
}
