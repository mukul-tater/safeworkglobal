import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import {
  clearPendingOAuthRedirect,
  clearPendingOAuthRole,
  setPendingOAuthRedirect,
} from '@/lib/oauthRedirect';
import { redirectToCanonicalAuthHost } from '@/lib/authDomain';
import {
  describeOAuthError,
  logOAuthError,
  toOAuthErrorDetails,
  type OAuthErrorDetails,
} from '@/lib/oauthError';

type OAuthProvider = 'google' | 'apple' | 'microsoft';

export interface GoogleAuthResult {
  error: Error | null;
  redirected?: boolean;
  details?: OAuthErrorDetails;
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

function fail(details: OAuthErrorDetails): GoogleAuthResult {
  logOAuthError(details);
  clearPendingOAuthRedirect();
  clearPendingOAuthRole();
  return { error: new Error(describeOAuthError(details)), details };
}

/** Full-page Google redirect through Supabase — works in every browser. */
async function signInViaSupabaseRedirect(
  previous?: OAuthErrorDetails,
): Promise<GoogleAuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) {
    if (previous) logOAuthError(previous);
    return fail(toOAuthErrorDetails(error, { provider: 'google', flow: 'supabase-redirect' }));
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
 *
 * Sign-in is only ever started from the canonical host (apex domain); `www`
 * visitors are moved there first.
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

  // www → apex before OAuth so the redirect URI always matches the one
  // registered with Google / Supabase.
  if (redirectToCanonicalAuthHost()) {
    return { error: null, redirected: true };
  }

  if (shouldUseLovableOAuthBroker()) {
    // The broker opens a popup when the app runs inside an iframe (Lovable
    // preview) and some browsers / in-app webviews block or immediately close
    // it. We still fall back to the universal full-page Supabase redirect, but
    // the broker's real error is always logged and, if the fallback also fails,
    // surfaced to the user verbatim.
    let brokerError: OAuthErrorDetails | undefined;
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: origin,
      });

      if (result.redirected) {
        return { error: null, redirected: true };
      }

      if (result.error) {
        brokerError = toOAuthErrorDetails(result.error, {
          provider: 'google',
          flow: 'lovable-broker',
        });
        // Provider-side refusals will not be fixed by retrying through
        // Supabase — show them immediately instead of hiding them.
        const code = (brokerError.error_code || brokerError.error || '').toLowerCase();
        if (
          ['access_denied', 'admin_policy_enforced', 'redirect_uri_mismatch', 'unauthorized_client'].includes(
            code,
          )
        ) {
          return fail(brokerError);
        }
        return signInViaSupabaseRedirect(brokerError);
      }

      // No error and no redirect: the wrapper already called setSession().
      const { data } = await supabase.auth.getSession();
      if (data.session) return { error: null };

      brokerError = {
        provider: 'google',
        flow: 'lovable-broker',
        error: 'no_session',
        error_description:
          'The Google popup closed without returning a session (popup blocked or third-party cookies restricted).',
        origin,
        hostname: window.location.hostname,
      };
      return signInViaSupabaseRedirect(brokerError);
    } catch (err) {
      brokerError = toOAuthErrorDetails(err, { provider: 'google', flow: 'lovable-broker' });
      return signInViaSupabaseRedirect(brokerError);
    }
  }

  return signInViaSupabaseRedirect();
}
