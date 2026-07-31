import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';

const PENDING_GMAIL_LINK_KEY = 'pending_worker_gmail_link';

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

  return null;
}

export function isGoogleIdentityLinked(user: User | null | undefined): boolean {
  return !!user?.identities?.some((i) => i.provider === 'google');
}

export function markPendingGmailLink() {
  sessionStorage.setItem(PENDING_GMAIL_LINK_KEY, '1');
}

export function hasPendingGmailLink(): boolean {
  return sessionStorage.getItem(PENDING_GMAIL_LINK_KEY) === '1';
}

export function clearPendingGmailLink() {
  sessionStorage.removeItem(PENDING_GMAIL_LINK_KEY);
}

/**
 * Start Supabase manual identity linking (Google → current logged-in worker).
 * Requires Auth → Providers → Google + Manual linking enabled in the Supabase project.
 */
export async function startGoogleEmailLink(redirectTo: string): Promise<void> {
  markPendingGmailLink();

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    sessionStorage.removeItem(PENDING_GMAIL_LINK_KEY);
    const msg = error.message || 'Could not start Google connect';
    if (/manual.?linking|not enabled/i.test(msg)) {
      throw new Error(
        'Google email linking is not enabled. In Supabase Dashboard → Authentication → Settings, turn on Manual linking.',
      );
    }
    if (/provider/i.test(msg) && /not.*enabled|disabled/i.test(msg)) {
      throw new Error(
        'Google sign-in is not enabled in Supabase. Enable Authentication → Providers → Google.',
      );
    }
    throw new Error(msg);
  }

  // Some clients return the URL instead of redirecting automatically.
  if (data?.url) {
    window.location.assign(data.url);
  }
}

/** Persist linked Gmail onto profiles + worker_verification (does not advance stage). */
export async function syncLinkedGoogleEmail(userId: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = getGoogleEmailFromUser(user);
  if (!email) return null;

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ email })
    .eq('id', userId);
  if (profileErr) throw new Error(profileErr.message);

  await supabase
    .from('worker_verification')
    .update({ email, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return email;
}
