import type { SkillQuizItem } from '../types';
import { isMcqQuizItem } from '../types';
import { BASIC_TRADE_KNOWLEDGE_BANK } from './basic-trade-knowledge';
import { isUaeListedQuizSkill } from './quizSkill';

export type LocalQuizGrade = {
  score: number;
  correct_count: number;
  total_count: number;
};

/**
 * Grade against the bundled bilingual bank when the CMS RPC cannot
 * (missing migration, non-UUID fallback ids, or pre-MCQ submit function).
 */
export function gradeLocalQuiz(
  items: SkillQuizItem[],
  answers: { quiz_item_id: string; answer: boolean | string }[],
): LocalQuizGrade | null {
  if (!items.length || answers.length !== items.length) return null;
  const byId = new Map(answers.map((row) => [row.quiz_item_id, row.answer]));
  let correct = 0;

  for (const item of items) {
    const given = byId.get(item.id);
    if (given === undefined) return null;

    if (isMcqQuizItem(item)) {
      if (!isUaeListedQuizSkill(item.skill_code)) return null;
      const bankQ = BASIC_TRADE_KNOWLEDGE_BANK[item.skill_code].find(
        (row) => row.question === item.question,
      );
      if (!bankQ) return null;
      if (String(given) !== bankQ.correct) continue;
      correct += 1;
      continue;
    }

    const expected = item.expected_answer;
    if (typeof given === 'boolean') {
      if (given === expected) correct += 1;
      continue;
    }
    if (given === 'true' || given === 'false') {
      if ((given === 'true') === expected) correct += 1;
      continue;
    }
    return null;
  }

  const total = items.length;
  return {
    score: total > 0 ? Math.round((correct / total) * 1000) / 10 : 0,
    correct_count: correct,
    total_count: total,
  };
}
