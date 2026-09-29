import { supabase } from '@/integrations/supabase/client';
import { isSyntheticAuthEmail } from '@/lib/workerAuthEmail';
import {
  devPortalAccountExists,
  isDevSharedMobileEnabled,
  type DevLoginPortal,
} from '@/lib/devSharedMobile';
import {
  AUTH_CONTINUE_MESSAGES,
  formatSignupIdentityError,
  mapAuthContinuePayload,
  type AuthContinueRequest,
  type AuthContinueResult,
  type AuthPortalRole,
} from '@/lib/authContinueCore';

export async function continueAuth(
  input: AuthContinueRequest & { devPortal?: DevLoginPortal },
): Promise<AuthContinueResult> {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  const mobile = input.mobile?.trim() ? input.mobile.replace(/\D/g, '').slice(-10) : null;

  if (isDevSharedMobileEnabled() && input.devPortal && mobile && !email) {
    const exists = await devPortalAccountExists(input.devPortal, mobile);
    return { ok: true, exists, nextStep: exists ? 'LOGIN' : 'SIGNUP' };
  }

  const { data, error } = await supabase.rpc('auth_continue', {
    p_email: email || undefined,
    p_phone: mobile || undefined,
    p_role: input.role,
  });

  if (error) {
    const message = error.message || '';
    if (/failed to fetch|network|timeout/i.test(message)) {
      return { ok: false, exists: false, nextStep: 'ERROR', error: AUTH_CONTINUE_MESSAGES.network };
    }
    return { ok: false, exists: false, nextStep: 'ERROR', error: AUTH_CONTINUE_MESSAGES.server };
  }

  return mapAuthContinuePayload(data);
}

function identityBlocksNewSignup(result: AuthContinueResult): boolean {
  return (
    result.nextStep === 'LOGIN' ||
    result.nextStep === 'WRONG_PORTAL' ||
    result.nextStep === 'ACCOUNT_CONFLICT'
  );
}

/**
 * Refuse a new account when this email or mobile already belongs to any user.
 * Checks each identifier on its own so the message names the one that is taken.
 */
export async function signupIdentityError(input: {
  role: AuthPortalRole;
  email?: string | null;
  mobile?: string | null;
  devPortal?: DevLoginPortal;
}): Promise<string | null> {
  const email = input.email?.trim().toLowerCase() || '';
  const mobile = input.mobile?.replace(/\D/g, '').slice(-10) || '';

  if (isDevSharedMobileEnabled() && input.devPortal && /^[6-9]\d{9}$/.test(mobile)) {
    const exists = await devPortalAccountExists(input.devPortal, mobile);
    if (!exists) return null;
    return 'This mobile already has a dev login for this portal. Sign in on this portal instead.';
  }
  let emailTaken = false;
  let mobileTaken = false;

  if (/^[6-9]\d{9}$/.test(mobile)) {
    const check = await continueAuth({ role: input.role, mobile });
    if (check.nextStep === 'ERROR' || check.nextStep === 'RATE_LIMITED') {
      return check.error || AUTH_CONTINUE_MESSAGES.server;
    }
    mobileTaken = identityBlocksNewSignup(check);
  }

  if (email.includes('@') && !isSyntheticAuthEmail(email)) {
    const check = await continueAuth({ role: input.role, email });
    if (check.nextStep === 'ERROR' || check.nextStep === 'RATE_LIMITED') {
      return check.error || AUTH_CONTINUE_MESSAGES.server;
    }
    emailTaken = identityBlocksNewSignup(check);
  }

  return formatSignupIdentityError({ emailTaken, mobileTaken });
}

export {
  AUTH_CONTINUE_MESSAGES,
  SIGNUP_IDENTITY_MESSAGES,
  buildAuthContinueRequest,
  formatSignupIdentityError,
  parseAuthIdentifier,
  portalAuthPath,
  type AuthContinueLocationState,
  type AuthContinueNextStep,
  type AuthContinueResult,
  type AuthIdentifierMethod,
  type AuthPortalRole,
} from '@/lib/authContinueCore';
