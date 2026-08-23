import { supabase } from '../integrations/supabase/client';

export type AuthPortalRole = 'worker' | 'employer' | 'partner';
export type AuthContinueNextStep =
  | 'LOGIN'
  | 'SIGNUP'
  | 'ACCOUNT_CONFLICT'
  | 'WRONG_PORTAL'
  | 'RATE_LIMITED'
  | 'ERROR';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function parseAuthIdentifier(raw: string):
  | { ok: true; method: 'email'; email: string; mobile: '' }
  | { ok: true; method: 'mobile'; email: ''; mobile: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Enter your mobile number or email to continue' };
  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address' };
    return { ok: true, method: 'email', email, mobile: '' };
  }
  const digits = trimmed.replace(/\D/g, '');
  const mobile = digits.length <= 10 ? digits : digits.slice(-10);
  if (!INDIAN_MOBILE.test(mobile)) {
    return { ok: false, error: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { ok: true, method: 'mobile', email: '', mobile };
}

export async function continueAuth(input: {
  role: AuthPortalRole;
  email?: string;
  mobile?: string;
}): Promise<{
  ok: boolean;
  exists: boolean;
  nextStep: AuthContinueNextStep;
  portal?: AuthPortalRole | null;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('auth_continue', {
    p_email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
    p_phone: input.mobile?.trim() ? input.mobile.replace(/\D/g, '').slice(-10) : null,
    p_role: input.role,
  });
  if (error) {
    return { ok: false, exists: false, nextStep: 'ERROR', error: 'Something went wrong. Please try again.' };
  }
  const payload = (data || {}) as Record<string, unknown>;
  const nextStep = String(payload.next_step || 'ERROR').toUpperCase() as AuthContinueNextStep;
  const portalRaw = typeof payload.portal === 'string' ? payload.portal : null;
  const portal =
    portalRaw === 'worker' || portalRaw === 'employer' || portalRaw === 'partner' ? portalRaw : null;
  if (nextStep === 'ACCOUNT_CONFLICT') {
    return {
      ok: true,
      exists: true,
      nextStep,
      error:
        'This mobile number and email belong to different accounts. Continue with only one identifier.',
    };
  }
  if (nextStep === 'WRONG_PORTAL') {
    return {
      ok: true,
      exists: true,
      nextStep,
      portal,
      error: portal
        ? `This account is registered on the ${portal} portal.`
        : 'This account is registered on a different SafeWork portal.',
    };
  }
  if (nextStep === 'RATE_LIMITED') {
    return { ok: false, exists: false, nextStep, error: 'Too many attempts. Please wait a few minutes.' };
  }
  return {
    ok: payload.ok !== false,
    exists: Boolean(payload.exists),
    nextStep: nextStep || 'ERROR',
    portal,
  };
}
