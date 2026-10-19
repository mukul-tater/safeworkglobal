import { EUROPE_QUIZ_JOBS, inferEuropeQuizJob } from '@/lib/europeQuizJobs';
import { inferUaeListedJob, UAE_LISTED_JOBS, type UaeListedJob } from '@/lib/uaeListedJobs';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';

/** Skills that have a Test 1 question bank (UAE trades, Czech papers, Driver/Other fallbacks). */
export const QUIZ_SKILL_CODES = [...UAE_LISTED_JOBS, ...EUROPE_QUIZ_JOBS, 'Driver', 'Other'] as const;
export type QuizSkillCode = (typeof QUIZ_SKILL_CODES)[number];

const COARSE_SKILL_TO_QUIZ: Record<(typeof WORKER_SKILLS)[number], QuizSkillCode> = {
  Electrician: 'Electrician',
  Plumber: 'Plumber',
  Welder: 'Welder',
  Driver: 'Driver',
  Mason: 'Mason (tiles/marble)',
  Carpenter: 'Furniture Carpenter - Finishing, All Rounder',
  Helper: 'Construction Labour/Helper',
  'HVAC Technician': 'AC Technician',
  Other: 'Other',
};

export function isQuizSkillCode(value: string | null | undefined): value is QuizSkillCode {
  return !!value && (QUIZ_SKILL_CODES as readonly string[]).includes(value);
}

/**
 * Pick the Test 1 bank from the applied job when possible.
 * Czech listings with their own paper win first. Otherwise map a UAE trade,
 * then the coarse worker skill (Electrician / Helper / …).
 */
export function resolveQuizSkillCode(opts: {
  primarySkill?: string | null;
  jobTitle?: string | null;
  jobDescription?: string | null;
  country?: string | null;
  quizSkillCode?: string | null;
}): QuizSkillCode {
  const explicit = opts.quizSkillCode?.trim();
  if (explicit && isQuizSkillCode(explicit)) return explicit;

  const europe = inferEuropeQuizJob(explicit || opts.jobTitle || opts.primarySkill || '');
  if (europe) return europe;

  const listed = inferUaeListedJob(
    opts.jobTitle || explicit || '',
    opts.jobDescription || '',
    opts.country,
  );
  if (listed) return listed;

  if (explicit) return explicit as QuizSkillCode;

  const title = (opts.jobTitle || '').trim();
  if (title) return title as QuizSkillCode;

  const skill = (opts.primarySkill || '').trim();
  if (isQuizSkillCode(skill)) return skill;
  const listedFromSkill = inferUaeListedJob(skill);
  if (listedFromSkill) return listedFromSkill;
  if ((WORKER_SKILLS as readonly string[]).includes(skill)) {
    return COARSE_SKILL_TO_QUIZ[skill as (typeof WORKER_SKILLS)[number]];
  }
  return 'Other';
}

export function isUaeListedQuizSkill(skill: string): skill is UaeListedJob {
  return (UAE_LISTED_JOBS as readonly string[]).includes(skill);
}

const QUIZ_ITEM_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** CMS quiz rows use UUIDs; bundled JSON fallbacks use slugs like mason-1. */
export function isQuizItemUuid(id: string): boolean {
  return QUIZ_ITEM_UUID_RE.test(id);
}
