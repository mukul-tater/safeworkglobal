export type AuthPortalRole = 'worker' | 'employer' | 'partner';

export type AuthContinueNextStep =
  | 'LOGIN'
  | 'SIGNUP'
  | 'ACCOUNT_CONFLICT'
  | 'WRONG_PORTAL'
  | 'RATE_LIMITED'
  | 'ERROR';

export type AuthIdentifierMethod = 'mobile' | 'email';

export type ParsedAuthIdentifier =
  | { ok: true; method: 'email'; email: string; mobile: ''; error?: undefined }
  | { ok: true; method: 'mobile'; email: ''; mobile: string; error?: undefined }
  | { ok: false; method?: undefined; error: string };

export type AuthContinueRequest = {
  role: AuthPortalRole;
  email?: string;
  mobile?: string;
};

export type AuthContinueResult = {
  ok: boolean;
  exists: boolean;
  nextStep: AuthContinueNextStep;
  portal?: AuthPortalRole | null;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(normalizeIndianMobile(value));
}

export const AUTH_CONTINUE_MESSAGES = {
  empty: 'Enter your mobile number or email to continue',
  invalid_email: 'Enter a valid email address',
  invalid_mobile: 'Enter a valid 10-digit Indian mobile number',
  invalid_role: 'Choose a portal to continue',
  network: 'Network error. Check your connection and try again.',
  server: 'Something went wrong. Please try again.',
  rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
  conflict:
    'This mobile number and email belong to different accounts. Continue with only one identifier — we will not merge or overwrite either account.',
  wrong_portal: (portal?: AuthPortalRole | null) =>
    portal
      ? `This account is registered on the ${portal} portal. Continue there instead.`
      : 'This account is registered on a different SafeWork portal. Continue from the portal you originally used.',
} as const;

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseAuthIdentifier(raw: string): ParsedAuthIdentifier {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: AUTH_CONTINUE_MESSAGES.empty };
  }

  if (trimmed.includes('@')) {
    const email = normalizeAuthEmail(trimmed);
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: AUTH_CONTINUE_MESSAGES.invalid_email };
    }
    return { ok: true, method: 'email', email, mobile: '' };
  }

  const mobile = normalizeIndianMobile(trimmed);
  if (!isValidIndianMobile(mobile)) {
    return { ok: false, error: AUTH_CONTINUE_MESSAGES.invalid_mobile };
  }
  return { ok: true, method: 'mobile', email: '', mobile };
}

export function buildAuthContinueRequest(
  role: AuthPortalRole,
  method: AuthIdentifierMethod,
  email: string,
  mobile: string,
): { request: AuthContinueRequest } | { error: string } {
  if (method === 'email') {
    const parsed = parseAuthIdentifier(email);
    if (!parsed.ok) return { error: parsed.error };
    if (parsed.method !== 'email') return { error: AUTH_CONTINUE_MESSAGES.invalid_email };
    return { request: { role, email: parsed.email } };
  }

  const parsed = parseAuthIdentifier(mobile);
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.method !== 'mobile') return { error: AUTH_CONTINUE_MESSAGES.invalid_mobile };
  return { request: { role, mobile: parsed.mobile } };
}

export function mapAuthContinuePayload(raw: unknown): AuthContinueResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, exists: false, nextStep: 'ERROR', error: AUTH_CONTINUE_MESSAGES.server };
  }

  const data = raw as Record<string, unknown>;
  const nextRaw = String(data.next_step || data.nextStep || 'ERROR').toUpperCase();
  const nextStep = (
    ['LOGIN', 'SIGNUP', 'ACCOUNT_CONFLICT', 'WRONG_PORTAL', 'RATE_LIMITED', 'ERROR'] as const
  ).includes(nextRaw as AuthContinueNextStep)
    ? (nextRaw as AuthContinueNextStep)
    : 'ERROR';

  const portalRaw = typeof data.portal === 'string' ? data.portal : null;
  const portal =
    portalRaw === 'worker' || portalRaw === 'employer' || portalRaw === 'partner' ? portalRaw : null;

  const errorCode = typeof data.error === 'string' ? data.error : '';
  const error =
    nextStep === 'RATE_LIMITED'
      ? AUTH_CONTINUE_MESSAGES.rate_limited
      : nextStep === 'ACCOUNT_CONFLICT'
        ? AUTH_CONTINUE_MESSAGES.conflict
        : nextStep === 'WRONG_PORTAL'
          ? AUTH_CONTINUE_MESSAGES.wrong_portal(portal)
          : errorCode === 'empty'
            ? AUTH_CONTINUE_MESSAGES.empty
            : errorCode === 'invalid_email'
              ? AUTH_CONTINUE_MESSAGES.invalid_email
              : errorCode === 'invalid_mobile'
                ? AUTH_CONTINUE_MESSAGES.invalid_mobile
                : errorCode === 'invalid_role'
                  ? AUTH_CONTINUE_MESSAGES.invalid_role
                  : nextStep === 'ERROR'
                    ? AUTH_CONTINUE_MESSAGES.server
                    : undefined;

  return {
    ok: data.ok !== false && nextStep !== 'ERROR' && nextStep !== 'RATE_LIMITED',
    exists: Boolean(data.exists),
    nextStep,
    portal,
    error,
  };
}

export function portalAuthPath(role: AuthPortalRole): string {
  if (role === 'employer') return '/employer/login';
  if (role === 'partner') return '/partner/login';
  return '/worker/login';
}

export type AuthContinueLocationState = {
  email?: string;
  mobile?: string;
  method?: AuthIdentifierMethod;
};
