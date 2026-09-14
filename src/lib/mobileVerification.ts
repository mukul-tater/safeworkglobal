import type { AppRole } from '@/contexts/AuthContext';
import { COMING_SOON_PATHS, USERS_ONLY_LAUNCH } from '@/lib/launchGate';

export function bindMobilePath(role: AppRole | null | undefined): string {
  if (USERS_ONLY_LAUNCH) {
    if (role === 'employer') return COMING_SOON_PATHS.employer;
    if (role === 'partner') return COMING_SOON_PATHS.partner;
  }
  if (role === 'employer') return '/employer/bind-mobile';
  if (role === 'partner') return '/partner/bind-mobile';
  return '/worker/bind-mobile';
}

export function afterMobileVerifiedPath(role: AppRole | null | undefined): string {
  if (USERS_ONLY_LAUNCH) {
    if (role === 'employer') return COMING_SOON_PATHS.employer;
    if (role === 'partner') return COMING_SOON_PATHS.partner;
  }
  if (role === 'employer') return '/employer/quick-signup';
  if (role === 'partner') return '/partner/dashboard';
  return '/worker/journey';
}

export function bindMobileLoginPath(role: AppRole | null | undefined): string {
  if (USERS_ONLY_LAUNCH) {
    if (role === 'employer') return COMING_SOON_PATHS.employer;
    if (role === 'partner') return COMING_SOON_PATHS.partner;
  }
  if (role === 'employer') return '/employer/login';
  if (role === 'partner') return '/partner/login';
  return '/worker/login';
}

export const MOBILE_OTP_ROLES: AppRole[] = ['worker', 'employer', 'partner'];
