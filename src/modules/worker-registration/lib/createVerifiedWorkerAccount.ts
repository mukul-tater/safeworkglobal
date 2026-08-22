import { supabase } from '@/integrations/supabase/client';
import { workerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import { passwordSignupIssue, WEAK_PASSWORD_MESSAGE } from '@/lib/validations/password';
import {
  WORKER_TERMS_VERSION,
} from '@/modules/worker-verification/constants';
import { acceptTerms } from '@/modules/worker-verification/services/verificationService';

async function attachWorkerToCallingPartner(input: {
  workerUserId: string;
  fullName: string;
  mobile: string;
  email: string;
}) {
  const { error } = await (supabase as any).rpc('partner_attach_registered_worker', {
    p_worker_user_id: input.workerUserId,
    p_full_name: input.fullName,
    p_mobile: input.mobile,
    p_email: input.email,
  });
  if (error) throw new Error(error.message);
}

export type WorkerSource =
  | { type: 'organic' }
  | { type: 'emitra'; partnerProfileId: string; orgId?: string }
  | { type: 'partner'; orgId?: string };

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
   * Partner-assisted create: capture the caller session, create the worker
   * (briefly switching auth). By default the partner session is restored.
   */
  preserveCallerSession?: boolean;
  /**
   * When preserveCallerSession is true, restore the partner after success.
   * Set false to stay signed in as the new worker and continue /worker/journey.
   * The partner session is parked in sessionStorage for later restore.
   */
  restoreCallerAfterSuccess?: boolean;
  /** Dashboard path to restore after a partner-assisted journey. */
  partnerReturnTo?: string;
};

export type CreateVerifiedWorkerResult = {
  userId: string;
  authEmail: string;
  mobile: string;
  requiresEmailConfirmation: boolean;
};

/**
 * Create a login-ready worker after Firebase SMS OTP succeeded.
 * Same account shape for self-signup and partner-assisted signup.
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

  const passwordIssue = passwordSignupIssue(input.password);
  if (passwordIssue) throw new Error(passwordIssue);

  try {
    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
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
      if (/weak|easy to guess|pwned|leaked password/i.test(signupErr.message)) {
        throw new Error(WEAK_PASSWORD_MESSAGE);
      }
      throw new Error(signupErr.message);
    }

    // Email confirmation is enabled in production. In that configuration the
    // account is created successfully but signUp intentionally returns no
    // session. Do not immediately call signInWithPassword (it can only return
    // "Email not confirmed") or continue with authenticated profile writes.
    if (!signupData.session) {
      const userId = signupData.user?.id;
      if (!userId) {
        throw new Error('Account was created, but confirmation status could not be read.');
      }
      if (input.preserveCallerSession) {
        await attachWorkerToCallingPartner({
          workerUserId: userId,
          fullName: input.fullName.trim(),
          mobile: digits,
          email: authEmail,
        });
      }
      return {
        userId,
        authEmail,
        mobile: digits,
        requiresEmailConfirmation: true,
      };
    }

    // signUp already established the session when confirmation is not
    // required. Avoid a second auth request and the races it causes on mobile.
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

    const partnerSourced = source.type === 'emitra' || source.type === 'partner';
    // Do not write source/review here. handle_new_user already inserted an
    // organic worker_profiles row; workers cannot change attribution (trigger).
    // Partner session is restored below, then partner_attach_registered_worker
    // stamps source_partner_id so My Workers can list them.
    const workerProfilePayload: Record<string, unknown> = {
      user_id: user.id,
      country,
      nationality: country,
      onboarded_at: partnerSourced ? new Date().toISOString() : null,
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

    const result = {
      userId: user.id,
      authEmail,
      mobile: digits,
      requiresEmailConfirmation: false,
    };

    if (input.preserveCallerSession && switchedAwayFromCaller) {
      if (!callerSession) {
        throw new Error(
          'Worker was created, but partner session was lost. Please sign in again as partner.',
        );
      }

      // signUp() swapped the browser to the new worker. Restore the partner
      // immediately so they stay signed in and can fill the worker's GCC forms.
      const { error: partnerErr } = await supabase.auth.setSession(callerSession);
      if (partnerErr) {
        throw new Error(
          'Worker was created, but partner session could not be restored. Please sign in again.',
        );
      }
      await attachWorkerToCallingPartner({
        workerUserId: user.id,
        fullName: input.fullName.trim(),
        mobile: digits,
        email: authEmail,
      });
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
