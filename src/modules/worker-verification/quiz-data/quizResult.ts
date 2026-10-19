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
 * Default 10-question paper: 9–10 strong / 6–8 pass / 5 needs review / 0–4 insufficient.
 */
export function describeQuizResult(
  scorePercent: number,
  skill?: string | null,
  jobPassScore?: number | null,
  cmsPassScore?: number | null,
): QuizResultBand {
  const passScore = quizPassScoreForSkill(skill, jobPassScore, cmsPassScore);
  const passed = scorePercent >= passScore;
  const screeningEn = passed
    ? 'Basic Trade Knowledge Screening: PASSED'
    : 'Basic Trade Knowledge Screening: NOT PASSED';
  const screeningHi = passed
    ? 'बेसिक ट्रेड नॉलेज स्क्रीनिंग: पास'
    : 'बेसिक ट्रेड नॉलेज स्क्रीनिंग: पास नहीं';

  if (scorePercent >= 90) {
    return {
      passed,
      bandEn: 'Strong Basic Knowledge',
      bandHi: 'अच्छा बुनियादी ज्ञान',
      screeningEn,
      screeningHi,
    };
  }
  if (scorePercent >= passScore) {
    return {
      passed,
      bandEn: 'Basic Knowledge — Pass',
      bandHi: 'बुनियादी ज्ञान — पास',
      screeningEn,
      screeningHi,
    };
  }
  if (scorePercent >= 50) {
    return {
      passed,
      bandEn: 'Needs Review',
      bandHi: 'समीक्षा आवश्यक',
      screeningEn,
      screeningHi,
    };
  }
  return {
    passed,
    bandEn: 'Basic Knowledge Insufficient',
    bandHi: 'बुनियादी ज्ञान अपर्याप्त',
    screeningEn,
    screeningHi,
  };
}
