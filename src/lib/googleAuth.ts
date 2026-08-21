import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import {
  clearPendingOAuthRedirect,
  clearPendingOAuthRole,
  setPendingOAuthRedirect,
} from '@/lib/oauthRedirect';

type OAuthProvider = 'google' | 'apple' | 'microsoft';

export interface GoogleAuthResult {
  error: Error | null;
  redirected?: boolean;
}

/**
 * Lovable-hosted apps expose `/~oauth/initiate` (broker → Google).
 * Local Vite does not — it serves the SPA HTML instead, so Google "sign-in"
 * appears broken. Use Supabase Google OAuth on localhost / 127.0.0.1.
 */
function shouldUseLovableOAuthBroker(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_USE_LOVABLE_OAUTH === 'true') return true;
  if (import.meta.env.VITE_USE_LOVABLE_OAUTH === 'false') return false;

  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return true;
}

/** Full-page Google redirect through Supabase — works in every browser. */
async function signInViaSupabaseRedirect(): Promise<GoogleAuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) {
    clearPendingOAuthRedirect();
    clearPendingOAuthRole();
    return { error: new Error(error.message) };
  }
  return { error: null, redirected: true };
}

/**
 * Google OAuth for worker/employer signup & login.
 *
 * The Lovable OAuth broker only allows the app **origin** as a redirect target —
 * sending a path (e.g. `https://safeworkglobal.com/auth`) fails with
 * "redirect_uri is not allowed". So we always hand the broker the bare origin and
 * remember the intended path separately (see `@/lib/oauthRedirect`).
 */
export async function signInWithGoogle(
  provider: OAuthProvider = 'google',
  opts?: { redirect_uri?: string; next?: string },
): Promise<GoogleAuthResult> {
  if (provider !== 'google') {
    return { error: new Error(`Provider "${provider}" is not supported yet`) };
  }

  const origin = window.location.origin;
  // `/dashboard` is an unprotected spinner that routes by role. Never use a
  // login-form path here — that is what flashed the login page after Google.
  const intended = opts?.next ?? opts?.redirect_uri ?? '/dashboard';
  setPendingOAuthRedirect(intended);

  if (shouldUseLovableOAuthBroker()) {
    // The broker opens a popup when the app runs inside an iframe (Lovable
    // preview) and some browsers / in-app webviews block or immediately close
    // it — that is why Google sign-in "works on some devices only". Whenever
    // the popup path fails to produce a session, fall back to the universal
    // full-page Supabase redirect instead of surfacing a dead end.
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: origin,
      });

      if (result.redirected) {
        return { error: null, redirected: true };
      }

      if (result.error) {
        return signInViaSupabaseRedirect();
      }

      // No error and no redirect: the wrapper already called setSession().
      const { data } = await supabase.auth.getSession();
      if (data.session) return { error: null };

      return signInViaSupabaseRedirect();
    } catch {
      return signInViaSupabaseRedirect();
    }
  }

  return signInViaSupabaseRedirect();
}
