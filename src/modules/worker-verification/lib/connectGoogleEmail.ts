import type { User } from '@supabase/supabase-js';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';

/**
 * Real email from a linked Google identity only (not synthetic mobile-auth emails).
 * Contact email for phone workers lives on profiles — use displayableEmail(profile.email).
 */
export function getGoogleEmailFromUser(user: User | null | undefined): string | null {
  if (!user) return null;

  const google = user.identities?.find((i) => i.provider === 'google');
  const fromIdentity = (google?.identity_data as { email?: string } | undefined)?.email?.trim();
  if (fromIdentity && !isWorkerMobileAuthEmail(fromIdentity)) {
    return fromIdentity.toLowerCase();
  }

  return null;
}

export function isGoogleIdentityLinked(user: User | null | undefined): boolean {
  return !!user?.identities?.some((i) => i.provider === 'google');
}
