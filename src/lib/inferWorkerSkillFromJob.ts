import { inferEuropeQuizJob } from '@/lib/europeQuizJobs';
import { getPublicJobTitle, inferUaeListedJob, UAE_LISTED_JOB_WORK } from '@/lib/uaeListedJobs';
import { WORKER_SKILLS } from '@/modules/emitra/config/constants';

const SKILL_ALIASES: Array<{ skill: (typeof WORKER_SKILLS)[number]; needles: string[] }> = [
  { skill: 'HVAC Technician', needles: ['hvac', 'ac technician', 'air condition'] },
  { skill: 'Electrician', needles: ['electric'] },
  { skill: 'Plumber', needles: ['pipe fitter', 'pipefitter', 'plumb'] },
  { skill: 'Welder', needles: ['weld', 'aluminium fixer', 'aluminum fixer', 'fabricat'] },
  { skill: 'Driver', needles: ['driver', 'driving'] },
  { skill: 'Mason', needles: ['mason', 'bricklayer', 'tile', 'marble', 'steel fixer', 'rebar'] },
  { skill: 'Carpenter', needles: ['shuttering', 'formwork', 'carpent'] },
  { skill: 'Helper', needles: ['construction labour', 'construction helper', 'civil helper', 'warehouse', 'supermarket', 'helper', 'labour', 'labor'] },
];

/** Map a job title/description/skills onto the applied UAE trade, else the coarse Test 1 list. */
export function inferWorkerSkillFromJob(
  title: string,
  description = '',
  jobSkills: string[] = [],
  country?: string | null,
): string {
  const listed = inferUaeListedJob(title, description, country);
  if (listed) return listed;

  const europeQuiz = inferEuropeQuizJob(title);
  if (europeQuiz) return europeQuiz;

  for (const skill of jobSkills) {
    const fromSkill = inferUaeListedJob(skill);
    if (fromSkill) return fromSkill;
  }

  const haystack = `${title} ${description} ${jobSkills.join(' ')}`.toLowerCase();

  const exact = WORKER_SKILLS.find(
    (skill) => skill !== 'Other' && haystack.includes(skill.toLowerCase()),
  );
  if (exact) return exact;

  const fromListed = jobSkills.find((name) =>
    (WORKER_SKILLS as readonly string[]).includes(name),
  );
  if (fromListed) return fromListed;

  const alias = SKILL_ALIASES.find(({ needles }) => needles.some((n) => haystack.includes(n)));
  return alias?.skill ?? 'Other';
}

/** Public label for the job the worker applied to. Admin title edits win over the trade id. */
export function appliedJobSkillLabel(
  primarySkill?: string | null,
  jobTitle?: string | null,
  jobDescription?: string | null,
  country?: string | null,
): string {
  const title = (jobTitle || '').trim();
  if (title) return getPublicJobTitle(title, jobDescription || '', country);

  const skill = (primarySkill || '').trim();
  if (!skill) return '—';
  if (skill === 'Helper' || skill === 'Other') return skill;
  return getPublicJobTitle(skill);
}

/** Activity shown in the skill-proof line (“welding”, “painting”). Falls back to “your work”. */
export function appliedJobWorkPhrase(
  primarySkill?: string | null,
  jobTitle?: string | null,
  jobDescription?: string | null,
  country?: string | null,
  storedPhrase?: string | null,
): string {
  const custom = storedPhrase?.trim();
  if (custom) return custom;

  const listedFromJob = inferUaeListedJob(jobTitle || '', jobDescription || '', country);
  if (listedFromJob) return UAE_LISTED_JOB_WORK[listedFromJob];

  const skill = (primarySkill || '').trim();
  const listedFromSkill = skill ? inferUaeListedJob(skill) : null;
  if (listedFromSkill) return UAE_LISTED_JOB_WORK[listedFromSkill];

  return 'your work';
}
