import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { clearPendingOAuthRedirect, setPendingOAuthRedirect } from '@/lib/oauthRedirect';

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
  const intended = opts?.next ?? opts?.redirect_uri ?? '/auth';
  setPendingOAuthRedirect(intended);

  if (shouldUseLovableOAuthBroker()) {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: origin,
    });

    if (result.error) {
      clearPendingOAuthRedirect();
      const err =
        result.error instanceof Error ? result.error : new Error(String(result.error));
      return { error: err };
    }
    if (result.redirected) {
      return { error: null, redirected: true };
    }
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    clearPendingOAuthRedirect();
    return { error: new Error(error.message) };
  }

  return { error: null, redirected: true };
}
