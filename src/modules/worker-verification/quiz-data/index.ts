import type { SkillQuizItem } from '../types';
import { BASIC_TRADE_KNOWLEDGE_BANK } from './basic-trade-knowledge';
import driver from './driver.questions.json';
import other from './other.questions.json';
import { isUaeListedQuizSkill, resolveQuizSkillCode } from './quizSkill';
import { shuffleCopy } from './shuffle';

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

const YES_NO_BY_SKILL: Record<string, SkillQuizJsonFile> = {
  Driver: driver as SkillQuizJsonFile,
  Other: other as SkillQuizJsonFile,
};

function toYesNoItems(file: SkillQuizJsonFile): SkillQuizItem[] {
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
      options: null,
    }));
}

function slugSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Load Test 1 questions from the bundled bank when the CMS has nothing for the skill. */
export function loadQuizItemsFromJson(skill: string): SkillQuizItem[] {
  const resolved = resolveQuizSkillCode({ primarySkill: skill });
  if (isUaeListedQuizSkill(resolved)) {
    const prefix = slugSkill(resolved);
    return shuffleCopy(
      BASIC_TRADE_KNOWLEDGE_BANK[resolved].map((q, index) => ({
        id: `${prefix}-${index + 1}`,
        skill_code: resolved,
        question: q.question,
        question_hi: q.question_hi,
        youtube_url: null,
        image_url: null,
        expected_answer: false,
        sort_order: index + 1,
        options: shuffleCopy(q.options),
      })),
    );
  }
  const file = YES_NO_BY_SKILL[resolved] || YES_NO_BY_SKILL.Other;
  return toYesNoItems(file);
}
