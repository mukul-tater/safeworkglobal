export type WorkerOtpLoginSession = {
  access_token: string;
  refresh_token: string;
};

function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const error = (value as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) return error.trim();
  const message = (value as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  return null;
}

export function parseWorkerOtpLoginPayload(
  data: unknown,
  invokeError: { message?: string } | null,
): { ok: true; session: WorkerOtpLoginSession } | { ok: false; error: string } {
  const bodyError = readErrorMessage(data);
  if (typeof data === 'object' && data && 'access_token' in data && 'refresh_token' in data) {
    const access = String((data as WorkerOtpLoginSession).access_token || '');
    const refresh = String((data as WorkerOtpLoginSession).refresh_token || '');
    if (access && refresh) {
      return { ok: true, session: { access_token: access, refresh_token: refresh } };
    }
  }
  if (bodyError) return { ok: false, error: bodyError };
  if (invokeError?.message) {
    if (/not found|404|Failed to send a request/i.test(invokeError.message)) {
      return { ok: false, error: 'Sign-in service is updating. Wait a minute and try again.' };
    }
    return { ok: false, error: invokeError.message };
  }
  return { ok: false, error: 'Could not sign in with OTP. Please try again.' };
}
