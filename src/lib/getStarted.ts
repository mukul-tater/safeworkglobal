export const GET_STARTED_PATHS = {
  worker: '/worker/login',
  employer: '/employer/login',
  partner: '/partner/register',
} as const;

export const PARTNER_EXISTING_ACCOUNT_PATH = '/partner/login';

const PUBLIC_AUTH_PATHS = [
  '/auth',
  '/worker/login',
  '/worker/quick-signup',
  '/worker/bind-mobile',
  '/employer/login',
  '/employer/quick-signup',
  '/employer/bind-mobile',
  '/partner/login',
  '/partner/register',
  '/partner/register-ssvn',
  '/partner/register-iti',
  '/partner/register-srn',
  '/partner/register-consultant',
  '/partner/register-legacy',
  '/emitra/login',
  '/emitra/register',
  '/partner/ssvn/login',
  '/partner/iti/login',
  '/partner/srn/login',
  '/partner/consultant/login',
] as const;

const DASHBOARD_PREFIXES = [
  '/worker/',
  '/employer/',
  '/admin/',
  '/partner/',
  '/emitra/',
  '/interviewer/',
] as const;

function matchesPath(pathname: string, candidate: string): boolean {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

/** Public continue / signup / login screens — keep Home / Jobs / Get Started. */
export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => matchesPath(pathname, path));
}

/** Hide the marketing bottom nav on signed-in portal chrome, not on public auth. */
export function hideMobileBottomNav(pathname: string): boolean {
  if (isPublicAuthPath(pathname)) return false;
  return DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
