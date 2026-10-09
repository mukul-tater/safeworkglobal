import { QUIZ_PASS_SCORE } from '../constants';

export type QuizResultBand = {
  passed: boolean;
  bandEn: string;
  bandHi: string;
  screeningEn: string;
  screeningHi: string;
};

/** Bike parcel Test 1 passes at 7/10. Other trades stay at 6/10. */
export const DELIVERY_QUIZ_PASS_SCORE = 70;

export const DELIVERY_QUIZ_DISCLAIMER = {
  en: 'This test evaluates basic road safety, delivery handling and customer-service knowledge only. It does not certify driving ability or guarantee employment. Candidates must separately meet the applicable UAE driving licence, employer and job-specific requirements.',
  hi: 'यह टेस्ट केवल सड़क सुरक्षा, डिलीवरी हैंडलिंग और ग्राहक सेवा का बुनियादी ज्ञान जाँचता है। यह ड्राइविंग क्षमता प्रमाणित नहीं करता और नौकरी की गारंटी नहीं देता। उम्मीदवारों को UAE ड्राइविंग लाइसेंस, नियोक्ता और नौकरी की अलग शर्तें पूरी करनी होंगी।',
};

export function quizPassScoreForSkill(skill: string | null | undefined): number {
  return skill === 'Delivery' ? DELIVERY_QUIZ_PASS_SCORE : QUIZ_PASS_SCORE;
}

/**
 * Screening labels only — never “Certified Electrician” / “Skilled Welder”.
 * Default 10-question paper: 9–10 strong / 6–8 pass / 5 needs review / 0–4 insufficient.
 * Delivery: 9–10 strong / 7–8 pass / 5–6 needs review / 0–4 insufficient.
 */
export function describeQuizResult(scorePercent: number, skill?: string | null): QuizResultBand {
  const passScore = quizPassScoreForSkill(skill);
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
