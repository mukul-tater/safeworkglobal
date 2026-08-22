import { WORKER_SKILLS } from '@/modules/emitra/config/constants';

const SKILL_ALIASES: Array<{ skill: (typeof WORKER_SKILLS)[number]; needles: string[] }> = [
  { skill: 'HVAC Technician', needles: ['hvac', 'ac technician', 'air condition'] },
  { skill: 'Electrician', needles: ['electric'] },
  { skill: 'Plumber', needles: ['plumb'] },
  { skill: 'Welder', needles: ['weld', 'fabricat'] },
  { skill: 'Driver', needles: ['driver', 'driving'] },
  { skill: 'Mason', needles: ['mason', 'bricklayer'] },
  { skill: 'Carpenter', needles: ['carpent'] },
  { skill: 'Helper', needles: ['helper', 'labour', 'labor'] },
];

/** Map a job title/description/skills onto the worker Test 1 skill list. */
export function inferWorkerSkillFromJob(
  title: string,
  description = '',
  jobSkills: string[] = [],
): (typeof WORKER_SKILLS)[number] {
  const haystack = `${title} ${description} ${jobSkills.join(' ')}`.toLowerCase();

  const exact = WORKER_SKILLS.find(
    (skill) => skill !== 'Other' && haystack.includes(skill.toLowerCase()),
  );
  if (exact) return exact;

  const fromListed = jobSkills.find((name) =>
    (WORKER_SKILLS as readonly string[]).includes(name),
  );
  if (fromListed) return fromListed as (typeof WORKER_SKILLS)[number];

  const alias = SKILL_ALIASES.find(({ needles }) => needles.some((n) => haystack.includes(n)));
  return alias?.skill ?? 'Other';
}
