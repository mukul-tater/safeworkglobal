import { supabase } from '@/integrations/supabase/client';

function readInvokeError(error: unknown, data: unknown, fallback: string): Error {
  const payload = data as { error?: string } | null;
  if (payload?.error) return new Error(payload.error);
  if (error instanceof Error && error.message && error.message !== 'Edge Function returned a non-2xx status code') {
    return new Error(error.message);
  }
  return new Error(fallback);
}

export async function sendAadhaarOtp(aadhaarNumber: string): Promise<{ last4: string; mock: boolean }> {
  const { data, error } = await supabase.functions.invoke('aadhaar-otp', {
    body: { action: 'send_otp', aadhaar_number: aadhaarNumber },
  });
  if (error || (data as { error?: string } | null)?.error) {
    throw readInvokeError(error, data, 'Could not send Aadhaar OTP');
  }
  const payload = data as { last4?: string; mock?: boolean } | null;
  if (!payload?.last4) throw new Error('Could not send Aadhaar OTP');
  return { last4: payload.last4, mock: Boolean(payload.mock) };
}

export async function verifyAadhaarOtp(otp: string): Promise<{ last4: string; name?: string | null; mock: boolean }> {
  const { data, error } = await supabase.functions.invoke('aadhaar-otp', {
    body: { action: 'verify_otp', otp },
  });
  if (error || (data as { error?: string } | null)?.error) {
    throw readInvokeError(error, data, 'Could not verify Aadhaar OTP');
  }
  const payload = data as { last4?: string; name?: string | null; mock?: boolean } | null;
  if (!payload?.last4) throw new Error('Could not verify Aadhaar OTP');
  return { last4: payload.last4, name: payload.name, mock: Boolean(payload.mock) };
}
