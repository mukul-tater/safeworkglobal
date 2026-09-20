import { supabase } from '@/integrations/supabase/client';

export type PhoneVerifiedAccountResult = {
  userId: string;
  mobile: string;
};

function readError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const error = (value as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) return error.trim();
  const message = (value as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  return null;
}

async function invokePhoneVerifiedAccount(
  body: Record<string, unknown>,
): Promise<PhoneVerifiedAccountResult> {
  const { data, error } = await supabase.functions.invoke('phone-verified-account', { body });
  let payload: unknown = data;
  if ((!data || typeof data !== 'object' || !('user_id' in (data as object))) && error && 'context' in error) {
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') payload = await ctx.json();
    } catch {
      /* keep invoke error */
    }
  }
  const bodyError = readError(payload);
  if (payload && typeof payload === 'object' && 'user_id' in payload) {
    const userId = String((payload as { user_id?: string }).user_id || '');
    const mobile = String((payload as { mobile?: string }).mobile || '');
    if (userId) return { userId, mobile };
  }
  if (bodyError) {
    if (/already registered/i.test(bodyError)) {
      throw new Error('This email or mobile is already registered. Sign in instead.');
    }
    throw new Error(bodyError);
  }
  if (error?.message) {
    if (/not found|404|Failed to send a request/i.test(error.message)) {
      throw new Error('Verification service is updating. Wait a minute and try again.');
    }
    throw new Error(error.message);
  }
  throw new Error('Could not complete mobile verification. Please try again.');
}

export async function createPhoneVerifiedWorkerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  mobile: string;
  idToken: string;
}): Promise<PhoneVerifiedAccountResult> {
  return invokePhoneVerifiedAccount({
    action: 'create_worker',
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    mobile: input.mobile,
    idToken: input.idToken,
  });
}

export async function createPhoneVerifiedPartnerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  mobile: string;
  idToken: string;
}): Promise<PhoneVerifiedAccountResult> {
  return invokePhoneVerifiedAccount({
    action: 'create_partner',
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    mobile: input.mobile,
    idToken: input.idToken,
  });
}

export async function bindVerifiedMobile(input: {
  mobile: string;
  idToken: string;
}): Promise<PhoneVerifiedAccountResult> {
  return invokePhoneVerifiedAccount({
    action: 'bind_mobile',
    mobile: input.mobile,
    idToken: input.idToken,
  });
}
