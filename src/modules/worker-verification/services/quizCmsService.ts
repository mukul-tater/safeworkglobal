import { supabase } from '@/integrations/supabase/client';
import { BASIC_TRADE_KNOWLEDGE_BANK } from '../quiz-data/basic-trade-knowledge';
import { isUaeListedQuizSkill } from '../quiz-data/quizSkill';
import { QUIZ_PASS_SCORE, QUIZ_QUESTIONS_TO_SHOW } from '../constants';
import { UAE_LISTED_JOBS } from '@/lib/uaeListedJobs';
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
  active: boolean;
}): Promise<void> {
  const payload = {
    skill_code: input.skill_code,
    region: input.region || null,
    questions_to_show: input.questions_to_show,
    selection_mode: input.selection_mode,
    selected_ids: input.selected_ids,
    pass_score: input.pass_score,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await db.from('skill_quiz_configs').update(payload).eq('id', input.id)
    : await db.from('skill_quiz_configs').insert(payload);
  if (error) throw new Error(error.message);
}

/** Default bilingual bank for a UAE listed trade (used when CMS has no rows yet). */
export function defaultQuizBankForSkill(skill: string) {
  if (!isUaeListedQuizSkill(skill)) return [];
  return BASIC_TRADE_KNOWLEDGE_BANK[skill];
}

/** Copy the bundled 10-question bank into the CMS for a new trade. */
export async function publishDefaultQuizBank(skill: string): Promise<number> {
  const bank = defaultQuizBankForSkill(skill);
  if (!bank.length) {
    throw new Error('No default questions for this skill');
  }

  const existing = await listQuizItems(skill);
  if (existing.length > 0) return 0;

  const rows = bank.map((q, index) => ({
    skill_code: skill,
    question: q.question,
    question_hi: q.question_hi,
    image_url: null,
    youtube_url: null,
    expected_answer: false,
    options: q.options,
    correct_option: q.correct,
    region: null,
    sort_order: index + 1,
    active: true,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from('worker_skill_quiz_items').insert(rows);
  if (error) throw new Error(error.message);

  const configs = await listQuizConfigs(skill);
  if (!configs.some((c) => !c.region)) {
    await saveQuizConfig({
      skill_code: skill,
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

/** Fill CMS banks for any UAE listed trade that still has zero questions. */
let missingBanksInflight: Promise<string[]> | null = null;
let missingBanksDone = false;

export async function publishMissingDefaultBanks(): Promise<string[]> {
  if (missingBanksDone) return [];
  if (!missingBanksInflight) {
    missingBanksInflight = (async () => {
      const { data, error } = await db.from('worker_skill_quiz_items').select('skill_code');
      if (error) throw new Error(error.message);
      const have = new Set((data || []).map((row: { skill_code: string }) => row.skill_code));
      const seeded: string[] = [];
      for (const skill of UAE_LISTED_JOBS) {
        if (have.has(skill)) continue;
        const added = await publishDefaultQuizBank(skill);
        if (added > 0) seeded.push(skill);
      }
      missingBanksDone = true;
      return seeded;
    })().finally(() => {
      missingBanksInflight = null;
    });
  }
  return missingBanksInflight;
}
