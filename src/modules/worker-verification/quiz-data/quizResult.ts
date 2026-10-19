import { getJourneyRules } from '@/lib/journeyRules';
import { QUIZ_PASS_SCORE } from '../constants';

export type QuizResultBand = {
  passed: boolean;
  bandEn: string;
  bandHi: string;
  screeningEn: string;
  screeningHi: string;
};

function configuredPassScore(value: number | null | undefined): number | null {
  const score = Number(value);
  if (Number.isInteger(score) && score >= 1 && score <= 100) return score;
  return null;
}

/**
 * Job pass score wins, then the skill's Quiz CMS pass score, then 60.
 * Delivery's 70% lives on that skill in Quiz CMS.
 */
export function quizPassScoreForSkill(
  _skill: string | null | undefined,
  jobPassScore?: number | null,
  cmsPassScore?: number | null,
): number {
  return configuredPassScore(jobPassScore) ?? configuredPassScore(cmsPassScore) ?? QUIZ_PASS_SCORE;
}

/**
 * Screening labels only — never “Certified Electrician” / “Skilled Welder”.
 * 9–10 strong. Between the pass mark and 90 is a pass. 50 up to the pass mark needs review.
 */
export function describeQuizResult(
  scorePercent: number,
  skill?: string | null,
  jobPassScore?: number | null,
  cmsPassScore?: number | null,
): QuizResultBand {
  const passScore = quizPassScoreForSkill(skill, jobPassScore, cmsPassScore);
  const passed = scorePercent >= passScore;
  const quiz = getJourneyRules().copy.quiz;
  const screening = passed ? quiz.screeningPassed : quiz.screeningFailed;
  const screeningEn = screening.en;
  const screeningHi = screening.hi;

  if (scorePercent >= quiz.strongMin) {
    return { passed, bandEn: quiz.strong.en, bandHi: quiz.strong.hi, screeningEn, screeningHi };
  }
  if (scorePercent >= passScore) {
    return { passed, bandEn: quiz.pass.en, bandHi: quiz.pass.hi, screeningEn, screeningHi };
  }
  if (scorePercent >= quiz.reviewMin) {
    return { passed, bandEn: quiz.review.en, bandHi: quiz.review.hi, screeningEn, screeningHi };
  }
  return { passed, bandEn: quiz.insufficient.en, bandHi: quiz.insufficient.hi, screeningEn, screeningHi };
}
