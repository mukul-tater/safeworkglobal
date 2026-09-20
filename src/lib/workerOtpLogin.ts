import { supabase } from '@/integrations/supabase/client';
import { normalizeIndianMobile } from '@/lib/validations/common';
import {
  parseWorkerOtpLoginPayload,
  type WorkerOtpLoginSession,
} from '@/lib/workerOtpLoginCore';

export type { WorkerOtpLoginSession } from '@/lib/workerOtpLoginCore';
export { parseWorkerOtpLoginPayload } from '@/lib/workerOtpLoginCore';

/** After Firebase (or local) OTP succeeds, mint a worker Supabase session. */
export async function exchangeWorkerOtpLogin(
  mobile: string,
  idToken: string,
): Promise<WorkerOtpLoginSession> {
  const digits = normalizeIndianMobile(mobile);
  const { data, error } = await supabase.functions.invoke('worker-otp-login', {
    body: { mobile: digits, idToken },
  });

  let payload: unknown = data;
  if ((!data || typeof data !== 'object' || !('access_token' in data)) && error && 'context' in error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        payload = await ctx.json();
      }
    } catch {
      /* keep invoke error */
    }
  }

  const parsed = parseWorkerOtpLoginPayload(payload, error);
  if (parsed.ok === false) throw new Error(parsed.error);
  return parsed.session;
}
