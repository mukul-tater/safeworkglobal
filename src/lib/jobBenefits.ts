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

export type BenefitCatalogItem = {
  en: string;
  hi?: string;
  info?: string;
  infoHi?: string;
};

export type BenefitCatalog = {
  standard: BenefitCatalogItem[];
  delivery: BenefitCatalogItem[];
};

/** Bike-delivery lines. Hindi sits under the English line on the job page. */
export const DELIVERY_JOB_BENEFITS: BenefitCatalogItem[] = [
  { en: 'Flight tickets', hi: 'फ्लाइट टिकट' },
  {
    en: 'Accommodation (till the license is issued)',
    hi: 'आवास (लाइसेंस जारी होने तक)',
  },
  {
    en: 'Food (usually included in salary) - Minimum 200 and kitchen facilities (2 Wheeler license milne tak)',
    hi: 'खाना (आमतौर पर सैलरी में शामिल) — न्यूनतम 200 और किचन की सुविधा (2 व्हीलर लाइसेंस मिलने तक)',
  },
  { en: 'Local transport', hi: 'लोकल ट्रांसपोर्ट' },
  { en: 'MOL', hi: 'एमओएल (श्रम मंत्रालय)' },
  { en: 'Work visa and Emirates ID', hi: 'वर्क वीज़ा और एमिरेट्स आईडी' },
  { en: 'Legal contract and job security', hi: 'कानूनी अनुबंध और नौकरी की सुरक्षा' },
  { en: 'Airport pickup', hi: 'एयरपोर्ट पिकअप' },
  {
    en: '8-10 hours of duty + overtime (extra pay)',
    hi: '8-10 घंटे की ड्यूटी + ओवरटाइम (अतिरिक्त पगार)',
  },
  { en: 'Medical facility + Insurance in Dubai', hi: 'दुबई में मेडिकल सुविधा और बीमा' },
  {
    en: 'PBBY Insurance in India',
    hi: 'भारत में PBBY बीमा',
    info: 'Pravasi Bharatiya Bima Yojana (PBBY) cover in India.',
    infoHi: 'प्रवासी भारतीय बीमा योजना (PBBY) का भारत में कवर।',
  },
  {
    en: 'Uniform provided by company',
    hi: 'कंपनी द्वारा यूनिफॉर्म',
    info: 'Company-issued work uniform.',
    infoHi: 'कंपनी की ओर से दी गई वर्क यूनिफॉर्म।',
  },
  {
    en: '2-year contract',
    hi: '2 साल का कॉन्ट्रैक्ट',
    info: 'Standard employment period of 2 years.',
    infoHi: 'नौकरी की सामान्य अवधि 2 साल।',
  },
];

/** Built-in lists used until the admin catalog loads, and when an admin resets to built-in. */
export function builtinBenefitCatalog(): BenefitCatalog {
  return {
    standard: STANDARD_JOB_BENEFITS.map((en) => ({
      en,
      info: JOB_BENEFIT_INFO[en],
    })),
    delivery: DELIVERY_JOB_BENEFITS.map((item) => ({ ...item })),
  };
}

let liveBenefitCatalog: BenefitCatalog | null = null;

/** Called when site content loads so job forms and public pages share the admin list. */
export function installBenefitCatalog(catalog: BenefitCatalog | null) {
  liveBenefitCatalog = catalog;
}

export function getBenefitCatalog(): BenefitCatalog {
  return liveBenefitCatalog ?? builtinBenefitCatalog();
}

export function catalogBenefitLines(items: BenefitCatalogItem[]): string {
  return items.map((item) => item.en.trim()).filter(Boolean).join('\n');
}

/** Delivery jobs use the bike-delivery benefit list. */
export function benefitsCatalogForTitle(title?: string | null): 'standard' | 'delivery' {
  const value = (title || '').trim().toLowerCase();
  return /\b(delivery|bike rider|bike delivery)\b/.test(value) ? 'delivery' : 'standard';
}

export function benefitCatalogItem(benefit: string): BenefitCatalogItem | undefined {
  const key = benefit.trim().toLowerCase();
  if (!key) return undefined;
  const catalog = getBenefitCatalog();
  return [...catalog.standard, ...catalog.delivery].find((item) => item.en.trim().toLowerCase() === key);
}

export interface ParsedJobBenefits {
  selected: string[];
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
  return benefitCatalogItem(benefit)?.info ?? JOB_BENEFIT_INFO[benefit as StandardJobBenefit];
}

export function parseJobBenefits(raw: string | null | undefined, knownLines?: readonly string[]): ParsedJobBenefits {
  if (!raw?.trim()) {
    return { selected: [], additional: '' };
  }

  const known = (knownLines ?? getBenefitCatalog().standard.map((item) => item.en))
    .map((line) => line.trim())
    .filter(Boolean);
  const lookup = new Map(known.map((line) => [line.toLowerCase(), line]));
  const selected: string[] = [];
  const extras: string[] = [];

  for (const part of raw.split(/\n+/)) {
    const trimmed = part.trim();
    if (!trimmed || isDroppedBenefit(trimmed)) continue;
    const canonical = resolveStandardBenefit(trimmed);
    const match =
      lookup.get(trimmed.toLowerCase()) ??
      (canonical && lookup.has(canonical.toLowerCase()) ? lookup.get(canonical.toLowerCase()) : undefined);
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
  return getBenefitCatalog().standard.map((item) => item.en);
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
  const has = (benefit: string) => selected.some((line) => line.toLowerCase() === benefit.toLowerCase());
  const listed = (pattern: RegExp) => selected.some((line) => pattern.test(line));

  const hourParts = [
    has(HOURS_BENEFIT) || listed(/8-10 hours|overtime/i) ? '8–10 + OT' : null,
    has(WEEK_BENEFIT) || listed(/6-day work week/i) ? '6-day week' : null,
  ].filter((part): part is string => Boolean(part));

  return {
    stay: has('Accommodation') || listed(/accommodat/i)
      ? 'Accommodation'
      : extraBenefitLine(additional, /accommodat|housing/i) ?? COMPARE_EMPTY,
    food: has(FOOD_BENEFIT) || listed(/\bfood\b/i)
      ? 'Included'
      : extraBenefitLine(additional, /\bfood\b|meal/i) ?? COMPARE_EMPTY,
    hours: hourParts.join(' · ') || extraBenefitLine(additional, /hour|overtime|shift/i) || COMPARE_EMPTY,
    contract: has(CONTRACT_BENEFIT) || listed(/2-year contract/i)
      ? '2 years'
      : has(LEGAL_CONTRACT_BENEFIT) || listed(/legal contract/i)
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
