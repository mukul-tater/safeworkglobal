/** Workers, admin, and E-Mitra partners are live. Employer and interviewer portals show Coming Soon. */
export const USERS_ONLY_LAUNCH = true;

export type ComingSoonAudience = 'employer' | 'partner' | 'interviewer';

export const COMING_SOON_PATHS = {
  employer: '/coming-soon/employers',
  partner: '/coming-soon/partners',
  interviewer: '/coming-soon/interviewers',
} as const;

export function comingSoonPathForRole(role: string | null | undefined): string | null {
  if (role === 'employer') return COMING_SOON_PATHS.employer;
  if (role === 'interviewer') return COMING_SOON_PATHS.interviewer;
  return null;
}

export function isGatedLaunchRole(role: string | null | undefined): boolean {
  return comingSoonPathForRole(role) != null;
}

/** Employer-facing chrome (homepage, hire CTAs). Off during the users-only launch. */
export function showEmployerChrome(role: string | null | undefined): boolean {
  return role === 'employer' && !USERS_ONLY_LAUNCH;
}
