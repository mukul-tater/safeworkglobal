export const WORKER_TERMS_VERSION = 'worker-v1-2026-07';

/** Short summary shown on signup (2–4 lines). */
export const WORKER_TERMS_SUMMARY = [
  'I confirm I am medically fit for overseas skilled work and will provide truthful information.',
  'I agree to SafeWork Global’s terms, privacy policy, and fair-recruitment rules (no unauthorized fees).',
  'I understand skill checks, interviews, and document verification are part of becoming GCC-ready.',
].join(' ');

/** Full terms body for the agree popup. */
export const WORKER_TERMS_FULL = `
SafeWork Global — Worker Terms & Declarations

1. Platform terms
By creating an account you agree to SafeWork Global’s Terms of Service and Privacy Policy. SafeWork connects verified workers with overseas employers and partners. We do not guarantee a job offer.

2. Medical fitness
You declare that you are medically fit to travel and work abroad in your trade, subject to formal medical examination when required. You will disclose known conditions that may affect fitness for work.

3. Truthful information
All details you provide (identity, skills, experience, documents, media) must be accurate. False information may lead to rejection or removal from the platform.

4. No unauthorized fees
You will not pay any agent or person unauthorized fees for jobs, visas, or placement. Report any such demand to SafeWork immediately. Official assessment or process fees are only those shown inside this portal.

5. Skill verification
You agree to complete skill checks (quiz, media, video interview) and, if required, physical trade tests and medical tests arranged through SafeWork or approved partners (including E-Mitra).

6. Bond & compliance
When selected for placement you may be required to execute a bond (stamp paper / eStamp / E-Mitra assisted) with video proof, and to follow Ministry of External Affairs recruitment guidelines.

7. Contact
For questions, use in-app support or Contact Us on safeworkglobal.com.
`.trim();

export const EDUCATION_LEVELS = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'ITI / Trade Certificate',
  'Diploma',
  'Graduate',
  'Post Graduate',
  'Other',
] as const;

/** Video interview score at or above this skips physical trade test. */
export const INTERVIEW_TRADE_TEST_THRESHOLD = 70;

/** Assessment fee (INR) shown on payment step. */
export const ASSESSMENT_FEE_INR = 35400;

export type VerificationStage =
  | 'essentials'
  | 'quiz'
  | 'media'
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'tests'
  | 'bond'
  | 'gcc_ready';

export const VERIFICATION_STAGE_ORDER: VerificationStage[] = [
  'essentials',
  'quiz',
  'media',
  'awaiting_interview',
  'awaiting_payment',
  'tests',
  'bond',
  'gcc_ready',
];

export const VERIFICATION_STAGE_LABELS: Record<VerificationStage, string> = {
  essentials: 'Essentials',
  quiz: 'Skill check',
  media: 'Skill proof',
  awaiting_interview: 'Video interview',
  awaiting_payment: 'Payment',
  tests: 'Medical / trade test',
  bond: 'Bond',
  gcc_ready: 'GCC ready',
};
