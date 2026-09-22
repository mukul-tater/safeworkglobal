import { supabase } from '@/integrations/supabase/client';

function readError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const error = (value as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) return error.trim();
  const message = (value as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  return null;
}

function alreadyRegisteredMessage(error: string): string {
  if (/already registered/i.test(error)) {
    return 'This email is already registered. Sign in instead.';
  }
  return error;
}

function serviceUpdatingMessage(message: string): boolean {
  return /not found|404|Failed to send a request/i.test(message);
}

async function invokeSignupEmailOtp(body: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('signup-email-otp', { body });
  let payload: unknown = data;
  if (error && 'context' in error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') payload = await ctx.json();
    } catch {
      /* keep invoke error */
    }
  }
  const bodyError = readError(payload);
  if (bodyError) throw new Error(alreadyRegisteredMessage(bodyError));
  if (error?.message) {
    if (serviceUpdatingMessage(error.message)) {
      throw new Error('Verification service is updating. Wait a minute and try again.');
    }
    throw new Error(error.message);
  }
  return payload;
}

export async function sendSignupEmailOtp(email: string): Promise<{ dev: boolean }> {
  const payload = await invokeSignupEmailOtp({
    action: 'send',
    email: email.trim().toLowerCase(),
  });
  if (!payload || typeof payload !== 'object' || (payload as { sent?: unknown }).sent !== true) {
    throw new Error('Could not send verification code. Please try again.');
  }
  const dev = Boolean((payload as { dev?: unknown }).dev);
  return { dev };
}

export async function verifySignupEmailOtp(email: string, otp: string): Promise<string> {
  const payload = await invokeSignupEmailOtp({
    action: 'verify',
    email: email.trim().toLowerCase(),
    otp: otp.replace(/\s/g, ''),
  });
  const ticket =
    payload && typeof payload === 'object' ? String((payload as { ticket?: unknown }).ticket || '') : '';
  if (!ticket) throw new Error('Could not verify email. Please try again.');
  return ticket;
}

export async function createEmailVerifiedEmployerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  ticket: string;
}): Promise<{ userId: string }> {
  const payload = await invokeSignupEmailOtp({
    action: 'create_employer',
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName.trim(),
    ticket: input.ticket,
  });
  const userId =
    payload && typeof payload === 'object'
      ? String((payload as { user_id?: unknown }).user_id || '')
      : '';
  if (!userId) throw new Error('Could not create account. Please try again.');
  return { userId };
}
