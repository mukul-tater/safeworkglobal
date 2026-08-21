import { supabase } from '@/integrations/supabase/client';
import { displayableEmail, partnerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import { getPartnerProfile, isPartnerOperational } from '../services/emitraService';

async function hasPartnerRole(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'partner')
    .maybeSingle();

  return !!data;
}

/**
 * Resolve a typed identifier (contact email or 10-digit mobile) to the Auth email.
 * Partners who skipped contact email at signup use a synthetic mobile email.
 */
export async function resolveEmitraAuthEmail(identifier: string): Promise<string | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  if (raw.includes('@')) return raw.toLowerCase();

  const digits = raw.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(digits)) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('email')
    .eq('phone', digits)
    .maybeSingle();

  return displayableEmail(prof?.email) || partnerAuthEmailFromMobile(digits);
}

export async function ensureEmitraPartnerAccess(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Authentication failed.' };
  }

  if (!(await hasPartnerRole(user.id))) {
    return {
      ok: false,
      error: 'This account is not an E-Mitra partner. Apply as a partner first, or use the correct portal.',
    };
  }

  const profile = await getPartnerProfile(user.id);
  if (!isPartnerOperational(profile)) {
    if (profile?.status === 'rejected') {
      return { ok: false, error: 'Your partner application was rejected. Contact SafeWork support.' };
    }
    if (profile?.status === 'suspended') {
      return { ok: false, error: 'Your partner account is suspended. Contact SafeWork support.' };
    }
    return {
      ok: false,
      error: 'Your partner application is pending approval. You will be notified once approved.',
    };
  }

  return { ok: true };
}
