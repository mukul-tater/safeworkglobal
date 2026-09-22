import { inferUaeListedJob, listedJobDisplayName } from '@/lib/uaeListedJobs';
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
): string {
  const listed = inferUaeListedJob(title, description);
  if (listed) return listed;

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

/** Public label for the job the worker applied to (never collapse Cleaner to Helper). */
export function appliedJobSkillLabel(
  primarySkill?: string | null,
  jobTitle?: string | null,
  jobDescription?: string | null,
): string {
  const listedFromJob = inferUaeListedJob(jobTitle || '', jobDescription || '');
  if (listedFromJob) return listedJobDisplayName(listedFromJob);

  const skill = (primarySkill || '').trim();
  if (!skill) return '—';
  // Helper/Other were a coarse bucket for many trades — don't relabel as labour.
  if (skill === 'Helper' || skill === 'Other') return skill;

  const listedFromSkill = inferUaeListedJob(skill);
  if (listedFromSkill) return listedJobDisplayName(listedFromSkill);
  return skill;
}
