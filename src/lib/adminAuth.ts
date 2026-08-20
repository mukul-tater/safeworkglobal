import { supabase } from '@/integrations/supabase/client';

export const WHITELISTED_ADMIN_EMAILS = [
  'admin@safeworkglobal.com',
  'ops@safeworkglobal.com',
] as const;

export function isWhitelistedAdminEmail(email: string): boolean {
  return WHITELISTED_ADMIN_EMAILS.includes(
    email.trim().toLowerCase() as (typeof WHITELISTED_ADMIN_EMAILS)[number],
  );
}

async function hasAdminRole(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  return !!data;
}

export async function ensureAdminAccess(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Authentication failed.' };
  }

  // Admin privileges are never derived from an email allow-list. The only source of
  // truth is an explicit `admin` row in user_roles, granted manually by an existing admin.
  if (await hasAdminRole(user.id)) {
    return { ok: true };
  }

  return {
    ok: false,
    error: 'This account is not an administrator. Ask an existing admin to grant access.',
  };
}
