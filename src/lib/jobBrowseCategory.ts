import { JOB_CATEGORIES } from './constants';
import { inferUaeListedJob, isSecurityGuardTitle } from './uaeListedJobs';

export function jobBrowseCategory(
  title: string,
  description: string,
  country: string,
  savedCategory?: string | null,
  applicantType?: string | null,
): string {
  if (isSecurityGuardTitle(title)) return 'Security Guard';
  const trade = inferUaeListedJob(title.replace(/\s*\/\s*/g, '/'), description, country, applicantType);
  return trade
    || savedCategory?.trim()
    || JOB_CATEGORIES.find((category) => category !== 'All Categories' && `${title} ${description}`.toLowerCase().includes(category.toLowerCase()))
    || 'Other';
}