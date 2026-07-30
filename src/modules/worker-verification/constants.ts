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

/** Short labels used inside the wizard UI (DB stages). */
export const VERIFICATION_STAGE_LABELS: Record<VerificationStage, string> = {
  essentials: 'Essentials',
  quiz: 'Test 1 — Know this work?',
  media: 'Skill proof upload',
  awaiting_interview: 'Test 2 — Video interview',
  awaiting_payment: 'Payment',
  tests: 'Test 3 — Physical trade test',
  bond: 'Bond',
  gcc_ready: 'GCC ready',
};

/**
 * Sidebar / home tracker.
 * Test 1 = reference media + yes/no knowledge.
 * Skill proof upload sits after Test 1 and before Test 2 (profile completion phase).
 */
export type GccNavStepId =
  | 'essentials'
  | 'test1'
  | 'skill_proof'
  | 'test2'
  | 'payment'
  | 'test3'
  | 'bond'
  | 'gcc_ready';

export const GCC_JOURNEY_NAV_STEPS: {
  id: GccNavStepId;
  label: string;
  shortLabel: string;
  /** DB stages that count as this nav step. */
  stages: VerificationStage[];
}[] = [
  { id: 'essentials', label: 'Essentials', shortLabel: 'Essentials', stages: ['essentials'] },
  {
    id: 'test1',
    label: 'Test 1 — Know this work?',
    shortLabel: 'Test 1',
    stages: ['quiz'],
  },
  {
    id: 'skill_proof',
    label: 'Skill proof upload',
    shortLabel: 'Skill proof',
    stages: ['media'],
  },
  {
    id: 'test2',
    label: 'Test 2 — Video interview',
    shortLabel: 'Test 2',
    stages: ['awaiting_interview'],
  },
  {
    id: 'payment',
    label: 'Payment',
    shortLabel: 'Payment',
    stages: ['awaiting_payment'],
  },
  {
    id: 'test3',
    label: 'Test 3 — Physical trade test',
    shortLabel: 'Test 3',
    stages: ['tests'],
  },
  { id: 'bond', label: 'Bond', shortLabel: 'Bond', stages: ['bond'] },
  { id: 'gcc_ready', label: 'GCC ready', shortLabel: 'GCC ready', stages: ['gcc_ready'] },
];

export function navStepIndex(id: GccNavStepId): number {
  return GCC_JOURNEY_NAV_STEPS.findIndex((s) => s.id === id);
}

export function navStepForStage(stage: VerificationStage): GccNavStepId {
  const found = GCC_JOURNEY_NAV_STEPS.find((s) => s.stages.includes(stage));
  return found?.id ?? 'essentials';
}

/** Convert YouTube watch/shorts links to embeddable URL. */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.includes('/shorts/')) {
      const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}`;
  } catch {
    /* ignore */
  }
  return null;
}
