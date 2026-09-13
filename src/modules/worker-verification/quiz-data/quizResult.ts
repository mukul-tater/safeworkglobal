import { QUIZ_PASS_SCORE } from '../constants';

export type QuizResultBand = {
  passed: boolean;
  bandEn: string;
  bandHi: string;
  screeningEn: string;
  screeningHi: string;
};

/**
 * Screening labels only — never “Certified Electrician” / “Skilled Welder”.
 * Bands assume a 10-question paper: 9–10 / 7–8 / 5–6 / 0–4.
 */
export function describeQuizResult(scorePercent: number): QuizResultBand {
  const passed = scorePercent >= QUIZ_PASS_SCORE;
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
  if (scorePercent >= 70) {
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
