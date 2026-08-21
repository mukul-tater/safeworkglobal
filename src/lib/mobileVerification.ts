import type { AppRole } from '@/contexts/AuthContext';

export function bindMobilePath(role: AppRole | null | undefined): string {
  if (role === 'employer') return '/employer/bind-mobile';
  if (role === 'partner') return '/partner/bind-mobile';
  return '/worker/bind-mobile';
}

export function afterMobileVerifiedPath(role: AppRole | null | undefined): string {
  if (role === 'employer') return '/employer/quick-signup';
  if (role === 'partner') return '/partner/dashboard';
  return '/worker/journey';
}

export function bindMobileLoginPath(role: AppRole | null | undefined): string {
  if (role === 'employer') return '/employer/login';
  if (role === 'partner') return '/partner/login';
  return '/worker/login';
}

export const MOBILE_OTP_ROLES: AppRole[] = ['worker', 'employer', 'partner'];
