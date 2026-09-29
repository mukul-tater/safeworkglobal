import { supabase } from '@/integrations/supabase/client';
import { devPortalAuthEmail, devStoredPhone, type DevLoginPortal } from '@/lib/devPortalAuthEmail';
import { isDevOtpBypassEnabled } from '@/lib/otpConfig';

export type { DevLoginPortal };
export { devPortalAuthEmail, devStoredPhone };

/**
 * Local Vite / non-production hosts only. Never true on safeworkglobal.com.
 * One typed mobile signs in to three separate users: worker, E-Mitra, and SSVN.
 */
export function isDevSharedMobileEnabled(): boolean {
  return isDevOtpBypassEnabled();
}

export async function devPortalAccountExists(
  portal: DevLoginPortal,
  mobile: string,
): Promise<boolean> {
  const email = devPortalAuthEmail(portal, mobile);
  const { data, error } = await supabase.rpc('resolve_worker_auth_email', {
    p_identifier: email,
  });
  if (error || typeof data !== 'string') return false;
  return data.toLowerCase() === email;
}

/** Sign out when the open session belongs to a different dev portal login. */
export async function devReleaseOtherPortalSession(
  portal: DevLoginPortal,
  mobile: string,
): Promise<void> {
  if (!isDevSharedMobileEnabled()) return;
  const expected = devPortalAuthEmail(portal, mobile);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const current = user?.email?.toLowerCase() || '';
  if (current && current !== expected) {
    await supabase.auth.signOut();
  }
}
