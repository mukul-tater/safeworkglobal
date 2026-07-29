/**
 * OTP channel for Phase-1 `/register` (Express).
 * Live `/worker/quick-signup` uses Firebase Phone Auth via `isFirebaseConfigured()` —
 * see QuickWorkerSignup — not this helper.
 */
export type OtpChannel = 'backend' | 'firebase';

export function getOtpChannel(): OtpChannel {
  const provider = (import.meta.env.VITE_OTP_PROVIDER || 'backend').toLowerCase();
  return provider === 'firebase' ? 'firebase' : 'backend';
}

export function useBackendOtp(): boolean {
  return getOtpChannel() === 'backend';
}
