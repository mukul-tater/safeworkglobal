import { supabase as supabaseTyped } from '@/integrations/supabase/client';

const supabase: any = supabaseTyped;

export type SsvnPartnerCheck = {
  partnerId: string;
  status: string;
  companyName: string | null;
};

/** Load a partner org of a given type for a user (if any). */
export async function getPartnerOrgForUser(
  userId: string,
  typeCode: string,
): Promise<SsvnPartnerCheck | null> {
  const { data: types } = await supabase
    .from('partner_types')
    .select('id')
    .eq('code', typeCode)
    .maybeSingle();
  if (!types?.id) return null;

  const { data, error } = await supabase
    .from('partners')
    .select('id, status, partner_profiles_ext(company_name)')
    .eq('user_id', userId)
    .eq('partner_type_id', types.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  return {
    partnerId: data.id,
    status: data.status,
    companyName: data.partner_profiles_ext?.company_name ?? null,
  };
}

/** Load the SSVN partner org for a user (if any). */
export async function getSsvnPartnerForUser(userId: string): Promise<SsvnPartnerCheck | null> {
  return getPartnerOrgForUser(userId, 'SSVN');
}

export function isSsvnPartnerApproved(partner: SsvnPartnerCheck | null): boolean {
  return !!partner && partner.status === 'approved';
}

/** Resolve auth user id from mobile on profiles or SSVN partner_profiles_ext. */
export async function findUserIdByPartnerMobile(digits: string): Promise<string | null> {
  const { data: byProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', digits)
    .maybeSingle();
  if (byProfile?.id) return byProfile.id as string;

  const { data: ext } = await supabase
    .from('partner_profiles_ext')
    .select('partner_id, mobile')
    .eq('mobile', digits)
    .limit(1)
    .maybeSingle();
  if (!ext?.partner_id) return null;

  const { data: partner } = await supabase
    .from('partners')
    .select('user_id')
    .eq('id', ext.partner_id)
    .maybeSingle();
  return (partner?.user_id as string) || null;
}

export async function assertUserIsPartnerRole(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role === 'partner';
}
