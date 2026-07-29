import { useCallback, useRef } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const message = err instanceof Error ? err.message : 'Failed to send OTP';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled, or SMS region (India) is blocked. Check Firebase Authentication → Phone + SMS region policy.';
    case 'auth/invalid-phone-number':
      return 'Invalid mobile number. Use a valid 10-digit Indian number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/invalid-app-credential':
    case 'auth/captcha-check-failed':
      if (host === 'localhost') {
        return 'Firebase Phone Auth does not work on "localhost". Use your live site (safeworkglobal.com) or http://127.0.0.1 with 127.0.0.1 added to Authorized domains.';
      }
      return 'Verification failed. Refresh the page and try again. If it keeps failing, confirm India is allowed under Firebase SMS region policy.';
    case 'auth/code-expired':
      return 'OTP expired. Tap Send OTP again.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Check the code and try again.';
    case 'auth/missing-verification-code':
      return 'Enter the 6-digit OTP.';
    default:
      return message;
  }
}

/** Invisible reCAPTCHA bound to the Send SMS button (no floating widget). */
export const WORKER_OTP_RECAPTCHA_BTN_ID = 'worker-send-sms-btn';

export function useFirebasePhoneOtp() {
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const resetRecaptcha = useCallback(() => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore stale verifier */
    }
    recaptchaRef.current = null;
    confirmationRef.current = null;
  }, []);

  const ensureRecaptcha = useCallback(async () => {
    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }

    const button = document.getElementById(WORKER_OTP_RECAPTCHA_BTN_ID);
    if (!button) {
      throw new Error('Send SMS button not ready. Refresh and try again.');
    }

    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, WORKER_OTP_RECAPTCHA_BTN_ID, {
      size: 'invisible',
      callback: () => {
        /* token ready — signInWithPhoneNumber continues */
      },
      'expired-callback': () => {
        resetRecaptcha();
      },
    });

    await verifier.render();
    recaptchaRef.current = verifier;
    return verifier;
  }, [resetRecaptcha]);

  const sendOtp = useCallback(
    async (mobileNumber: string) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      // Always recreate so a failed attempt does not leave a dead verifier
      resetRecaptcha();
      const auth = getFirebaseAuth();
      const verifier = await ensureRecaptcha();
      const phone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

      try {
        confirmationRef.current = await signInWithPhoneNumber(auth, phone, verifier);
      } catch (err) {
        resetRecaptcha();
        throw new Error(mapFirebaseAuthError(err));
      }
    },
    [ensureRecaptcha, resetRecaptcha]
  );

  const verifyOtp = useCallback(
    async (otp: string): Promise<string> => {
      if (!confirmationRef.current) {
        throw new Error('Request OTP first');
      }

      try {
        const credential = await confirmationRef.current.confirm(otp);
        const idToken = await credential.user.getIdToken();
        resetRecaptcha();
        return idToken;
      } catch (err) {
        throw new Error(mapFirebaseAuthError(err));
      }
    },
    [resetRecaptcha]
  );

  return {
    isAvailable: isFirebaseConfigured(),
    sendOtp,
    verifyOtp,
    resetRecaptcha,
  };
}
