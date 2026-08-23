import { supabase } from '@/integrations/supabase/client';
import {
  AUTH_CONTINUE_MESSAGES,
  mapAuthContinuePayload,
  type AuthContinueRequest,
  type AuthContinueResult,
} from '@/lib/authContinueCore';

export async function continueAuth(input: AuthContinueRequest): Promise<AuthContinueResult> {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  const mobile = input.mobile?.trim() ? input.mobile.replace(/\D/g, '').slice(-10) : null;

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

export {
  AUTH_CONTINUE_MESSAGES,
  buildAuthContinueRequest,
  parseAuthIdentifier,
  portalAuthPath,
  type AuthContinueLocationState,
  type AuthContinueNextStep,
  type AuthContinueResult,
  type AuthIdentifierMethod,
  type AuthPortalRole,
} from '@/lib/authContinueCore';
