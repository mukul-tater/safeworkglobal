import type { JobListItem } from '@/components/jobs/JobResultCard';

/**
 * Local-only Welder in Germany so Find Jobs comparison can be tried.
 * It is not saved in the database and does not appear in a production build.
 * Delete this file, and the imports in Jobs.tsx and JobDetail.tsx, to remove it.
 */
export const DEV_COMPARE_JOB_SLUG = 'dev-test-welder-germany';

const BENEFITS = ['Housing allowance', 'Meal voucher', '8 hours a day'].join('\n');

export function isDevCompareJob(slug?: string | null): boolean {
  return slug === DEV_COMPARE_JOB_SLUG;
}

export function devCompareJobRecord() {
  return {
    id: 'dev-test-welder-germany',
    title: 'Welder',
    description:
      'Welder openings in Berlin, Germany. This listing is only on the local dev app so you can compare it with the UAE Welder.',
    location: 'Berlin',
    country: 'Germany',
    salary_min: 80000,
    salary_max: 95000,
    currency: 'INR',
    job_type: 'FULL_TIME',
    status: 'ACTIVE',
    employer_id: '',
    experience_level: 'INTERMEDIATE',
    benefits: BENEFITS,
    requirements: null as string | null,
    responsibilities: 'Weld steel to drawings\nFollow site safety rules',
    visa_sponsorship: true,
    posted_at: '2026-10-04T00:00:00.000Z',
    slug: DEV_COMPARE_JOB_SLUG,
    posted_by_role: 'admin',
    service_charge: 20000,
    job_skills: [{ skill_name: 'ARC Welding' }],
  };
}

export function devCompareListItem(): JobListItem | null {
  if (!import.meta.env.DEV) return null;
  const job = devCompareJobRecord();
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    company: '',
    companyLogoUrl: null,
    city: job.location,
    location: `${job.location}, ${job.country}`,
    country: job.country,
    benefits: job.benefits,
    salaryDisplay: null,
    rawSalaryMin: job.salary_min,
    rawSalaryMax: job.salary_max,
    currency: job.currency,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    type: 'Full-time',
    category: 'Welder',
    experienceLevel: job.experience_level,
    visaSponsorship: job.visa_sponsorship,
    postedAt: new Date(job.posted_at),
    description: job.description,
    skills: job.job_skills.map((skill) => skill.skill_name),
    serviceCharge: job.service_charge,
    useStoredSalary: true,
  };
}
