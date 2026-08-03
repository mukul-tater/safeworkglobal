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
  /** Real contact + Auth email. Required for organic signup; optional for emitra (falls back to synthetic). */
  email?: string;
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
  const contactEmail = (input.email || '').trim().toLowerCase();
  const source = input.source ?? { type: 'organic' as const };

  // Organic signup uses real email for Auth. Emitra kiosk may still use synthetic.
  let authEmail = contactEmail;
  if (!authEmail) {
    if (source.type === 'organic') {
      throw new Error('Email is required to create a worker account.');
    }
    authEmail = workerAuthEmailFromMobile(digits);
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) {
    throw new Error('Enter a valid email address.');
  }

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
          // OTP already verified — handle_new_user + AuthContext honor this.
          mobile_verified: true,
          terms_version: WORKER_TERMS_VERSION,
        },
      },
    });

    if (signupErr) {
      if (/already registered|already exists/i.test(signupErr.message)) {
        throw new Error('This email or mobile is already registered. Sign in instead.');
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
      // eMitra OTP-verified onboarding is trusted — worker can log in immediately.
      // Trigger only forces pending when status is null / not_required.
      review_status: source.type === 'emitra' ? 'approved' : 'not_required',
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

    // Profiles are created by handle_new_user (SECURITY DEFINER). Clients only
    // have UPDATE RLS — upsert INSERT fails with "violates row-level security".
    const profilePatch = {
      full_name: input.fullName.trim(),
      phone: digits,
      mobile_verified: true,
      email: authEmail,
    };

    let profileReady = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: existing, error: selectErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (selectErr) throw new Error(selectErr.message);
      if (existing?.id) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update(profilePatch)
          .eq('id', user.id);
        if (profileErr) throw new Error(profileErr.message);
        profileReady = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
    if (!profileReady) {
      throw new Error('Profile was not ready yet. Please try again in a moment.');
    }

    // Confirm the flag stuck (guards against RLS/trigger oddities).
    const { data: verifiedRow, error: verifiedErr } = await supabase
      .from('profiles')
      .select('mobile_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (verifiedErr) throw new Error(verifiedErr.message);
    if (!verifiedRow?.mobile_verified) {
      const { error: forceErr } = await supabase
        .from('profiles')
        .update({ mobile_verified: true, phone: digits })
        .eq('id', user.id);
      if (forceErr) throw new Error(forceErr.message);

      const { data: again } = await supabase
        .from('profiles')
        .select('mobile_verified')
        .eq('id', user.id)
        .maybeSingle();
      if (!again?.mobile_verified) {
        throw new Error(
          'Could not save mobile verification. Please refresh and try signing in again.',
        );
      }
    }

    // Keep metadata in sync so AuthContext metaVerified works after reload.
    try {
      await supabase.auth.updateUser({
        data: { phone: digits, mobile_verified: true },
      });
    } catch {
      /* non-fatal */
    }

    // Sync session flag before React navigates (survives ProtectedRoute race).
    try {
      sessionStorage.setItem(`swg_mobile_verified_${user.id}`, '1');
    } catch {
      /* ignore */
    }

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
