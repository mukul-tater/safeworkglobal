import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { POPULAR_JOB_TITLES } from '@/lib/constants';
import type { JobTemplate } from '@/lib/jobTemplates';
import { builtinBenefitCatalog, installBenefitCatalog, type BenefitCatalog } from '@/lib/jobBenefits';
import { UAE_LISTED_JOBS } from '@/lib/uaeListedJobs';
import {
  INDEMNITY_BOND_CLAUSES,
  INDEMNITY_BOND_EXECUTION,
  INDEMNITY_BOND_HIGHLIGHTS,
  INDEMNITY_BOND_PARTICULARS,
  INDEMNITY_BOND_PREAMBLE,
  INDEMNITY_BOND_SCHEDULE_A,
  INDEMNITY_BOND_SCHEDULE_B,
  INDEMNITY_BOND_SIGNATURES,
  INDEMNITY_BOND_STAMP_INR,
  INDEMNITY_BOND_SUBTITLE,
  INDEMNITY_BOND_TITLE,
  INDEMNITY_BOND_VERSION,
} from '@/modules/worker-verification/agreement/indemnityBondContent';
import {
  CANDIDATE_ACKNOWLEDGEMENT_ITEMS,
  PRE_JOURNEY_COPY,
  type CandidateAcknowledgements,
} from '@/modules/worker-verification/types/declarations.types';

export type EnHi = { en: string; hi: string };

export type CountryCardConfig = {
  key: 'UAE' | 'Europe' | 'Ukraine' | 'Czech Republic';
  image: string;
  position: string;
  titleHi: string;
  titleEn: string;
  places: { name: string; hindi?: boolean }[];
};

export type StoredJobTemplate = JobTemplate & {
  key: string;
  keywords: string[];
};

export type AcknowledgementItem = {
  key: keyof CandidateAcknowledgements;
  text: string;
  textHi: string;
};

export type IndemnityContent = {
  version: string;
  stampInr: number;
  title: EnHi;
  subtitle: EnHi;
  preamble: EnHi;
  highlights: { en: string[]; hi: string[] };
  execution: {
    title: EnHi;
    body: EnHi;
    bullets: { en: string[]; hi: string[] };
  };
  clauses: { no: string; en: string; hi: string }[];
  signatures: { en: string[]; hi: string[] };
  particulars: {
    candidate: { en: string[]; hi: string[] };
    guarantor: { en: string[]; hi: string[] };
    employment: { en: string[]; hi: string[] };
  };
  scheduleA: { title: EnHi; fields: { en: string[]; hi: string[] } };
  scheduleB: { title: EnHi; body: EnHi };
};

export type PreJourneyCopy = typeof PRE_JOURNEY_COPY;

export type SiteContent = {
  countryCards: CountryCardConfig[];
  tradeCardImages: Record<string, string>;
  popularTitles: string[];
  jobTemplates: StoredJobTemplate[];
  preJourney: PreJourneyCopy;
  acknowledgements: AcknowledgementItem[];
  indemnity: IndemnityContent;
  benefitCatalog: BenefitCatalog;
  fromDatabase: boolean;
};

let builtinTemplates: StoredJobTemplate[] = [];

/** Built-in quick-post templates, registered by the template module so this file can load first. */
export function installDefaultTemplates(
  templates: Record<string, JobTemplate>,
  keywords: Record<string, string[]>,
) {
  builtinTemplates = Object.entries(templates).map(([key, template]) => ({
    ...template,
    responsibilities: [...template.responsibilities],
    requirements: [...template.requirements],
    skills: [...template.skills],
    key,
    keywords: [...(keywords[key] || [])],
  }));
  if (!current.fromDatabase || current.jobTemplates.length === 0) {
    publish({ ...current, jobTemplates: defaultTemplates() });
  }
}

export const DEFAULT_COUNTRY_CARDS: CountryCardConfig[] = [
  {
    key: 'UAE',
    image: '/country-insights/uae/dubai-skyline.jpg',
    position: 'center 42%',
    titleHi: 'दुबई',
    titleEn: 'UAE',
    places: [
      { name: 'Abu Dhabi' },
      { name: 'दुबई', hindi: true },
      { name: 'Sharjah' },
      { name: 'Ajman' },
      { name: 'Umm Al Quwain' },
      { name: 'Ras Al Khaimah' },
      { name: 'Fujairah' },
    ],
  },
  {
    key: 'Europe',
    image: '/country-insights/europe/prague.jpg',
    position: 'center 42%',
    titleHi: 'यूरोप',
    titleEn: 'Europe',
    places: [{ name: 'Ukraine' }, { name: 'Czech Republic' }],
  },
  {
    key: 'Ukraine',
    image: '/country-insights/ukraine/kyiv.jpg',
    position: 'center 45%',
    titleHi: 'यूक्रेन',
    titleEn: 'Ukraine',
    places: [
      { name: 'Rivne' },
      { name: 'Cherkasy' },
      { name: 'Kyiv Region' },
      { name: 'Makariv' },
      { name: 'Khmelnytskyi' },
    ],
  },
  {
    key: 'Czech Republic',
    image: '/country-insights/europe/prague.jpg',
    position: 'center 42%',
    titleHi: 'चेक गणराज्य',
    titleEn: 'Czech Republic',
    places: [
      { name: 'Choceň' },
      { name: 'Rajhrad' },
      { name: 'Žiželice' },
      { name: 'Slaný' },
      { name: 'Beroun' },
    ],
  },
];

function defaultTemplates(): StoredJobTemplate[] {
  return builtinTemplates.map((template) => ({
    ...template,
    responsibilities: [...template.responsibilities],
    requirements: [...template.requirements],
    skills: [...template.skills],
    keywords: [...template.keywords],
  }));
}

function defaultIndemnity(): IndemnityContent {
  return {
    version: INDEMNITY_BOND_VERSION,
    stampInr: INDEMNITY_BOND_STAMP_INR,
    title: { ...INDEMNITY_BOND_TITLE },
    subtitle: { ...INDEMNITY_BOND_SUBTITLE },
    preamble: { ...INDEMNITY_BOND_PREAMBLE },
    highlights: {
      en: [...INDEMNITY_BOND_HIGHLIGHTS.en],
      hi: [...INDEMNITY_BOND_HIGHLIGHTS.hi],
    },
    execution: {
      title: { ...INDEMNITY_BOND_EXECUTION.title },
      body: { ...INDEMNITY_BOND_EXECUTION.body },
      bullets: {
        en: [...INDEMNITY_BOND_EXECUTION.bullets.en],
        hi: [...INDEMNITY_BOND_EXECUTION.bullets.hi],
      },
    },
    clauses: INDEMNITY_BOND_CLAUSES.map((clause) => ({ ...clause })),
    signatures: {
      en: [...INDEMNITY_BOND_SIGNATURES.en],
      hi: [...INDEMNITY_BOND_SIGNATURES.hi],
    },
    particulars: {
      candidate: { en: [...INDEMNITY_BOND_PARTICULARS.candidate.en], hi: [...INDEMNITY_BOND_PARTICULARS.candidate.hi] },
      guarantor: { en: [...INDEMNITY_BOND_PARTICULARS.guarantor.en], hi: [...INDEMNITY_BOND_PARTICULARS.guarantor.hi] },
      employment: { en: [...INDEMNITY_BOND_PARTICULARS.employment.en], hi: [...INDEMNITY_BOND_PARTICULARS.employment.hi] },
    },
    scheduleA: {
      title: { ...INDEMNITY_BOND_SCHEDULE_A.title },
      fields: { en: [...INDEMNITY_BOND_SCHEDULE_A.fields.en], hi: [...INDEMNITY_BOND_SCHEDULE_A.fields.hi] },
    },
    scheduleB: {
      title: { ...INDEMNITY_BOND_SCHEDULE_B.title },
      body: { ...INDEMNITY_BOND_SCHEDULE_B.body },
    },
  };
}

export function defaultSiteContent(): SiteContent {
  return {
    countryCards: DEFAULT_COUNTRY_CARDS.map((card) => ({ ...card, places: card.places.map((place) => ({ ...place })) })),
    tradeCardImages: Object.fromEntries(UAE_LISTED_JOBS.map((job) => [job, ''])),
    popularTitles: [...POPULAR_JOB_TITLES],
    jobTemplates: defaultTemplates(),
    preJourney: structuredClone(PRE_JOURNEY_COPY) as PreJourneyCopy,
    acknowledgements: CANDIDATE_ACKNOWLEDGEMENT_ITEMS.map((item) => ({ ...item })),
    indemnity: defaultIndemnity(),
    benefitCatalog: builtinBenefitCatalog(),
    fromDatabase: false,
  };
}

function pair(value: unknown, fallback: EnHi): EnHi {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const en = String(row.en || '').trim();
  const hi = String(row.hi || '').trim();
  return { en: en || fallback.en, hi: hi || fallback.hi };
}

function lines(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const next = value.map((item) => String(item || '').trim()).filter(Boolean);
  return next.length ? next : [...fallback];
}

function mergeCopy<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base;
    return base.map((item, index) => mergeCopy(item, override[index])) as T;
  }
  if (base && typeof base === 'object') {
    const source = override && typeof override === 'object' && !Array.isArray(override)
      ? (override as Record<string, unknown>)
      : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(base as object)) {
      out[key] = mergeCopy((base as Record<string, unknown>)[key], source[key]);
    }
    return out as T;
  }
  if (typeof base === 'string') {
    return (typeof override === 'string' && override.trim() ? override : base) as T;
  }
  return base;
}

function mapCountryCards(value: unknown): CountryCardConfig[] {
  const defaults = defaultSiteContent().countryCards;
  if (!Array.isArray(value)) return defaults;
  return defaults.map((card) => {
    const stored = value.find((item) => item && typeof item === 'object' && (item as { key?: string }).key === card.key) as
      | Record<string, unknown>
      | undefined;
    if (!stored) return card;
    const places = Array.isArray(stored.places)
      ? stored.places
          .map((place) => {
            if (!place || typeof place !== 'object') return null;
            const row = place as { name?: string; hindi?: boolean };
            const name = String(row.name || '').trim();
            if (!name) return null;
            return { name, hindi: Boolean(row.hindi) };
          })
          .filter((place): place is { name: string; hindi: boolean } => !!place)
      : card.places;
    return {
      ...card,
      image: String(stored.image || '').trim() || card.image,
      position: String(stored.position || '').trim() || card.position,
      titleHi: String(stored.titleHi || '').trim() || card.titleHi,
      titleEn: String(stored.titleEn || '').trim() || card.titleEn,
      places: places.length ? places : card.places,
    };
  });
}

function mapTemplates(value: unknown): StoredJobTemplate[] {
  const defaults = defaultTemplates();
  if (!Array.isArray(value) || value.length === 0) return defaults;
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const role = String(row.role || '').trim();
      const key = String(row.key || role).trim().toLowerCase();
      if (!role || !key) return null;
      const experience = String(row.experienceLevel || 'INTERMEDIATE');
      const level = ['ENTRY', 'INTERMEDIATE', 'SENIOR', 'EXPERT'].includes(experience)
        ? (experience as JobTemplate['experienceLevel'])
        : 'INTERMEDIATE';
      return {
        key,
        role,
        category: String(row.category || '').trim() || 'Construction',
        description: String(row.description || '').trim(),
        responsibilities: lines(row.responsibilities, []),
        requirements: lines(row.requirements, []),
        skills: lines(row.skills, []),
        keywords: lines(row.keywords, []).map((word) => word.toLowerCase()),
        salaryMin: Number(row.salaryMin) || 0,
        salaryMax: Number(row.salaryMax) || 0,
        experienceLevel: level,
        minYearsExperience: Number(row.minYearsExperience) || 0,
      } satisfies StoredJobTemplate;
    })
    .filter((item): item is StoredJobTemplate => !!item);
  return parsed.length ? parsed : defaults;
}

function mapAcknowledgements(value: unknown): AcknowledgementItem[] {
  const defaults = CANDIDATE_ACKNOWLEDGEMENT_ITEMS.map((item) => ({ ...item }));
  if (!Array.isArray(value)) return defaults;
  return defaults.map((item) => {
    const stored = value.find((row) => row && typeof row === 'object' && (row as { key?: string }).key === item.key) as
      | { text?: string; textHi?: string }
      | undefined;
    if (!stored) return item;
    return {
      key: item.key,
      text: String(stored.text || '').trim() || item.text,
      textHi: String(stored.textHi || '').trim() || item.textHi,
    };
  });
}

function mapIndemnity(value: unknown): IndemnityContent {
  const base = defaultIndemnity();
  if (!value || typeof value !== 'object') return base;
  const row = value as Record<string, unknown>;
  const clauses = Array.isArray(row.clauses)
    ? row.clauses
        .map((clause, index) => {
          if (!clause || typeof clause !== 'object') return null;
          const item = clause as { no?: string; en?: string; hi?: string };
          const en = String(item.en || '').trim();
          const hi = String(item.hi || '').trim();
          if (!en && !hi) return null;
          return { no: String(item.no || index + 1), en, hi };
        })
        .filter((clause): clause is IndemnityContent['clauses'][number] => !!clause)
    : [];
  const execution = row.execution && typeof row.execution === 'object' ? (row.execution as Record<string, unknown>) : {};
  const particulars = row.particulars && typeof row.particulars === 'object' ? (row.particulars as Record<string, unknown>) : {};
  const group = (key: 'candidate' | 'guarantor' | 'employment') => {
    const stored = particulars[key] && typeof particulars[key] === 'object' ? (particulars[key] as Record<string, unknown>) : {};
    return { en: lines(stored.en, base.particulars[key].en), hi: lines(stored.hi, base.particulars[key].hi) };
  };
  const scheduleA = row.scheduleA && typeof row.scheduleA === 'object' ? (row.scheduleA as Record<string, unknown>) : {};
  const scheduleAFields = scheduleA.fields && typeof scheduleA.fields === 'object' ? (scheduleA.fields as Record<string, unknown>) : {};
  const scheduleB = row.scheduleB && typeof row.scheduleB === 'object' ? (row.scheduleB as Record<string, unknown>) : {};
  const signatures = row.signatures && typeof row.signatures === 'object' ? (row.signatures as Record<string, unknown>) : {};
  const highlights = row.highlights && typeof row.highlights === 'object' ? (row.highlights as Record<string, unknown>) : {};
  const bullets = execution.bullets && typeof execution.bullets === 'object' ? (execution.bullets as Record<string, unknown>) : {};
  const stamp = Number(row.stampInr);
  return {
    version: String(row.version || '').trim() || base.version,
    stampInr: Number.isFinite(stamp) && stamp > 0 ? stamp : base.stampInr,
    title: pair(row.title, base.title),
    subtitle: pair(row.subtitle, base.subtitle),
    preamble: pair(row.preamble, base.preamble),
    highlights: { en: lines(highlights.en, base.highlights.en), hi: lines(highlights.hi, base.highlights.hi) },
    execution: {
      title: pair(execution.title, base.execution.title),
      body: pair(execution.body, base.execution.body),
      bullets: { en: lines(bullets.en, base.execution.bullets.en), hi: lines(bullets.hi, base.execution.bullets.hi) },
    },
    clauses: clauses.length ? clauses : base.clauses,
    signatures: { en: lines(signatures.en, base.signatures.en), hi: lines(signatures.hi, base.signatures.hi) },
    particulars: { candidate: group('candidate'), guarantor: group('guarantor'), employment: group('employment') },
    scheduleA: {
      title: pair(scheduleA.title, base.scheduleA.title),
      fields: { en: lines(scheduleAFields.en, base.scheduleA.fields.en), hi: lines(scheduleAFields.hi, base.scheduleA.fields.hi) },
    },
    scheduleB: { title: pair(scheduleB.title, base.scheduleB.title), body: pair(scheduleB.body, base.scheduleB.body) },
  };
}

function mapTradeImages(value: unknown): Record<string, string> {
  const images = Object.fromEntries(UAE_LISTED_JOBS.map((job) => [job, '']));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return images;
  for (const job of UAE_LISTED_JOBS) {
    const url = String((value as Record<string, unknown>)[job] || '').trim();
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) images[job] = url;
  }
  return images;
}

function mapBenefitItem(value: unknown): BenefitCatalog['standard'][number] | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const en = String(row.en || '').trim();
  if (!en) return null;
  const hi = String(row.hi || '').trim();
  const info = String(row.info || '').trim();
  const infoHi = String(row.infoHi || row.info_hi || '').trim();
  return {
    en,
    ...(hi ? { hi } : {}),
    ...(info ? { info } : {}),
    ...(infoHi ? { infoHi } : {}),
  };
}

function mapBenefitList(value: unknown, fallback: BenefitCatalog['standard']): BenefitCatalog['standard'] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));
  return value.map(mapBenefitItem).filter((item): item is BenefitCatalog['standard'][number] => item != null);
}

function mapBenefitCatalog(value: unknown): BenefitCatalog {
  const builtin = builtinBenefitCatalog();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return builtin;
  const row = value as Record<string, unknown>;
  return {
    standard: mapBenefitList(row.standard, builtin.standard),
    delivery: mapBenefitList(row.delivery, builtin.delivery),
  };
}

function mapRow(row: Record<string, unknown> | null): SiteContent {
  const defaults = defaultSiteContent();
  if (!row) return defaults;
  const titles = Array.isArray(row.popular_titles)
    ? row.popular_titles.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  return {
    countryCards: mapCountryCards(row.country_cards),
    tradeCardImages: mapTradeImages(row.trade_card_images),
    popularTitles: titles.length ? titles : defaults.popularTitles,
    jobTemplates: mapTemplates(row.job_templates),
    preJourney: mergeCopy(defaults.preJourney, row.pre_journey),
    acknowledgements: mapAcknowledgements(row.acknowledgements),
    indemnity: mapIndemnity(row.indemnity_bond),
    benefitCatalog: mapBenefitCatalog(row.benefit_catalog),
    fromDatabase: true,
  };
}

let current = defaultSiteContent();
let inflight: Promise<SiteContent> | null = null;
const listeners = new Set<() => void>();

function publish(next: SiteContent) {
  current = next;
  installBenefitCatalog(next.benefitCatalog);
  listeners.forEach((listener) => listener());
}

export function getSiteContent(): SiteContent {
  return current;
}

export function subscribeSiteContent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadSiteContent(): Promise<SiteContent> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).maybeSingle();
      if (error || !data) return current;
      publish(mapRow(data as unknown as Record<string, unknown>));
      return current;
    } catch {
      return current;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState(current);
  useEffect(() => {
    const unsubscribe = subscribeSiteContent(() => setContent(getSiteContent()));
    void loadSiteContent();
    return unsubscribe;
  }, []);
  return content;
}

export type SiteSection =
  | 'country_cards'
  | 'trade_card_images'
  | 'popular_titles'
  | 'job_templates'
  | 'pre_journey'
  | 'acknowledgements'
  | 'indemnity_bond'
  | 'benefit_catalog';

export async function saveSiteSection(section: SiteSection, value: unknown): Promise<void> {
  const { error } = await supabase.rpc('admin_save_site_content', {
    p_section: section,
    p_value: value as never,
  });
  if (error) throw new Error(error.message);
  await loadSiteContent();
}

export type CopyField = { path: string; label: string; en: string; hi: string };

export function listCopyFields(value: unknown, path = ''): CopyField[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (typeof record.en === 'string' && typeof record.hi === 'string') {
    return [{ path, label: path || 'text', en: record.en, hi: record.hi }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => listCopyFields(item, `${path}[${index}]`));
  }
  return Object.entries(record).flatMap(([key, child]) => listCopyFields(child, path ? `${path}.${key}` : key));
}

function setCopyPath(target: unknown, path: string, en: string, hi: string) {
  const parts = path.split('.').flatMap((part) => {
    const bits: Array<string | number> = [];
    const re = /([^[\]]+)|\[(\d+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(part))) {
      if (match[1]) bits.push(match[1]);
      if (match[2]) bits.push(Number(match[2]));
    }
    return bits;
  });
  let cursor: any = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor = cursor?.[parts[i]];
  }
  const last = parts[parts.length - 1];
  if (cursor && last != null && cursor[last] && typeof cursor[last] === 'object') {
    cursor[last].en = en;
    cursor[last].hi = hi;
  }
}

export function applyCopyFields<T>(base: T, fields: CopyField[]): T {
  const clone = structuredClone(base);
  for (const field of fields) setCopyPath(clone, field.path, field.en, field.hi);
  return clone;
}

export function resolveStoredTemplate(role: string): JobTemplate | null {
  const templates = getSiteContent().jobTemplates;
  const key = role.toLowerCase().trim();
  if (!key || templates.length === 0) return null;
  const exact = templates.find((template) => template.key === key || template.role.toLowerCase() === key);
  if (exact) return exact;
  return templates.find((template) => template.keywords.some((needle) => needle && key.includes(needle))) || null;
}
