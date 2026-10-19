// Role-based smart templates for Quick Job Post auto-fill
// + Worker-Job matching algorithm (skill 40 / salary 20 / experience 20 / location 20)

import { getSiteContent, installDefaultTemplates, resolveStoredTemplate } from '@/lib/siteContent';

export interface JobTemplate {
  role: string;
  category: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  salaryMin: number;     // INR / month
  salaryMax: number;     // INR / month
  experienceLevel: 'ENTRY' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT';
  minYearsExperience: number;
}

/**
 * Templates keyed by normalized role string. Lookup is case-insensitive
 * and falls back to keyword matching (e.g. "Industrial Electrician" → electrician).
 */
export const JOB_TEMPLATES: Record<string, JobTemplate> = {
  electrician: {
    role: 'Electrician',
    category: 'Electrical',
    description:
      'Install, maintain and repair electrical wiring, fixtures and equipment in residential, commercial or industrial settings. Ensure compliance with safety codes.',
    responsibilities: [
      'Read blueprints and technical diagrams to plan layout of wiring and equipment',
      'Install and connect wiring, lighting, switchboards and distribution panels',
      'Diagnose faults using multimeters and other diagnostic tools',
      'Perform preventive maintenance and emergency repairs',
      'Follow site safety standards and use appropriate PPE at all times',
    ],
    requirements: [
      'ITI / Diploma in Electrical Trade',
      '3+ years of hands-on electrical experience',
      'Wireman license preferred',
      'Valid passport (for overseas placement)',
    ],
    skills: ['Electrical Wiring', 'Panel Installation', 'Fault Finding', 'Earthing', 'Electrical Safety'],
    salaryMin: 90000,
    salaryMax: 180000,
    experienceLevel: 'INTERMEDIATE',
    minYearsExperience: 3,
  },
  welder: {
    role: 'Welder',
    category: 'Welding',
    description:
      'Fabricate, join and repair metal components using MIG, TIG and ARC welding techniques. Work from drawings and meet quality / safety standards.',
    responsibilities: [
      'Set up welding equipment and select correct rods/wires for the job',
      'Read welding symbols and follow joint specifications',
      'Perform MIG / TIG / ARC welding on structural and pipe work',
      'Inspect welds for defects and rework where required',
      'Maintain a clean, safe workspace and comply with PPE standards',
    ],
    requirements: [
      'ITI Welder / Trade Test certificate',
      '3+ years welding experience',
      'Knowledge of welding symbols and metal grades',
      'Valid passport for overseas deployment',
    ],
    skills: ['MIG Welding', 'TIG Welding', 'ARC Welding', 'Blueprint Reading', 'Metal Fabrication'],
    salaryMin: 100000,
    salaryMax: 220000,
    experienceLevel: 'INTERMEDIATE',
    minYearsExperience: 3,
  },
  plumber: {
    role: 'Plumber',
    category: 'Plumbing',
    description:
      'Install, repair and maintain water supply, drainage and sanitary systems in residential and commercial buildings.',
    responsibilities: [
      'Lay out and install pipework using PPR, CPVC, GI and copper materials',
      'Install sanitary fittings, taps, water heaters and drainage systems',
      'Diagnose leaks, blockages and pressure issues and carry out repairs',
      'Test installations for leaks and proper flow',
      'Coordinate with site engineers and follow drawings',
    ],
    requirements: [
      'ITI Plumber Trade certificate',
      '3+ years field experience',
      'Knowledge of PPR / CPVC / GI pipework',
      'Valid passport for overseas placement',
    ],
    skills: ['Pipe Fitting', 'Drainage Systems', 'Water Supply Installation', 'Leak Repair', 'Sanitary Fitting'],
    salaryMin: 85000,
    salaryMax: 160000,
    experienceLevel: 'INTERMEDIATE',
    minYearsExperience: 3,
  },
  helper: {
    role: 'General Helper',
    category: 'Construction',
    description:
      'Assist tradesmen and site teams with material handling, basic site work and housekeeping. Entry-level role with on-the-job learning.',
    responsibilities: [
      'Carry, load and unload construction materials',
      'Assist masons, electricians, welders and other trades on site',
      'Keep work areas clean and free of hazards',
      'Operate basic hand tools under supervision',
      'Follow safety instructions and wear PPE at all times',
    ],
    requirements: [
      'No formal qualifications required',
      'Physical fitness and willingness to work outdoors',
      'Basic Hindi / English communication',
      'Valid passport for overseas deployment',
    ],
    skills: ['Manual Labour', 'Material Handling', 'Site Cleaning', 'Tool Assistance'],
    salaryMin: 80000,
    salaryMax: 110000,
    experienceLevel: 'ENTRY',
    minYearsExperience: 0,
  },
  driver: {
    role: 'Driver',
    category: 'Delivery & Logistics',
    description:
      'Operate light or heavy vehicles to transport goods or personnel safely and on schedule. Maintain vehicle and follow traffic regulations.',
    responsibilities: [
      'Drive assigned vehicle on planned routes safely and on time',
      'Load and unload goods carefully, verify documents',
      'Perform daily vehicle checks (oil, tyres, brakes, lights)',
      'Maintain trip logs and report incidents promptly',
      'Follow GCC traffic rules and company driving standards',
    ],
    requirements: [
      'Valid GCC light / heavy vehicle driving license',
      '2+ years professional driving experience',
      'Clean driving record',
      'Basic English communication',
    ],
    skills: ['Vehicle Driving', 'Route Navigation', 'GPS Usage', 'Vehicle Maintenance', 'Safety Compliance'],
    salaryMin: 90000,
    salaryMax: 150000,
    experienceLevel: 'INTERMEDIATE',
    minYearsExperience: 2,
  },
};

/**
 * Resolve a free-text role to a template using exact key, then keyword fallback.
 */
export function resolveTemplate(role: string): JobTemplate | null {
  if (!role) return null;
  const stored = resolveStoredTemplate(role);
  if (getSiteContent().fromDatabase || stored) return stored;
  const key = role.toLowerCase().trim();
  if (JOB_TEMPLATES[key]) return JOB_TEMPLATES[key];

  const keywords: Array<[string, keyof typeof JOB_TEMPLATES]> = [
    ['electric', 'electrician'],
    ['weld', 'welder'],
    ['plumb', 'plumber'],
    ['pipe', 'plumber'],
    ['driver', 'driver'],
    ['helper', 'helper'],
    ['labour', 'helper'],
    ['labor', 'helper'],
  ];
  for (const [needle, k] of keywords) {
    if (key.includes(needle)) return JOB_TEMPLATES[k];
  }
  return null;
}

const TEMPLATE_KEYWORDS: Record<string, string[]> = {
  electrician: ['electric'],
  welder: ['weld'],
  plumber: ['plumb', 'pipe'],
  driver: ['driver'],
  helper: ['helper', 'labour', 'labor'],
};

installDefaultTemplates(JOB_TEMPLATES, TEMPLATE_KEYWORDS);

// ---------- MATCHING ENGINE ----------

export interface WorkerForMatch {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  primary_work_type?: string | null;
  years_of_experience?: number | null;
  expected_salary_min?: number | null;
  expected_salary_max?: number | null;
  current_location?: string | null;
  nationality?: string | null;
  open_to_relocation?: boolean | null;
  visa_countries?: string[] | null;
  top_skills?: string[] | null;
}

export interface JobForMatch {
  title: string;
  skills: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  min_years_experience: number;
  country: string;
}

export interface MatchResult {
  worker: WorkerForMatch;
  score: number;          // 0-100
  breakdown: {
    skill: number;        // 0-40
    salary: number;       // 0-20
    experience: number;   // 0-20
    location: number;     // 0-20
  };
  reasons: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function skillScore(jobSkills: string[], workerSkills: string[], jobTitle: string): number {
  if (jobSkills.length === 0) return 20; // partial credit when job has no skills listed
  const wSet = new Set(workerSkills.map(norm));
  const titleNorm = norm(jobTitle);
  let hits = 0;
  for (const s of jobSkills) {
    const n = norm(s);
    if (wSet.has(n)) { hits++; continue; }
    // partial substring match
    for (const w of wSet) {
      if (w.includes(n) || n.includes(w)) { hits++; break; }
    }
  }
  // Bonus if any worker skill matches the job title family
  const titleHit = [...wSet].some((w) => titleNorm.includes(w) || w.includes(titleNorm.slice(0, 6)));
  const ratio = hits / jobSkills.length;
  return Math.min(40, Math.round(ratio * 40 + (titleHit ? 4 : 0)));
}

function salaryScore(job: JobForMatch, worker: WorkerForMatch): number {
  const jMin = job.salary_min ?? 0;
  const jMax = job.salary_max ?? jMin;
  const wMin = worker.expected_salary_min ?? 0;
  const wMax = (worker.expected_salary_max ?? wMin) || jMax;
  if (!jMax || !wMin) return 10; // unknown → neutral
  // Overlap of two ranges
  const overlap = Math.max(0, Math.min(jMax, wMax) - Math.max(jMin, wMin));
  const span = Math.max(1, wMax - wMin);
  if (overlap > 0) return 20;
  // Worker expects only slightly more
  if (wMin <= jMax * 1.15) return 14;
  if (wMin <= jMax * 1.3) return 8;
  return 0;
}

function experienceScore(job: JobForMatch, worker: WorkerForMatch): number {
  const need = job.min_years_experience ?? 0;
  const have = worker.years_of_experience ?? 0;
  if (need === 0) return have >= 0 ? 20 : 0;
  if (have >= need) return 20;
  if (have >= need - 1) return 14;
  if (have >= need - 2) return 8;
  return 0;
}

function locationScore(job: JobForMatch, worker: WorkerForMatch): number {
  const country = norm(job.country || '');
  const visa = (worker.visa_countries || []).map(norm);
  if (visa.includes(country)) return 20;
  if (worker.open_to_relocation) return 14;
  // Same-country worker (rare for overseas roles, but counted)
  if (worker.current_location && norm(worker.current_location).includes(country)) return 18;
  return 4;
}

export function scoreWorker(job: JobForMatch, worker: WorkerForMatch): MatchResult {
  const skill = skillScore(job.skills, worker.top_skills || [], job.title);
  const salary = salaryScore(job, worker);
  const experience = experienceScore(job, worker);
  const location = locationScore(job, worker);
  const score = skill + salary + experience + location;

  const reasons: string[] = [];
  if (skill >= 28) reasons.push('Strong skill match');
  else if (skill >= 16) reasons.push('Partial skill match');
  if (salary >= 18) reasons.push('Salary in range');
  if (experience >= 18) reasons.push(`${worker.years_of_experience || 0}+ yrs experience`);
  if (location >= 18) reasons.push(`${job.country} ready`);
  else if (location >= 12) reasons.push('Open to relocate');

  return {
    worker,
    score,
    breakdown: { skill, salary, experience, location },
    reasons,
  };
}

export function rankWorkers(job: JobForMatch, workers: WorkerForMatch[], limit = 10): MatchResult[] {
  return workers
    .map((w) => scoreWorker(job, w))
    // Mandatory skill: at least some skill signal (>0)
    .filter((m) => m.breakdown.skill > 0 || job.skills.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}