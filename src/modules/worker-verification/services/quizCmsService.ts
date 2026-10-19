import { supabase } from '@/integrations/supabase/client';
import { inferEuropeQuizJob } from '@/lib/europeQuizJobs';
import { inferUaeListedJob } from '@/lib/uaeListedJobs';
import { bundledMcqBank } from '../quiz-data/mcqBank';
import { QUIZ_PASS_SCORE, QUIZ_QUESTIONS_TO_SHOW } from '../constants';
import { isQuizSkillCode, QUIZ_SKILL_CODES } from '../quiz-data/quizSkill';
import type { SkillQuizConfig, SkillQuizItem } from '../types';

const db = supabase as any;

export type QuizItemInput = {
  id?: string;
  skill_code: string;
  question: string;
  question_hi: string | null;
  image_url: string | null;
  youtube_url: string | null;
  expected_answer: boolean;
  options?: { id: string; en: string; hi: string }[] | null;
  correct_option?: string | null;
  region: string | null;
  sort_order: number;
  active: boolean;
};

export async function listQuizItems(skill: string): Promise<SkillQuizItem[]> {
  const { data, error } = await db
    .from('worker_skill_quiz_items')
    .select('*')
    .eq('skill_code', skill)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as SkillQuizItem[];
}

export async function saveQuizItem(input: QuizItemInput): Promise<void> {
  const payload = {
    skill_code: input.skill_code,
    question: input.question.trim(),
    question_hi: input.question_hi?.trim() || null,
    image_url: input.image_url?.trim() || null,
    youtube_url: input.youtube_url?.trim() || null,
    expected_answer: input.expected_answer,
    options: input.options?.length ? input.options : null,
    correct_option: input.correct_option || null,
    region: input.region || null,
    sort_order: input.sort_order,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await db.from('worker_skill_quiz_items').update(payload).eq('id', input.id)
    : await db.from('worker_skill_quiz_items').insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteQuizItem(id: string): Promise<void> {
  const { error } = await db.from('worker_skill_quiz_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listQuizConfigs(skill: string): Promise<SkillQuizConfig[]> {
  const { data, error } = await db
    .from('skill_quiz_configs')
    .select('*')
    .eq('skill_code', skill)
    .order('region', { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data || []) as SkillQuizConfig[];
}

export async function saveQuizConfig(input: {
  id?: string;
  skill_code: string;
  region: string | null;
  questions_to_show: number;
  selection_mode: 'random_active' | 'explicit_ids';
  selected_ids: string[];
  pass_score: number;
  disclaimer_en?: string | null;
  disclaimer_hi?: string | null;
  active: boolean;
}): Promise<void> {
  const payload = {
    skill_code: input.skill_code,
    region: input.region || null,
    questions_to_show: input.questions_to_show,
    selection_mode: input.selection_mode,
    selected_ids: input.selected_ids,
    pass_score: input.pass_score,
    disclaimer_en: input.disclaimer_en?.trim() || null,
    disclaimer_hi: input.disclaimer_hi?.trim() || null,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await db.from('skill_quiz_configs').update(payload).eq('id', input.id)
    : await db.from('skill_quiz_configs').insert(payload);
  if (error) throw new Error(error.message);
}

/** Paper id for a job title. Known trades share one bank; other titles keep their own. */
export function quizPaperForLabel(
  title: string,
  quizSkillCode?: string | null,
  country?: string | null,
): string {
  const explicit = quizSkillCode?.trim() || '';
  if (explicit && isQuizSkillCode(explicit)) return explicit;
  const europe = inferEuropeQuizJob(explicit || title);
  if (europe) return europe;
  const listed = inferUaeListedJob(title, '', country);
  if (listed) return listed;
  const trimmed = title.trim();
  if (trimmed) return trimmed;
  return explicit || 'Other';
}

/** Default bilingual bank when the CMS has no rows yet. */
export function defaultQuizBankForSkill(skill: string) {
  const paper = quizPaperForLabel(skill);
  return bundledMcqBank(paper) ?? bundledMcqBank(skill) ?? [];
}

/** Copy the bundled 10-question bank into the CMS for a new trade. */
export async function publishDefaultQuizBank(skill: string): Promise<number> {
  const paper = quizPaperForLabel(skill);
  const bank = bundledMcqBank(paper) ?? [];
  if (!bank.length) {
    throw new Error('No default questions for this skill');
  }

  const existing = await listQuizItems(paper);
  const have = new Set(existing.map((row) => row.question.trim().toLowerCase()));
  const missing = bank.filter((q) => !have.has(q.question.trim().toLowerCase()));
  if (!missing.length) return 0;

  const rows = missing.map((q, index) => ({
    skill_code: paper,
    question: q.question,
    question_hi: q.question_hi,
    image_url: null,
    youtube_url: null,
    expected_answer: false,
    options: q.options,
    correct_option: q.correct,
    region: null,
    sort_order: existing.length + index + 1,
    active: true,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from('worker_skill_quiz_items').insert(rows);
  if (error) throw new Error(error.message);

  const configs = await listQuizConfigs(paper);
  if (!configs.some((c) => !c.region)) {
    await saveQuizConfig({
      skill_code: paper,
      region: null,
      questions_to_show: QUIZ_QUESTIONS_TO_SHOW,
      selection_mode: 'random_active',
      selected_ids: [],
      pass_score: QUIZ_PASS_SCORE,
      active: true,
    });
  }

  return rows.length;
}

/** Every Test 1 paper: built-in trades, saved quiz rows, and each live job. */
export async function listQuizSkillChoices(): Promise<string[]> {
  const names = new Set<string>(QUIZ_SKILL_CODES);
  const titled = await supabase.from('jobs').select('title, country, quiz_skill_code').eq('status', 'ACTIVE');
  let jobs: { title?: string | null; country?: string | null; quiz_skill_code?: string | null }[] = [];
  if (titled.error) {
    const fallback = await supabase.from('jobs').select('title, country').eq('status', 'ACTIVE');
    if (fallback.error) throw new Error(fallback.error.message);
    jobs = fallback.data || [];
  } else {
    jobs = titled.data || [];
  }
  const { data: items, error: itemError } = await db.from('worker_skill_quiz_items').select('skill_code');
  if (itemError) throw new Error(itemError.message);
  for (const job of jobs) {
    const title = (job.title || '').trim();
    const paper = quizPaperForLabel(title, job.quiz_skill_code, job.country);
    if (title) names.add(title);
    if (paper) names.add(paper);
  }
  for (const row of items || []) {
    const code = String((row as { skill_code?: string }).skill_code || '').trim();
    if (code) names.add(code);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Fill CMS banks for any listed trade that still has zero questions. */
let missingBanksInflight: Promise<string[]> | null = null;
let missingBanksDone = false;

export async function publishMissingDefaultBanks(): Promise<string[]> {
  if (missingBanksDone) return [];
  if (!missingBanksInflight) {
    missingBanksInflight = (async () => {
      const seeded: string[] = [];
      const seen = new Set<string>();
      const choices = await listQuizSkillChoices();
      for (const skill of choices) {
        const paper = quizPaperForLabel(skill);
        if (seen.has(paper) || !bundledMcqBank(paper)?.length) continue;
        seen.add(paper);
        const added = await publishDefaultQuizBank(paper);
        if (added > 0) seeded.push(paper);
      }
      missingBanksDone = true;
      return seeded;
    })().finally(() => {
      missingBanksInflight = null;
    });
  }
  return missingBanksInflight;
}
