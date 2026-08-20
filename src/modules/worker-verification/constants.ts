export const WORKER_TERMS_VERSION = 'worker-v1-2026-07';

/** Short summary shown on signup (2–4 lines). */
export const WORKER_TERMS_SUMMARY = [
  'I confirm I am medically fit for overseas skilled work and will provide truthful information.',
  'I agree to SafeWork Global’s terms, privacy policy, and fair-recruitment rules (no unauthorized fees).',
  'I understand skill checks, interviews, and document verification are part of becoming GCC-ready.',
].join(' ');

export type WorkerTermsSection = {
  id: string;
  title: string;
  body: string;
};

/** Structured sections for the agree dialog UI. */
export const WORKER_TERMS_SECTIONS: WorkerTermsSection[] = [
  {
    id: 'platform',
    title: 'Platform terms',
    body: 'By creating an account you agree to SafeWork Global’s Terms of Service and Privacy Policy. SafeWork connects verified workers with overseas employers and partners. We do not guarantee a job offer.',
  },
  {
    id: 'medical',
    title: 'Medical fitness',
    body: 'You declare that you are medically fit to travel and work abroad in your trade, subject to formal medical examination when required. You will disclose known conditions that may affect fitness for work.',
  },
  {
    id: 'truthful',
    title: 'Truthful information',
    body: 'All details you provide (identity, skills, experience, documents, media) must be accurate. False information may lead to rejection or removal from the platform.',
  },
  {
    id: 'fees',
    title: 'No unauthorized fees',
    body: 'You will not pay any agent or person unauthorized fees for jobs, visas, or placement. Report any such demand to SafeWork immediately. Official assessment or process fees are only those shown inside this portal.',
  },
  {
    id: 'skills',
    title: 'Skill verification',
    body: 'You agree to complete skill checks (quiz, media, video interview) and, if required, physical trade tests and medical tests arranged through SafeWork or approved partners (including E-Mitra).',
  },
  {
    id: 'bond',
    title: 'Bond & compliance',
    body: 'When selected for placement you may be required to execute a bond (stamp paper / eStamp / E-Mitra assisted) with video proof, and to follow Ministry of External Affairs recruitment guidelines.',
  },
  {
    id: 'contact',
    title: 'Contact',
    body: 'For questions, use in-app support or Contact Us on safeworkglobal.com.',
  },
];

/** Full terms body (plain text) for archives / fallbacks. */
export const WORKER_TERMS_FULL = [
  'SafeWork Global — Worker Terms & Declarations',
  '',
  ...WORKER_TERMS_SECTIONS.map((s, i) => `${i + 1}. ${s.title}\n${s.body}`),
].join('\n\n');

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

/** Indian workers who passed Class 10 are ECNR; below 10th are ECR. */
export function ecrFromTenthPass(tenthPass: boolean): {
  tenth_pass_confirmed: boolean;
  ecr_category: 'ECNR' | 'ECR';
  ecr_status: 'not_required' | 'required';
} {
  if (tenthPass) {
    return {
      tenth_pass_confirmed: true,
      ecr_category: 'ECNR',
      ecr_status: 'not_required',
    };
  }
  return {
    tenth_pass_confirmed: false,
    ecr_category: 'ECR',
    ecr_status: 'required',
  };
}

export function educationOptionsForTenthPass(tenthPass: boolean | null): readonly string[] {
  if (tenthPass === true) return EDUCATION_LEVELS.filter((level) => level !== 'Below 10th');
  if (tenthPass === false) return EDUCATION_LEVELS.filter((level) => level === 'Below 10th');
  return EDUCATION_LEVELS;
}

/** Video interview score at or above this historically skipped trade test — skill list is primary now. */
export const INTERVIEW_TRADE_TEST_THRESHOLD = 70;

/**
 * Physical trade test is mandatory for hands-on technical trades.
 * Driver / Helper / Other skip trade test and go to medical after payment.
 */
export const TRADE_TEST_REQUIRED_SKILLS = [
  'Electrician',
  'Welder',
  'Plumber',
  'Mason',
  'Carpenter',
  'HVAC Technician',
] as const;

export function skillRequiresTradeTest(skill: string | null | undefined): boolean {
  if (!skill) return true;
  return (TRADE_TEST_REQUIRED_SKILLS as readonly string[]).includes(skill);
}

/** Fee (INR) shown on the Payment step. */
export const ASSESSMENT_FEE_INR = 35400;

export type VerificationStage =
  | 'essentials'
  | 'quiz'
  | 'media'
  | 'identity'
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'trade_test'
  | 'medical'
  | 'tests' // legacy — normalized to trade_test / medical in UI
  | 'bond'
  | 'pdot'
  | 'deployment'
  | 'gcc_ready';

export const VERIFICATION_STAGE_ORDER: VerificationStage[] = [
  'essentials',
  'quiz',
  'media',
  'identity',
  'awaiting_interview',
  'awaiting_payment',
  'trade_test',
  'medical',
  'bond',
  'pdot',
  'deployment',
  'gcc_ready',
];

/** Short labels used inside the wizard UI (DB stages). */
export const VERIFICATION_STAGE_LABELS: Record<VerificationStage, string> = {
  essentials: 'Essentials',
  quiz: 'Test 1 — Know this work?',
  media: 'Skill proof upload',
  identity: 'Identity (KYC)',
  awaiting_interview: 'Test 2 — Video interview',
  awaiting_payment: 'Payment',
  trade_test: 'Test 3 — Physical trade test',
  medical: 'Medical',
  tests: 'Test 3 — Physical trade test',
  bond: 'Bond',
  pdot: 'PDOT training',
  deployment: 'Deployment',
  gcc_ready: 'GCC ready',
};

/**
 * Sidebar / home tracker.
 * Identity/KYC is required before applying to jobs (after skill proof, before Test 2).
 */
export type GccNavStepId =
  | 'essentials'
  | 'test1'
  | 'skill_proof'
  | 'identity'
  | 'test2'
  | 'payment'
  | 'test3'
  | 'medical'
  | 'bond'
  | 'pdot'
  | 'deployment'
  | 'gcc_ready';

export const GCC_JOURNEY_NAV_STEPS: {
  id: GccNavStepId;
  label: string;
  shortLabel: string;
  /** Medium-length label for the sidebar — descriptive but fits a 16rem rail. */
  navLabel: string;
  /** DB stages that count as this nav step. */
  stages: VerificationStage[];
}[] = [
  {
    id: 'essentials',
    label: 'Essentials',
    shortLabel: 'Essentials',
    navLabel: 'Essentials',
    stages: ['essentials'],
  },
  {
    id: 'test1',
    label: 'Test 1 — Know this work?',
    shortLabel: 'Test 1',
    navLabel: 'Test 1 — Work quiz',
    stages: ['quiz'],
  },
  {
    id: 'skill_proof',
    label: 'Skill proof upload',
    shortLabel: 'Skill proof',
    navLabel: 'Skill proof',
    stages: ['media'],
  },
  {
    id: 'identity',
    label: 'Identity (KYC)',
    shortLabel: 'Identity',
    navLabel: 'Identity (KYC)',
    stages: ['identity'],
  },
  {
    id: 'test2',
    label: 'Test 2 — Video interview',
    shortLabel: 'Test 2',
    navLabel: 'Test 2 — Interview',
    stages: ['awaiting_interview'],
  },
  {
    id: 'payment',
    label: 'Payment',
    shortLabel: 'Payment',
    navLabel: 'Payment',
    stages: ['awaiting_payment'],
  },
  {
    id: 'test3',
    label: 'Test 3 — Physical trade test',
    shortLabel: 'Test 3',
    navLabel: 'Test 3 — Trade test',
    stages: ['trade_test', 'tests'],
  },
  {
    id: 'medical',
    label: 'Medical',
    shortLabel: 'Medical',
    navLabel: 'Medical',
    stages: ['medical'],
  },
  { id: 'bond', label: 'Bond', shortLabel: 'Bond', navLabel: 'Bond', stages: ['bond'] },
  {
    id: 'pdot',
    label: 'PDOT training',
    shortLabel: 'PDOT',
    navLabel: 'PDOT training',
    stages: ['pdot'],
  },
  {
    id: 'gcc_ready',
    label: 'GCC ready',
    shortLabel: 'GCC ready',
    navLabel: 'GCC ready',
    stages: ['gcc_ready'],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    shortLabel: 'Deployment',
    navLabel: 'Deployment',
    stages: ['deployment'],
  },
];

/** Minimum Test 1 score to pass. Failing allows unlimited retries for now. */
export const QUIZ_PASS_SCORE = 60;

/** Deployment checklist items shown to admin + worker (read-only for worker). */
export const DEPLOYMENT_CHECKLIST = [
  { key: 'deploy_offer_status', label: 'Offer letter' },
  { key: 'deploy_contract_status', label: 'Employment contract' },
  { key: 'deploy_emigration_status', label: 'Emigration / PoE clearance' },
  { key: 'deploy_visa_status', label: 'Visa' },
  { key: 'deploy_insurance_status', label: 'Insurance' },
  { key: 'deploy_ticket_status', label: 'Flight ticket' },
] as const;

export function normalizeVerificationStage(
  stage: string | null | undefined,
  tradeRequired?: boolean | null,
): VerificationStage {
  if (!stage) return 'essentials';
  if (stage === 'tests') {
    return tradeRequired === false ? 'medical' : 'trade_test';
  }
  return stage as VerificationStage;
}

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

/**
 * Journey reset control — local / Lovable preview only.
 * Never on safeworkglobal.com production hosts.
 */
export function isJourneyResetEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_JOURNEY_RESET === 'false') return false;
  if (import.meta.env.VITE_ENABLE_JOURNEY_RESET === 'true') return true;
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  if (host === 'safeworkglobal.com' || host.endsWith('.safeworkglobal.com')) return false;
  return (
    host.includes('lovable') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}
