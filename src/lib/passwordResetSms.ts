import { supabase } from '@/integrations/supabase/client';

type SmsResetResponse = { ok?: boolean; error?: string };

async function invokeSmsReset(body: Record<string, unknown>): Promise<SmsResetResponse> {
  const { data, error } = await supabase.functions.invoke('reset-password-sms', { body });

  let payload: unknown = data;
  if ((!data || typeof data !== 'object') && error && 'context' in error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        payload = await ctx.json();
      }
    } catch {
      /* keep invoke error */
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as SmsResetResponse;
    if (typeof record.error === 'string' && record.error) {
      return { ok: false, error: record.error };
    }
    if (record.ok === true) return { ok: true };
    if (record.ok === false) {
      return { ok: false, error: record.error || 'Could not reset the password.' };
    }
  }

  if (error) {
    return { ok: false, error: error.message || 'Could not reset the password.' };
  }
  return { ok: false, error: 'Could not reset the password.' };
}

/** Confirm this mobile belongs to the caller's own account before sending an SMS. */
export async function prepareSmsPasswordReset(mobile: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await invokeSmsReset({ action: 'prepare', mobile });
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error || 'Could not reset the password.' };
}

/** Set a new password after the Firebase SMS code is verified. Does not sign the user in. */
export async function completeSmsPasswordReset(
  mobile: string,
  idToken: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await invokeSmsReset({ action: 'complete', mobile, idToken, password });
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error || 'Could not reset the password.' };
}
