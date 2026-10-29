export const ONBOARDING_EMAIL_START = '2026-10-25T06:11:23Z'
export const ONBOARDING_ADMIN_EMAIL = 'mukul@safeworkglobal.com'

export function isNewOnboardingAccount(createdAt: string): boolean {
  return Date.parse(createdAt) >= Date.parse(ONBOARDING_EMAIL_START)
}

export function onboardingRole(role: string): 'worker' | 'employer' | 'partner' | null {
  return role === 'worker' || role === 'employer' || role === 'partner' ? role : null
}

export function onboardingUserEmail(email: string | null): string | null {
  const value = email?.trim().toLowerCase() || ''
  if (value.endsWith('@workers.safeworkglobal.app') || value.endsWith('@partners.safeworkglobal.app')) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null
}

export function onboardingDestination(role: string): string {
  if (role === 'worker') return 'https://safeworkglobal.com/worker/journey'
  if (role === 'employer') return 'https://safeworkglobal.com/employer/dashboard'
  return 'https://safeworkglobal.com/partner/dashboard'
}