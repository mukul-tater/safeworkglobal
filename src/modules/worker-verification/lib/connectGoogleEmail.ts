import type { User } from '@supabase/supabase-js';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';

const supabase: any = supabaseTyped;

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';
const CONNECTED_GMAIL_KEY = 'worker_connected_gmail';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function googleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined)?.trim() || '';
}

/** Google (or other real) email from linked OAuth identities — ignores synthetic mobile auth emails. */
export function getGoogleEmailFromUser(user: User | null | undefined): string | null {
  if (!user) return null;

  const google = user.identities?.find((i) => i.provider === 'google');
  const fromIdentity = (google?.identity_data as { email?: string } | undefined)?.email?.trim();
  if (fromIdentity && !isWorkerMobileAuthEmail(fromIdentity)) {
    return fromIdentity.toLowerCase();
  }

  if (user.email && !isWorkerMobileAuthEmail(user.email)) {
    return user.email.trim().toLowerCase();
  }

  const stored = sessionStorage.getItem(CONNECTED_GMAIL_KEY)?.trim();
  if (stored && !isWorkerMobileAuthEmail(stored)) {
    return stored.toLowerCase();
  }

  return null;
}

export function isGoogleIdentityLinked(user: User | null | undefined): boolean {
  if (user?.identities?.some((i) => i.provider === 'google')) return true;
  const stored = sessionStorage.getItem(CONNECTED_GMAIL_KEY)?.trim();
  return !!(stored && !isWorkerMobileAuthEmail(stored));
}

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });
}

async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not read Gmail from Google. Try again.');
  }
  const data = (await res.json()) as { email?: string; email_verified?: boolean };
  const email = data.email?.trim().toLowerCase();
  if (!email || !email.includes('@') || isWorkerMobileAuthEmail(email)) {
    throw new Error('Google did not return a valid Gmail address.');
  }
  return email;
}

/**
 * Connect Gmail via Google Identity Services (OAuth token popup).
 * Does NOT use supabase.auth.linkIdentity — works without Manual linking.
 * Keeps the current phone-auth session; only saves email on profiles.
 */
export async function startGoogleEmailLink(_redirectTo?: string): Promise<string> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error(
      'Google Client ID is not configured. Set VITE_GOOGLE_OAUTH_CLIENT_ID in .env (Web client ID from Google Cloud).',
    );
  }

  await loadGsiScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google sign-in failed to initialize. Refresh and try again.');
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(
              new Error(
                response.error_description ||
                  response.error ||
                  'Google sign-in was cancelled or failed.',
              ),
            );
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (error) => {
          reject(new Error(error.message || error.type || 'Google sign-in was cancelled.'));
        },
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      reject(e instanceof Error ? e : new Error('Could not start Google connect'));
    }
  });

  return fetchGoogleEmail(accessToken);
}

/** Persist Gmail onto profiles + worker_verification (does not advance stage). */
export async function persistConnectedGmail(userId: string, email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@') || isWorkerMobileAuthEmail(normalized)) {
    throw new Error('Invalid Gmail address');
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ email: normalized })
    .eq('id', userId);
  if (profileErr) throw new Error(profileErr.message);

  await supabase
    .from('worker_verification')
    .update({ email: normalized, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  sessionStorage.setItem(CONNECTED_GMAIL_KEY, normalized);
  return normalized;
}

/** @deprecated Prefer persistConnectedGmail after startGoogleEmailLink */
export async function syncLinkedGoogleEmail(userId: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = getGoogleEmailFromUser(user);
  if (!email) return null;
  return persistConnectedGmail(userId, email);
}

export function clearPendingGmailLink() {
  /* no-op: redirect-based linking removed */
}

export function hasPendingGmailLink(): boolean {
  return false;
}

export function markPendingGmailLink() {
  /* no-op */
}
