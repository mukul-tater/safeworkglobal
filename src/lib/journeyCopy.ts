import { SAFEWORK_CONTACT } from '@/config/workerSupport';
import {
  GCC_JOURNEY_NAV_STEPS,
  VERIFICATION_STAGE_LABELS,
  type GccNavStepId,
} from '@/modules/worker-verification/constants';
import { JOURNEY_PHASES, type JourneyPhaseId } from '@/modules/worker-verification/journey/phases';
import { ORIGINAL_DOCS_READY_NOTICE } from '@/modules/worker-verification/types/declarations.types';

export type EnHi = { en: string; hi: string };

export type NavLabelCopy = { label: string; shortLabel: string; navLabel: string };

export type JourneyCopy = {
  documents: {
    badge: EnHi;
    title: EnHi;
    body: EnHi;
    items: EnHi[];
    continue: EnHi;
  };
  support: {
    comingUp: string;
    dataSafeTitle: string;
    dataSafeBullets: string[];
    helpTitle: string;
    helpBody: string;
    email: string;
    whatsappDisplay: string;
    whatsappDigits: string;
    officeAddress: string;
    workingAddress: string;
    footerAddresses: string[];
  };
  emailGateSentence: string;
  quiz: {
    strongMin: number;
    reviewMin: number;
    strong: EnHi;
    pass: EnHi;
    review: EnHi;
    insufficient: EnHi;
    screeningPassed: EnHi;
    screeningFailed: EnHi;
  };
  phases: Record<JourneyPhaseId, string>;
  stages: Partial<Record<GccNavStepId, NavLabelCopy>>;
};

function pair(en: string, hi: string): EnHi {
  return { en, hi };
}

const BUILTIN_STAGES: JourneyCopy['stages'] = Object.fromEntries(
  GCC_JOURNEY_NAV_STEPS.map((step) => [
    step.id,
    { label: step.label, shortLabel: step.shortLabel, navLabel: step.navLabel },
  ]),
);

const BUILTIN_CONTACT = {
  email: SAFEWORK_CONTACT.email,
  whatsappDisplay: SAFEWORK_CONTACT.whatsappDisplay,
  whatsappDigits: SAFEWORK_CONTACT.whatsappDigits,
  officeAddress: SAFEWORK_CONTACT.officeAddress,
  workingAddress: SAFEWORK_CONTACT.workingAddress,
  footerAddresses: [...SAFEWORK_CONTACT.vestaOfficeAddresses],
};

const BUILTIN_PHASES: JourneyCopy['phases'] = {
  profile: JOURNEY_PHASES.find((phase) => phase.id === 'profile')?.label || 'Profile',
  verify: JOURNEY_PHASES.find((phase) => phase.id === 'verify')?.label || 'Verify',
  assess: JOURNEY_PHASES.find((phase) => phase.id === 'assess')?.label || 'Assess',
  deploy: JOURNEY_PHASES.find((phase) => phase.id === 'deploy')?.label || 'Deploy',
};

export function defaultJourneyCopy(): JourneyCopy {
  return {
    documents: {
      badge: pair(ORIGINAL_DOCS_READY_NOTICE.badgeEn, ORIGINAL_DOCS_READY_NOTICE.badgeHi),
      title: pair(ORIGINAL_DOCS_READY_NOTICE.titleEn, ORIGINAL_DOCS_READY_NOTICE.titleHi),
      body: pair(ORIGINAL_DOCS_READY_NOTICE.bodyEn, ORIGINAL_DOCS_READY_NOTICE.bodyHi),
      items: ORIGINAL_DOCS_READY_NOTICE.items.map((item) => pair(item.en, item.hi)),
      continue: pair(ORIGINAL_DOCS_READY_NOTICE.continueEn, ORIGINAL_DOCS_READY_NOTICE.continueHi),
    },
    support: {
      comingUp: 'Coming up',
      dataSafeTitle: 'Your data is safe',
      dataSafeBullets: [
        'Documents are stored encrypted',
        'Used only for your emigration paperwork',
        'Never shared without your consent',
      ],
      helpTitle: 'Need help?',
      helpBody:
        'Stuck on this step? Your nearest E-Mitra partner can complete it with you, or contact SafeWork support from the Profile menu.',
      email: BUILTIN_CONTACT.email,
      whatsappDisplay: BUILTIN_CONTACT.whatsappDisplay,
      whatsappDigits: BUILTIN_CONTACT.whatsappDigits,
      officeAddress: BUILTIN_CONTACT.officeAddress,
      workingAddress: BUILTIN_CONTACT.workingAddress,
      footerAddresses: [...BUILTIN_CONTACT.footerAddresses],
    },
    emailGateSentence: 'Do not use a temporary mobile-login address. We send step updates from SafeWork Global.',
    quiz: {
      strongMin: 90,
      reviewMin: 50,
      strong: pair('Strong Basic Knowledge', 'अच्छा बुनियादी ज्ञान'),
      pass: pair('Basic Knowledge — Pass', 'बुनियादी ज्ञान — पास'),
      review: pair('Needs Review', 'समीक्षा आवश्यक'),
      insufficient: pair('Basic Knowledge Insufficient', 'बुनियादी ज्ञान अपर्याप्त'),
      screeningPassed: pair('Basic Trade Knowledge Screening: PASSED', 'बेसिक ट्रेड नॉलेज स्क्रीनिंग: पास'),
      screeningFailed: pair('Basic Trade Knowledge Screening: NOT PASSED', 'बेसिक ट्रेड नॉलेज स्क्रीनिंग: पास नहीं'),
    },
    phases: { ...BUILTIN_PHASES },
    stages: Object.fromEntries(
      Object.entries(BUILTIN_STAGES).map(([id, labels]) => [id, { ...labels }]),
    ) as JourneyCopy['stages'],
  };
}

function text(value: unknown, fallback: string): string {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function enHi(value: unknown, fallback: EnHi): EnHi {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return { en: text(row.en, fallback.en), hi: text(row.hi, fallback.hi) };
}

function clampScore(value: unknown, fallback: number): number {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 100) return fallback;
  return score;
}

export function mapJourneyCopy(value: unknown): JourneyCopy {
  const defaults = defaultJourneyCopy();
  const row = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const documents = row.documents && typeof row.documents === 'object' ? (row.documents as Record<string, unknown>) : {};
  const support = row.support && typeof row.support === 'object' ? (row.support as Record<string, unknown>) : {};
  const quiz = row.quiz && typeof row.quiz === 'object' ? (row.quiz as Record<string, unknown>) : {};
  const phases = row.phases && typeof row.phases === 'object' ? (row.phases as Record<string, unknown>) : {};
  const stages = row.stages && typeof row.stages === 'object' ? (row.stages as Record<string, unknown>) : {};
  const items = Array.isArray(documents.items) ? documents.items : [];
  const bullets = Array.isArray(support.dataSafeBullets)
    ? support.dataSafeBullets.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const footer = Array.isArray(support.footerAddresses)
    ? support.footerAddresses.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const digits = String(support.whatsappDigits || '').replace(/\D/g, '');
  let strongMin = clampScore(quiz.strongMin, defaults.quiz.strongMin);
  let reviewMin = clampScore(quiz.reviewMin, defaults.quiz.reviewMin);
  if (strongMin <= reviewMin) {
    strongMin = defaults.quiz.strongMin;
    reviewMin = defaults.quiz.reviewMin;
  }

  const mappedStages: JourneyCopy['stages'] = {};
  for (const [id, fallback] of Object.entries(BUILTIN_STAGES) as Array<[GccNavStepId, NavLabelCopy]>) {
    const saved = stages[id] && typeof stages[id] === 'object' ? (stages[id] as Record<string, unknown>) : {};
    mappedStages[id] = {
      label: text(saved.label, fallback.label),
      shortLabel: text(saved.shortLabel, fallback.shortLabel),
      navLabel: text(saved.navLabel, fallback.navLabel),
    };
  }

  return {
    documents: {
      badge: enHi(documents.badge, defaults.documents.badge),
      title: enHi(documents.title, defaults.documents.title),
      body: enHi(documents.body, defaults.documents.body),
      items: defaults.documents.items.map((fallback, index) => enHi(items[index], fallback)),
      continue: enHi(documents.continue, defaults.documents.continue),
    },
    support: {
      comingUp: text(support.comingUp, defaults.support.comingUp),
      dataSafeTitle: text(support.dataSafeTitle, defaults.support.dataSafeTitle),
      dataSafeBullets: bullets.length ? bullets : [...defaults.support.dataSafeBullets],
      helpTitle: text(support.helpTitle, defaults.support.helpTitle),
      helpBody: text(support.helpBody, defaults.support.helpBody),
      email: text(support.email, defaults.support.email),
      whatsappDisplay: text(support.whatsappDisplay, defaults.support.whatsappDisplay),
      whatsappDigits: digits.length >= 8 ? digits : defaults.support.whatsappDigits,
      officeAddress: text(support.officeAddress, defaults.support.officeAddress),
      workingAddress: text(support.workingAddress, defaults.support.workingAddress),
      footerAddresses: footer.length ? footer : [...defaults.support.footerAddresses],
    },
    emailGateSentence: text(row.emailGateSentence, defaults.emailGateSentence),
    quiz: {
      strongMin,
      reviewMin,
      strong: enHi(quiz.strong, defaults.quiz.strong),
      pass: enHi(quiz.pass, defaults.quiz.pass),
      review: enHi(quiz.review, defaults.quiz.review),
      insufficient: enHi(quiz.insufficient, defaults.quiz.insufficient),
      screeningPassed: enHi(quiz.screeningPassed, defaults.quiz.screeningPassed),
      screeningFailed: enHi(quiz.screeningFailed, defaults.quiz.screeningFailed),
    },
    phases: {
      profile: text(phases.profile, defaults.phases.profile),
      verify: text(phases.verify, defaults.phases.verify),
      assess: text(phases.assess, defaults.phases.assess),
      deploy: text(phases.deploy, defaults.phases.deploy),
    },
    stages: mappedStages,
  };
}

/** Push saved wording onto the live journey labels and support contacts. */
export function installJourneyCopy(copy: JourneyCopy) {
  for (const step of GCC_JOURNEY_NAV_STEPS) {
    const labels = copy.stages[step.id];
    if (!labels) continue;
    step.label = labels.label;
    step.shortLabel = labels.shortLabel;
    step.navLabel = labels.navLabel;
    const primary = step.stages[0];
    if (primary) VERIFICATION_STAGE_LABELS[primary] = labels.label;
    if (step.id === 'test3') {
      VERIFICATION_STAGE_LABELS.trade_test = labels.label;
      VERIFICATION_STAGE_LABELS.tests = labels.label;
    }
  }

  for (const phase of JOURNEY_PHASES) {
    phase.label = copy.phases[phase.id] || phase.label;
  }

  const digits = copy.support.whatsappDigits.replace(/\D/g, '');
  SAFEWORK_CONTACT.email = copy.support.email;
  SAFEWORK_CONTACT.whatsappDisplay = copy.support.whatsappDisplay;
  SAFEWORK_CONTACT.mobileDisplay = copy.support.whatsappDisplay;
  SAFEWORK_CONTACT.whatsappDigits = digits;
  SAFEWORK_CONTACT.mobileDigits = digits;
  SAFEWORK_CONTACT.whatsappUrl = `https://wa.me/${digits}`;
  SAFEWORK_CONTACT.mobileTel = `tel:+${digits}`;
  SAFEWORK_CONTACT.officeAddress = copy.support.officeAddress;
  SAFEWORK_CONTACT.workingAddress = copy.support.workingAddress;
  SAFEWORK_CONTACT.vestaOfficeAddresses = [...copy.support.footerAddresses];
}
