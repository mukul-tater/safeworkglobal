import { isDevOtpBypassEnabled, DEV_OTP_CODE } from '@/lib/otpConfig';

/** Banner for OTP screens in local development. */
export default function DevOtpHint() {
  if (!isDevOtpBypassEnabled()) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      Dev mode: SMS is skipped. Use <span className="font-semibold">{DEV_OTP_CODE}</span> or any
      6-digit code.
    </p>
  );
}
