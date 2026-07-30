import type { SkillQuizItem } from '../types';
import carpenter from './carpenter.questions.json';
import driver from './driver.questions.json';
import electrician from './electrician.questions.json';
import helper from './helper.questions.json';
import hvac from './hvac-technician.questions.json';
import mason from './mason.questions.json';
import other from './other.questions.json';
import plumber from './plumber.questions.json';
import welder from './welder.questions.json';

export interface SkillQuizJsonFile {
  skill: string;
  questions: Array<{
    id: string;
    question: string;
    question_hi: string;
    youtube_url: string | null;
    image_url: string | null;
    expected_answer: boolean;
    sort_order: number;
  }>;
}

const QUIZ_BY_SKILL: Record<string, SkillQuizJsonFile> = {
  Electrician: electrician as SkillQuizJsonFile,
  Plumber: plumber as SkillQuizJsonFile,
  Welder: welder as SkillQuizJsonFile,
  Driver: driver as SkillQuizJsonFile,
  Mason: mason as SkillQuizJsonFile,
  Carpenter: carpenter as SkillQuizJsonFile,
  Helper: helper as SkillQuizJsonFile,
  'HVAC Technician': hvac as SkillQuizJsonFile,
  Other: other as SkillQuizJsonFile,
};

function toItems(file: SkillQuizJsonFile): SkillQuizItem[] {
  return [...file.questions]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((q) => ({
      id: q.id,
      skill_code: file.skill,
      question: q.question,
      question_hi: q.question_hi,
      youtube_url: q.youtube_url,
      image_url: q.image_url,
      expected_answer: q.expected_answer,
      sort_order: q.sort_order,
    }));
}

/** Load Test 1 questions from per-skill JSON (e.g. welder.questions.json). */
export function loadQuizItemsFromJson(skill: string): SkillQuizItem[] {
  const file = QUIZ_BY_SKILL[skill] || QUIZ_BY_SKILL.Other;
  return toItems(file);
}
