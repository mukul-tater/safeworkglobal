/**
 * Phone OTP is Firebase Phone Auth everywhere (worker, emitra, LSP).
 * Backend Fast2SMS/MSG91 send/verify routes are legacy and unused by the app UI.
 */
export type OtpChannel = 'firebase';

export function getOtpChannel(): OtpChannel {
  return 'firebase';
}

/** @deprecated Always false — UI uses Firebase Phone Auth only. */
export function useBackendOtp(): boolean {
  return false;
}
