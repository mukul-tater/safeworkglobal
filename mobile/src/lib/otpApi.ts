import { ENV } from '../config/env';
import { normalizeIndianMobileDigits } from './workerAuthEmail';

type OtpSendResult = { success: boolean; demo?: boolean; message?: string; error?: string };
type OtpVerifyResult = { success: boolean; otpToken?: string; error?: string };

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!ENV.API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured in mobile/.env');
  }
  const res = await fetch(`${ENV.API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.message || data.error || `Request failed (${res.status})`));
  }
  return data as T;
}

/** MSG91 OTP via GigBridge backend — used when Firebase native SDK is not wired. */
export async function sendWorkerOtp(mobile: string): Promise<OtpSendResult> {
  try {
    const mobileNumber = normalizeIndianMobileDigits(mobile);
    if (mobileNumber.length !== 10) {
      return { success: false, error: 'Enter a valid 10-digit Indian mobile number.' };
    }
    const data = await postJson<{ demo?: boolean; message?: string }>('/api/workers/otp/send', {
      mobileNumber,
    });
    return { success: true, demo: data.demo, message: data.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    };
  }
}

export async function verifyWorkerOtp(mobile: string, otp: string): Promise<OtpVerifyResult> {
  try {
    const mobileNumber = normalizeIndianMobileDigits(mobile);
    const data = await postJson<{ otpToken?: string }>('/api/workers/otp/verify', {
      mobileNumber,
      otp: otp.trim(),
    });
    return { success: true, otpToken: data.otpToken };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OTP verification failed',
    };
  }
}
