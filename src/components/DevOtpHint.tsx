import { isDevOtpBypassEnabled, DEV_OTP_CODE } from '@/lib/otpConfig';

type Props = {
  channel?: 'sms' | 'email';
  /** Server said email OTP is in bypass mode. */
  force?: boolean;
};

/** Banner for OTP screens in local development. */
export default function DevOtpHint({ channel = 'sms', force = false }: Props) {
  if (channel === 'email') {
    // Email OTP bypass is decided by the edge function and returned as `dev`.
    // A local/preview frontend can still call the production function, so the
    // frontend's Firebase SMS bypass flag must never reveal a fake email code.
    if (!force) return null;
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Dev mode: email is skipped. Use <span className="font-semibold">{DEV_OTP_CODE}</span>.
      </p>
    );
  }
  if (!isDevOtpBypassEnabled()) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      Dev mode: SMS is skipped. Use <span className="font-semibold">{DEV_OTP_CODE}</span> or any
      6-digit code.
    </p>
  );
}
