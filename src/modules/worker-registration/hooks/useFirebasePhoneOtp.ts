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

/** Off-screen host for invisible Firebase reCAPTCHA (never shown in the form). */
export const WORKER_OTP_RECAPTCHA_HOST_ID = 'worker-recaptcha-host';

/** Remove leftover challenge widgets so they don't float over the OTP step. */
export function dismissRecaptchaWidgets() {
  if (typeof document === 'undefined') return;

  // Challenge / checkbox iframes (keep the small privacy badge)
  document.querySelectorAll('iframe[src*="recaptcha"]').forEach((iframe) => {
    const el = iframe as HTMLIFrameElement;
    const title = (el.title || '').toLowerCase();
    const isBadge = title.includes('badge') || el.offsetHeight < 80;
    if (isBadge) return;
    const wrap = el.closest('div');
    if (wrap && wrap.id !== WORKER_OTP_RECAPTCHA_HOST_ID) {
      wrap.remove();
    } else {
      el.remove();
    }
  });

  document.querySelectorAll('.g-recaptcha').forEach((node) => {
    if (node.id === WORKER_OTP_RECAPTCHA_HOST_ID) return;
    node.remove();
  });
}

export function useFirebasePhoneOtp() {
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const clearVerifierOnly = useCallback(() => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null;
    const host = document.getElementById(WORKER_OTP_RECAPTCHA_HOST_ID);
    if (host) host.innerHTML = '';
    dismissRecaptchaWidgets();
  }, []);

  const resetRecaptcha = useCallback(() => {
    clearVerifierOnly();
    confirmationRef.current = null;
  }, [clearVerifierOnly]);

  const ensureRecaptcha = useCallback(async () => {
    const container = document.getElementById(WORKER_OTP_RECAPTCHA_HOST_ID);
    if (!container) {
      throw new Error('reCAPTCHA host missing. Refresh and try again.');
    }
    container.innerHTML = '';

    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, WORKER_OTP_RECAPTCHA_HOST_ID, {
      size: 'invisible',
      callback: () => {
        /* solved */
      },
      'expired-callback': () => {
        clearVerifierOnly();
      },
    });

    await verifier.render();
    recaptchaRef.current = verifier;
    return verifier;
  }, [clearVerifierOnly]);

  const sendOtp = useCallback(
    async (mobileNumber: string) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      clearVerifierOnly();
      const auth = getFirebaseAuth();
      const verifier = await ensureRecaptcha();
      const phone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

      try {
        confirmationRef.current = await signInWithPhoneNumber(auth, phone, verifier);
        // Keep confirmation; tear down widget UI so OTP step stays clean
        clearVerifierOnly();
      } catch (err) {
        resetRecaptcha();
        throw new Error(mapFirebaseAuthError(err));
      }
    },
    [clearVerifierOnly, ensureRecaptcha, resetRecaptcha]
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
    clearVerifierOnly,
    dismissRecaptchaWidgets,
  };
}
