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
      // Firebase no longer accepts hostname "localhost" for Phone Auth — use 127.0.0.1
      if (host === 'localhost') {
        return 'Firebase Phone Auth does not work on "localhost". Open http://127.0.0.1:5174/worker/quick-signup and add 127.0.0.1 under Firebase → Authentication → Authorized domains.';
      }
      return 'reCAPTCHA failed. Add 127.0.0.1 in Firebase Authorized domains, allow India in SMS region policy, hard-refresh, and try again. For local QA you can also add a test phone number in Firebase Console.';
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
    const el = document.getElementById('worker-recaptcha');
    if (el) el.innerHTML = '';
  }, []);

  const ensureRecaptcha = useCallback(
    async (containerId: string) => {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('reCAPTCHA container not found');
      }
      container.innerHTML = '';

      const auth = getFirebaseAuth();
      // Visible widget is more reliable than invisible on local / first-time setup
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
          /* solved */
        },
        'expired-callback': () => {
          resetRecaptcha();
        },
      });

      await verifier.render();
      recaptchaRef.current = verifier;
      return verifier;
    },
    [resetRecaptcha]
  );

  const sendOtp = useCallback(
    async (mobileNumber: string, recaptchaContainerId = 'worker-recaptcha') => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      resetRecaptcha();
      const auth = getFirebaseAuth();
      const verifier = await ensureRecaptcha(recaptchaContainerId);
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
