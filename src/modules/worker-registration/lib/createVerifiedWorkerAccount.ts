import { supabase } from '@/integrations/supabase/client';
import { workerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import {
  WORKER_TERMS_VERSION,
} from '@/modules/worker-verification/constants';
import { acceptTerms } from '@/modules/worker-verification/services/verificationService';

export type WorkerSource =
  | { type: 'organic' }
  | { type: 'emitra'; partnerProfileId: string };

export type CreateVerifiedWorkerInput = {
  fullName: string;
  mobile: string;
  password: string;
  country?: string;
  source?: WorkerSource;
  /** Optional seed fields on worker_profiles (skill/location from emitra kiosk). */
  profileSeed?: {
    primary_work_type?: string;
    current_city?: string;
    state?: string;
  };
  /**
   * Emitra partners must stay logged in. Captures the caller session, creates the
   * worker (briefly switching auth), then restores the partner session.
   */
  preserveCallerSession?: boolean;
};

export type CreateVerifiedWorkerResult = {
  userId: string;
  authEmail: string;
  mobile: string;
};

/**
 * Create a login-ready worker after Firebase SMS OTP succeeded.
 * Same account shape for self-signup and emitra-assisted signup.
 */
export async function createVerifiedWorkerAccount(
  input: CreateVerifiedWorkerInput,
): Promise<CreateVerifiedWorkerResult> {
  const digits = input.mobile.replace(/\D/g, '').slice(-10);
  const authEmail = workerAuthEmailFromMobile(digits);
  const source = input.source ?? { type: 'organic' as const };
  const country = input.country || 'India';

  let callerSession: { access_token: string; refresh_token: string } | null = null;
  let switchedAwayFromCaller = false;
  if (input.preserveCallerSession) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token && data.session.refresh_token) {
      callerSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    }
  }

  try {
    const { error: signupErr } = await supabase.auth.signUp({
      email: authEmail,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/worker/journey`,
        data: {
          full_name: input.fullName.trim(),
          phone: digits,
          role: 'worker',
          terms_version: WORKER_TERMS_VERSION,
        },
      },
    });

    if (signupErr) {
      if (/already registered|already exists/i.test(signupErr.message)) {
        throw new Error('This mobile number is already registered. The worker can sign in instead.');
      }
      throw new Error(signupErr.message);
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: input.password,
    });
    if (signInErr) throw new Error(signInErr.message);
    switchedAwayFromCaller = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Account created but session could not be established.');

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (roleRow && roleRow.role !== 'worker') {
      throw new Error(
        `This account is already registered as a ${roleRow.role}. Use a different mobile number.`,
      );
    }

    const location = [input.profileSeed?.current_city, input.profileSeed?.state]
      .filter(Boolean)
      .join(', ');

    const workerProfilePayload: Record<string, unknown> = {
      user_id: user.id,
      country,
      nationality: country,
      source_type: source.type,
      source_partner_id: source.type === 'emitra' ? source.partnerProfileId : null,
      onboarded_at: source.type === 'emitra' ? new Date().toISOString() : null,
      // Explicit — handle_new_user may INSERT organic first; upsert UPDATE skips INSERT trigger
      review_status: source.type === 'emitra' ? 'pending' : 'not_required',
    };

    if (input.profileSeed?.primary_work_type) {
      workerProfilePayload.primary_work_type = input.profileSeed.primary_work_type;
      workerProfilePayload.primary_skill = input.profileSeed.primary_work_type;
    }
    if (input.profileSeed?.current_city) {
      workerProfilePayload.current_city = input.profileSeed.current_city;
    }
    if (location) {
      workerProfilePayload.current_location = location;
    }

    const { error: wpErr } = await supabase
      .from('worker_profiles')
      .upsert(workerProfilePayload as any, { onConflict: 'user_id' });
    if (wpErr) throw new Error(wpErr.message);

    if (input.profileSeed?.primary_work_type) {
      await supabase.from('worker_skills').insert({
        worker_id: user.id,
        skill_name: input.profileSeed.primary_work_type,
        proficiency_level: 'intermediate',
        years_of_experience: 0,
      } as any);
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName.trim(),
        phone: digits,
        mobile_verified: true,
      })
      .eq('id', user.id);
    if (profileErr) throw new Error(profileErr.message);

    try {
      await acceptTerms(user.id);
    } catch {
      /* migration may not be applied yet */
    }

    const result = { userId: user.id, authEmail, mobile: digits };

    if (input.preserveCallerSession && switchedAwayFromCaller) {
      await supabase.auth.signOut();
      if (!callerSession) {
        throw new Error(
          'Worker was created, but partner session was lost. Please sign in again as partner.',
        );
      }
      const { error } = await supabase.auth.setSession(callerSession);
      if (error) {
        throw new Error(
          'Worker was created, but partner session could not be restored. Please sign in again.',
        );
      }
      switchedAwayFromCaller = false;
    }

    return result;
  } finally {
    // Best-effort restore if we failed mid-create after switching to the worker session
    if (input.preserveCallerSession && switchedAwayFromCaller && callerSession) {
      try {
        await supabase.auth.signOut();
        await supabase.auth.setSession(callerSession);
      } catch {
        /* caller will need to re-login */
      }
    }
  }
}
