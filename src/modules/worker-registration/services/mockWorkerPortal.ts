import type {
  WorkerAuthResponse,
  WorkerRegisterPayload,
} from '../types/worker.types';

const OTP_TOKEN_KEY = 'safework_mock_otp_token';
const TOKEN_TTL_MS = 15 * 60 * 1000;

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function validationError(message: string, field: string): never {
  const err = new Error(message) as Error & { errors?: Record<string, string[]> };
  err.errors = { [field]: [message] };
  throw err;
}

/**
 * Offline register fallback only. OTP send/verify must go through Firebase Phone Auth
 * + POST /workers/otp/verify-firebase — no demo “any 6 digits” path.
 */
export const mockWorkerPortal = {
  register(payload: WorkerRegisterPayload): WorkerAuthResponse {
    const mobile = normalizeMobile(payload.mobileNumber);
    const raw = sessionStorage.getItem(OTP_TOKEN_KEY);

    if (!raw) {
      validationError(
        'Mobile must be verified with Firebase SMS OTP first. Ensure the worker API is running.',
        'mobileNumber',
      );
    }

    const tokenState = JSON.parse(raw) as { mobile: string; otpToken: string; expiresAt: number };
    if (
      tokenState.otpToken !== payload.otpToken ||
      tokenState.mobile !== mobile ||
      tokenState.expiresAt < Date.now()
    ) {
      validationError('Mobile verification expired. Verify your number again.', 'mobileNumber');
    }

    if (payload.password !== payload.confirmPassword) {
      validationError('Passwords do not match', 'confirmPassword');
    }

    sessionStorage.removeItem(OTP_TOKEN_KEY);

    const email = payload.email.trim().toLowerCase();
    const workerId = Math.abs([...mobile].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 1_000_000 || 1;
    const fullName = payload.fullName.trim();

    return {
      token: randomToken(),
      worker: {
        id: workerId,
        workerCode: `WRK-${String(workerId).padStart(6, '0')}`,
        fullName,
        email,
        mobileNumber: mobile,
        aadhaarNumber: 'PENDING',
        stateId: 0,
        stateName: '',
        districtId: 0,
        districtName: '',
        primarySkillId: 0,
        primarySkillName: '',
        experienceLevel: 'FRESHER',
        profileCompletionPercentage: 10,
        registrationSource: 'WEB',
        status: 'PROFILE_INCOMPLETE',
        onboardingCompleted: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      },
    };
  },

  /** Used only if verify-firebase succeeded earlier in the same browser session (tests). */
  stashVerifiedToken(mobileNumber: string, otpToken: string) {
    sessionStorage.setItem(
      OTP_TOKEN_KEY,
      JSON.stringify({
        mobile: normalizeMobile(mobileNumber),
        otpToken,
        expiresAt: Date.now() + TOKEN_TTL_MS,
      }),
    );
  },
};
