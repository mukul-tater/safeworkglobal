import { supabase } from '@/integrations/supabase/client';
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
