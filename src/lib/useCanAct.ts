import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActRole = 'worker' | 'employer' | 'partner';

export interface CanActResult {
  loading: boolean;
  canAct: boolean;
  missing: string[];
}

/**
 * Minimum-to-act gating per role:
 *  - worker:   full name + mobile + 10th-pass confirmed + state + primary skill
 *  - employer: company name + contact name + email + company country
 *  - partner:  full name + mobile + centre name + state
 */
export function useCanAct(role: ActRole): CanActResult {
  const { user } = useAuth();
  const [state, setState] = useState<CanActResult>({ loading: true, canAct: false, missing: [] });

  useEffect(() => {
    if (!user) { setState({ loading: false, canAct: false, missing: ['signed-in account'] }); return; }
    let cancelled = false;
    (async () => {
      const missing: string[] = [];
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .maybeSingle();
      if (role === 'worker') {
        const { data } = await (supabase as any)
          .from('worker_profiles')
          .select('tenth_pass_confirmed, primary_skill')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.full_name) missing.push('full name');
        if (!profile?.phone) missing.push('mobile number');
        if (!data?.tenth_pass_confirmed) missing.push('10th-pass confirmation');
        if (!data?.primary_skill) missing.push('primary skill');
      } else if (role === 'employer') {
        const { data } = await (supabase as any)
          .from('employer_profiles')
          .select('company_name, country')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!data?.company_name) missing.push('company name');
        if (!profile?.full_name) missing.push('contact name');
        if (!profile?.email) missing.push('email');
        if (!data?.country) missing.push('company country');
      } else if (role === 'partner') {
        const { data } = await (supabase as any)
          .from('partner_profiles')
          .select('mobile, center_name, state')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.full_name) missing.push('full name');
        if (!data?.mobile) missing.push('mobile number');
        if (!data?.center_name) missing.push('E-Mitra centre name');
        if (!data?.state) missing.push('state');
      }
      if (cancelled) return;
      setState({ loading: false, canAct: missing.length === 0, missing });
    })();
    return () => { cancelled = true; };
  }, [user, role]);

  return state;
}