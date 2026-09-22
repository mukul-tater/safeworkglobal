import { supabase } from '@/integrations/supabase/client';
import { workerAuthEmailFromMobile } from '@/lib/workerAuthEmail';
import { passwordSignupIssue } from '@/lib/validations/password';
import { acceptTerms } from '@/modules/worker-verification/services/verificationService';
import { createPhoneVerifiedWorkerAccount } from '@/lib/phoneVerifiedAccount';

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
  /** Firebase ID token from the SMS OTP that just succeeded. Required. */
  idToken: string;
  /** Email OTP ticket from signup-email-otp. Required for organic (real-email) signup. */
  emailOtpTicket?: string;
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
  const partnerSourced = source.type === 'emitra' || source.type === 'partner';

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('Enter a valid email address.');
  }

  // Organic signup uses the contact email for Auth. Kiosk workers sign in with
  // the OTP-verified mobile, so Auth is the synthetic mobile address even when
  // a contact email is collected (stored on profiles, not used as the login key).
  let authEmail: string;
  if (partnerSourced) {
    authEmail = workerAuthEmailFromMobile(digits);
  } else if (!contactEmail) {
    throw new Error('Email is required to create a worker account.');
  } else {
    authEmail = contactEmail;
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
  if (!String(input.idToken || '').trim()) {
    throw new Error('Verification is required. Request a new OTP.');
  }
  if (!partnerSourced && !String(input.emailOtpTicket || '').trim()) {
    throw new Error('Verify your email with the OTP we sent, then try again.');
  }

  try {
    const created = await createPhoneVerifiedWorkerAccount({
      email: authEmail,
      password: input.password,
      fullName: input.fullName.trim(),
      mobile: digits,
      idToken: input.idToken,
      emailOtpTicket: input.emailOtpTicket,
    });
    if (!created.userId) throw new Error('Could not create account. Please try again.');

    const { data: signedIn, error: signInErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: input.password,
    });
    if (!signedIn?.session) {
      if (signInErr && /email not confirmed/i.test(signInErr.message)) {
        await new Promise((r) => setTimeout(r, 700));
        const retry = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: input.password,
        });
        if (!retry.data.session) {
          throw new Error('Account created. Confirm the email we sent, then sign in.');
        }
      } else if (signInErr) {
        throw new Error(signInErr.message);
      } else {
        throw new Error('Account created but session could not be established.');
      }
    }
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
      email: contactEmail || authEmail,
    };

    let profileReady = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: existing, error: selectErr } = await supabase
        .from('profiles')
        .select('id, mobile_verified')
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
        if (!existing.mobile_verified) {
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
          continue;
        }
        break;
      }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
    if (!profileReady) {
      throw new Error('Profile was not ready yet. Please try again in a moment.');
    }

    const { data: verifiedRow, error: verifiedErr } = await supabase
      .from('profiles')
      .select('mobile_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (verifiedErr) throw new Error(verifiedErr.message);
    if (!verifiedRow?.mobile_verified) {
      throw new Error(
        'Could not save mobile verification. Please refresh and try signing in again.',
      );
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
        email: contactEmail || authEmail,
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
