import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';
import { UAE_LISTED_JOBS } from '@/lib/uaeListedJobs';
import {
  bindTradeTestSkills,
  DEPLOYMENT_CHECKLIST,
  MEDICAL_REQUIRED_TESTS,
  MEDICAL_TEST_INTRO,
  TRADE_TEST_REQUIRED_SKILLS,
  WORKER_TERMS_SECTIONS,
  WORKER_TERMS_SUMMARY,
  WORKER_TERMS_VERSION,
  type WorkerTermsSection,
} from '@/modules/worker-verification/constants';

export type MedicalTestCopy = { title: string; body: string };
export type DeploymentChecklistItem = { key: string; label: string };

export const BUILTIN_DEPLOYMENT_KEYS = ['offer', 'contract', 'emigration', 'visa', 'insurance', 'ticket'] as const;

const BUILTIN_STATUS_COLUMN: Record<string, string> = {
  offer: 'deploy_offer_status',
  contract: 'deploy_contract_status',
  emigration: 'deploy_emigration_status',
  visa: 'deploy_visa_status',
  insurance: 'deploy_insurance_status',
  ticket: 'deploy_ticket_status',
};

export const DEFAULT_JOURNEY_RULES = {
  tradeTestSkills: [...TRADE_TEST_REQUIRED_SKILLS] as string[],
  medicalIntro: MEDICAL_TEST_INTRO,
  medicalTests: MEDICAL_REQUIRED_TESTS.map((test) => ({ title: test.title, body: test.body })) as MedicalTestCopy[],
  deploymentChecklist: DEPLOYMENT_CHECKLIST.map((item) => ({
    key: item.key.replace(/^deploy_/, '').replace(/_status$/, ''),
    label: item.label,
  })) as DeploymentChecklistItem[],
  termsVersion: WORKER_TERMS_VERSION,
  termsSummary: WORKER_TERMS_SUMMARY,
  termsSections: WORKER_TERMS_SECTIONS.map((section) => ({ ...section })) as WorkerTermsSection[],
};

export type JourneyRules = typeof DEFAULT_JOURNEY_RULES;

function uniqueSkills(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function tradeTestSkillCatalog(): string[] {
  return uniqueSkills([
    ...TRADE_TEST_REQUIRED_SKILLS,
    ...UAE_LISTED_JOBS,
    ...WORKER_SKILLS,
    'Driver',
    'Helper',
    'Cleaner',
    'Painter',
    'Scaffolder',
  ]);
}

let current: JourneyRules = cloneRules(DEFAULT_JOURNEY_RULES);
let fromDatabase = false;
let inflight: Promise<JourneyRules> | null = null;
const listeners = new Set<() => void>();

function cloneRules(rules: JourneyRules): JourneyRules {
  return {
    ...rules,
    tradeTestSkills: [...rules.tradeTestSkills],
    medicalTests: rules.medicalTests.map((test) => ({ ...test })),
    deploymentChecklist: rules.deploymentChecklist.map((item) => ({ ...item })),
    termsSections: rules.termsSections.map((section) => ({ ...section })),
  };
}

function publish(next: JourneyRules, stored: boolean) {
  current = cloneRules(next);
  fromDatabase = stored;
  listeners.forEach((listener) => listener());
}

bindTradeTestSkills(() => current.tradeTestSkills);

export function getJourneyRules(): JourneyRules {
  return current;
}

export function journeyRulesFromDatabase(): boolean {
  return fromDatabase;
}

export function subscribeJourneyRules(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
}

function mapRow(row: Record<string, unknown>): JourneyRules {
  const defaults = DEFAULT_JOURNEY_RULES;
  const skills = Array.isArray(row.trade_test_skills)
    ? uniqueSkills(row.trade_test_skills.map((item) => String(item)))
    : defaults.tradeTestSkills;
  const tests = asObjectArray(row.medical_tests)
    .map((item) => ({ title: String(item.title || '').trim(), body: String(item.body || '').trim() }))
    .filter((item) => item.title && item.body);
  const checklist = asObjectArray(row.deployment_checklist)
    .map((item) => ({ key: String(item.key || '').trim().toLowerCase(), label: String(item.label || '').trim() }))
    .filter((item) => item.key && item.label);
  const sections = asObjectArray(row.terms_sections)
    .map((item) => ({
      id: String(item.id || '').trim().toLowerCase(),
      title: String(item.title || '').trim(),
      body: String(item.body || '').trim(),
    }))
    .filter((item) => item.id && item.title && item.body);
  return {
    tradeTestSkills: skills.length ? skills : [...defaults.tradeTestSkills],
    medicalIntro: String(row.medical_intro || defaults.medicalIntro),
    medicalTests: tests.length ? tests : defaults.medicalTests.map((test) => ({ ...test })),
    deploymentChecklist: checklist.length ? checklist : defaults.deploymentChecklist.map((item) => ({ ...item })),
    termsVersion: String(row.terms_version || defaults.termsVersion),
    termsSummary: String(row.terms_summary || defaults.termsSummary),
    termsSections: sections.length ? sections : defaults.termsSections.map((section) => ({ ...section })),
  };
}

export async function loadJourneyRules(): Promise<JourneyRules> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const db = supabase as any;
      const { data, error } = await db.from('journey_rules').select('*').eq('id', 1).maybeSingle();
      if (error || !data) return current;
      publish(mapRow(data), true);
      return current;
    } catch {
      return current;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useJourneyRules(): JourneyRules {
  const [rules, setRules] = useState(current);
  useEffect(() => {
    const unsubscribe = subscribeJourneyRules(() => setRules(getJourneyRules()));
    void loadJourneyRules();
    return unsubscribe;
  }, []);
  return rules;
}

export function getMedicalIntro(): string {
  return current.medicalIntro;
}

export function getMedicalTests(): MedicalTestCopy[] {
  return current.medicalTests;
}

export function getDeploymentChecklist(): DeploymentChecklistItem[] {
  return current.deploymentChecklist;
}

export function getTermsVersion(): string {
  return current.termsVersion;
}

export function getTermsSummary(): string {
  return current.termsSummary;
}

export function getTermsSections(): WorkerTermsSection[] {
  return current.termsSections;
}

export function isBuiltinDeploymentKey(key: string): boolean {
  return (BUILTIN_DEPLOYMENT_KEYS as readonly string[]).includes(key);
}

export function deploymentItemStatus(row: Record<string, unknown>, key: string): string {
  const column = BUILTIN_STATUS_COLUMN[key];
  if (column) return String(row[column] || 'pending');
  const extra = row.deploy_extra;
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    const value = (extra as Record<string, unknown>)[key];
    if (value) return String(value);
  }
  return 'pending';
}

export function checklistKeyFromLabel(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return slug && /^[a-z]/.test(slug) ? slug : `item_${Date.now().toString(36)}`;
}

export type JourneyRulesInput = {
  tradeTestSkills: string[];
  medicalIntro: string;
  medicalTests: MedicalTestCopy[];
  deploymentChecklist: DeploymentChecklistItem[];
  termsVersion: string;
  termsSummary: string;
  termsSections: WorkerTermsSection[];
};

export async function saveJourneyRules(input: JourneyRulesInput): Promise<void> {
  const db = supabase as any;
  const { error } = await db.rpc('admin_save_journey_rules', {
    p_trade_test_skills: input.tradeTestSkills,
    p_medical_intro: input.medicalIntro,
    p_medical_tests: input.medicalTests,
    p_deployment_checklist: input.deploymentChecklist,
    p_terms_version: input.termsVersion,
    p_terms_summary: input.termsSummary,
    p_terms_sections: input.termsSections,
  });
  if (error) throw new Error(error.message);
  await loadJourneyRules();
}
