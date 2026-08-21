import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import { assertValidPassportKyc } from '@/lib/validations/passport';
import type {
  BondTemplate,
  InterviewerAssignment,
  SkillQuizConfig,
  SkillQuizItem,
  VerificationStage,
  WorkerVerification,
} from '../types';
import {
  ASSESSMENT_FEE_INR,
  QUIZ_PASS_SCORE,
  WORKER_TERMS_VERSION,
  ecrFromTenthPass,
  normalizeVerificationStage,
  skillRequiresTradeTest,
} from '../constants';
import { loadQuizItemsFromJson } from '../quiz-data';

const supabase: any = supabaseTyped;

export async function getOrCreateVerification(userId: string): Promise<WorkerVerification> {
  const { data: existing, error: fetchErr } = await supabase
    .from('worker_verification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (existing) {
    const row = existing as WorkerVerification;
    return {
      ...row,
      stage: normalizeVerificationStage(row.stage, row.trade_test_required),
    };
  }

  const { data: created, error: insertErr } = await supabase
    .from('worker_verification')
    .insert({ user_id: userId, stage: 'essentials' })
    .select('*')
    .single();

  if (insertErr) throw new Error(insertErr.message);
  return created as WorkerVerification;
}

export async function acceptTerms(userId: string): Promise<void> {
  const row = await getOrCreateVerification(userId);
  const { error } = await supabase
    .from('worker_verification')
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: WORKER_TERMS_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
  if (error) throw new Error(error.message);
}

export async function saveEssentials(
  userId: string,
  input: {
    email: string;
    city: string;
    state: string;
    education_level: string;
    primary_skill: string;
    tenth_pass: boolean;
  },
): Promise<WorkerVerification> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@') || isWorkerMobileAuthEmail(email)) {
    throw new Error('Enter a real email before continuing. Temporary mobile login emails are not allowed.');
  }

  const row = await getOrCreateVerification(userId);
  const ecr = ecrFromTenthPass(input.tenth_pass);

  const { error: profileErr } = await supabase
    .from('worker_profiles')
    .upsert(
      {
        user_id: userId,
        current_city: input.city,
        current_location: [input.city, input.state].filter(Boolean).join(', '),
        primary_skill: input.primary_skill,
        primary_work_type: input.primary_skill,
        experience_range: input.education_level,
        tenth_pass_confirmed: ecr.tenth_pass_confirmed,
        ecr_category: ecr.ecr_category,
        ecr_status: ecr.ecr_status,
      },
      { onConflict: 'user_id' },
    );
  if (profileErr) throw new Error(profileErr.message);

  await supabase.from('profiles').update({ email }).eq('id', userId);

  // Ensure a worker_skills row for media uploads — fail loudly if this breaks
  const { data: existingSkill, error: skillFetchErr } = await supabase
    .from('worker_skills')
    .select('id')
    .eq('worker_id', userId)
    .eq('skill_name', input.primary_skill)
    .maybeSingle();
  if (skillFetchErr) throw new Error(skillFetchErr.message);

  if (!existingSkill) {
    const { error: skillInsertErr } = await supabase.from('worker_skills').insert({
      worker_id: userId,
      skill_name: input.primary_skill,
      proficiency_level: 'intermediate',
      years_of_experience: 0,
    });
    if (skillInsertErr) throw new Error(skillInsertErr.message);
  }

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      email,
      city: input.city,
      state: input.state,
      education_level: input.education_level,
      primary_skill: input.primary_skill,
      trade_test_required: skillRequiresTradeTest(input.primary_skill),
      trade_test_status: skillRequiresTradeTest(input.primary_skill) ? 'pending' : 'not_required',
      essentials_completed_at: new Date().toISOString(),
      stage: 'quiz',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/**
 * Test 1 questions come from the admin CMS (`worker_skill_quiz_items` +
 * `skill_quiz_configs`). Region matching is optional: prefer questions for the
 * worker's state, else fall back to skill-only / All-India rows.
 * Falls back to bundled JSON when the CMS has nothing for the skill yet.
 */
export async function loadQuizItems(
  skill: string,
  region?: string | null,
): Promise<SkillQuizItem[]> {
  try {
    const [{ data: cfgRows }, { data: itemRows }] = await Promise.all([
      supabase
        .from('skill_quiz_configs')
        .select('*')
        .eq('skill_code', skill)
        .eq('active', true),
      (supabase as any).rpc('get_worker_quiz_items', { p_skill: skill }),
    ]);

    const configs = (cfgRows || []) as SkillQuizConfig[];
    const config =
      (region && configs.find((c) => c.region === region)) ||
      configs.find((c) => !c.region) ||
      null;

    // Answer keys never reach the client — grading happens server-side.
    const all = ((itemRows || []) as Omit<SkillQuizItem, 'expected_answer'>[]).map((q) => ({
      ...q,
      expected_answer: false,
    })) as SkillQuizItem[];
    if (!all.length) return loadQuizItemsFromJson(skill);

    const regional = region ? all.filter((q) => q.region === region) : [];
    const generic = all.filter((q) => !q.region);
    let pool = regional.length ? [...regional, ...generic] : generic.length ? generic : all;

    if (config?.selection_mode === 'explicit_ids' && config.selected_ids?.length) {
      const wanted = new Set(config.selected_ids);
      const explicit = all.filter((q) => wanted.has(q.id));
      if (explicit.length) pool = explicit;
    } else {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    const count = Math.max(1, config?.questions_to_show ?? 5);
    return pool.slice(0, count);
  } catch {
    return loadQuizItemsFromJson(skill);
  }
}

export async function loadActiveBondTemplate(): Promise<BondTemplate | null> {
  const { data } = await supabase
    .from('bond_templates')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as BondTemplate) || null;
}

/** Admin — list users holding the interviewer role (for assignment dropdowns). */
export async function listInterviewers(): Promise<
  { user_id: string; full_name: string | null; email: string | null }[]
> {
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'interviewer' as never);
  if (error) throw new Error(error.message);
  const ids = (roles || []).map((r) => (r as { user_id: string }).user_id);
  if (!ids.length) return [];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  return ids.map((id) => {
    const p = (profiles || []).find((x) => x.id === id);
    return { user_id: id, full_name: p?.full_name ?? null, email: p?.email ?? null };
  });
}

/** Admin — all bond templates (newest first). */
export async function listBondTemplates(): Promise<BondTemplate[]> {
  const { data, error } = await supabase
    .from('bond_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as BondTemplate[];
}

/** Admin — upload a bond PDF and make it the active template. */
export async function createBondTemplate(input: {
  version: string;
  title: string;
  courierAddress: string;
  instructions?: string;
  file: File;
  workerChequeAmount?: number | null;
  guarantorChequeAmount?: number | null;
}): Promise<void> {
  const ext = input.file.name.split('.').pop() || 'pdf';
  const path = `bond-templates/${input.version.replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('worker-documents')
    .upload(path, input.file, { upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: urlErr } = await supabase.storage
    .from('worker-documents')
    .createSignedUrl(path, 31536000);
  if (urlErr || !signed?.signedUrl) throw new Error(urlErr?.message || 'Could not create file URL');

  await supabase.from('bond_templates').update({ active: false } as never).eq('active', true);
  const { error } = await supabase.from('bond_templates').insert({
    version: input.version.trim(),
    title: input.title.trim(),
    file_url: signed.signedUrl,
    courier_address: input.courierAddress.trim(),
    instructions: input.instructions?.trim() || null,
    worker_cheque_amount: input.workerChequeAmount ?? null,
    guarantor_cheque_amount: input.guarantorChequeAmount ?? null,
    active: true,
  } as never);
  if (error) throw new Error(error.message);
}

/** Admin — flip which bond template workers download. */
export async function setActiveBondTemplate(id: string): Promise<void> {
  await supabase.from('bond_templates').update({ active: false } as never).eq('active', true);
  const { error } = await supabase.from('bond_templates').update({ active: true } as never).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function submitQuiz(
  userId: string,
  answers: { quiz_item_id: string; answer: boolean }[],
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  // Grading and scoring are done server-side against the hidden answer key.
  const { data: graded, error: gradeErr } = await (supabase as any).rpc('submit_worker_quiz', {
    p_answers: answers.map((a) => ({ quiz_item_id: a.quiz_item_id, answer: a.answer })),
  });
  if (gradeErr) throw new Error(gradeErr.message);
  const result = Array.isArray(graded) ? graded[0] : graded;
  const score = Number(result?.score ?? 0);
  const passed = score >= QUIZ_PASS_SCORE;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      quiz_score: score,
      quiz_completed_at: passed ? now : null,
      stage: passed ? 'media' : 'quiz',
      updated_at: now,
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // If score passed but stage stuck on quiz, force stage once more.
  if (data && data.stage === 'quiz' && data.quiz_completed_at) {
    const { data: forced, error: forceErr } = await supabase
      .from('worker_verification')
      .update({ stage: 'media', updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('*')
      .single();
    if (forceErr) throw new Error(forceErr.message);
    return forced as WorkerVerification;
  }

  return data as WorkerVerification;
}

export async function completeMediaStep(userId: string): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      media_submitted_at: new Date().toISOString(),
      stage: 'identity',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/**
 * KYC — PAN + full Aadhaar + passport (number, expiry ≥ 6 months) + document photos.
 * Stays on the identity stage: an admin must verify KYC before the video
 * interview can be scheduled (admin_verify_worker_kyc advances the stage).
 */
export async function completeIdentityKyc(
  userId: string,
  opts: {
    panNumber: string;
    aadhaarNumber: string;
    passportNumber: string;
    passportExpiry: string;
    nextStageIfCurrentIdentity?: boolean;
  },
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const aadhaar = opts.aadhaarNumber.replace(/\D/g, '');
  if (aadhaar.length !== 12) {
    throw new Error('Enter your full 12-digit Aadhaar number');
  }

  const { passportNumber, passportExpiry } = assertValidPassportKyc({
    number: opts.passportNumber,
    expiry: opts.passportExpiry,
  });

  const now = new Date().toISOString();
  const kycPayload = {
    user_id: userId,
    pan_number: opts.panNumber.trim().toUpperCase(),
    aadhaar_number: aadhaar,
    aadhaar_last4: aadhaar.slice(-4),
    passport_number: passportNumber,
    passport_expiry: passportExpiry,
    has_passport: true,
    kyc_status: 'submitted',
    kyc_consent_at: now,
    kyc_submitted_at: now,
  };

  // Prefer update when a profile already exists (essentials creates it).
  const { data: existingWp } = await supabase
    .from('worker_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingWp) {
    const { error: wpErr } = await supabase
      .from('worker_profiles')
      .update(kycPayload)
      .eq('user_id', userId);
    if (wpErr) throw new Error(wpErr.message);
  } else {
    const { error: wpErr } = await supabase.from('worker_profiles').insert(kycPayload);
    if (wpErr) throw new Error(wpErr.message);
  }

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      kyc_status: 'submitted',
      stage: row.stage === 'identity' ? 'identity' : row.stage,
      updated_at: now,
    })
    .eq('id', row.id)
    .select('*')
    .single();

  // KYC profile write already succeeded — don't fail the whole submit if the
  // verification-row update is blocked.
  if (error) {
    console.warn('Identity KYC status update failed:', error.message);
    return { ...row, updated_at: now };
  }
  return data as WorkerVerification;
}

/* ------------------------------------------------------------------ */
/* Privileged actions — SECURITY DEFINER RPCs (admin / interviewer)    */
/* ------------------------------------------------------------------ */

async function rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
}

/** Admin — approve or reject KYC. Approving unlocks interview scheduling. */
export async function reviewWorkerKyc(
  userId: string,
  approved: boolean,
  reason?: string,
): Promise<void> {
  await rpc('admin_verify_worker_kyc', {
    p_user_id: userId,
    p_approved: approved,
    p_reason: reason || null,
  });
}

/** Admin — set interview date/time/link and assign an interviewer. */
export async function scheduleWorkerInterview(input: {
  userId: string;
  scheduledAt: string;
  meetingUrl: string;
  interviewerUserId: string;
}): Promise<string> {
  return rpc<string>('admin_schedule_worker_interview', {
    p_user_id: input.userId,
    p_scheduled_at: input.scheduledAt,
    p_meeting_url: input.meetingUrl,
    p_interviewer_user_id: input.interviewerUserId,
  });
}

/** Interviewer (or admin) — Approved unlocks payment automatically. */
export async function recordInterviewDecision(input: {
  interviewId: string;
  approved: boolean;
  reason?: string;
  score?: number;
}): Promise<void> {
  await rpc('interviewer_record_decision', {
    p_interview_id: input.interviewId,
    p_approved: input.approved,
    p_reason: input.reason || null,
    p_score: input.score ?? null,
  });
}

export async function listInterviewerAssignments(): Promise<InterviewerAssignment[]> {
  const rows = await rpc<InterviewerAssignment[]>('interviewer_list_assignments');
  return rows || [];
}

/** Admin — schedule trade test or medical with date/time + place. */
export async function scheduleWorkerAssessment(input: {
  userId: string;
  kind: 'trade_test' | 'medical';
  scheduledAt: string;
  place?: string;
  instructions?: string;
}): Promise<void> {
  await rpc('admin_schedule_worker_assessment', {
    p_user_id: input.userId,
    p_kind: input.kind,
    p_scheduled_at: input.scheduledAt,
    p_place: input.place || null,
    p_instructions: input.instructions || null,
  });
}

/** Worker — enters courier tracking number after posting the signed bond. */
export async function submitBondTracking(tracking: string): Promise<void> {
  await rpc('worker_submit_bond_tracking', { p_tracking: tracking });
}

/** Admin — original bond received in office. Moves worker to PDOT. */
export async function markBondReceived(userId: string): Promise<void> {
  await rpc('admin_mark_bond_received', { p_user_id: userId });
}

/** Admin — PDOT training plan (provider, batch, link, date). */
export async function setPdotPlan(input: {
  userId: string;
  provider?: string;
  batch?: string;
  trainingUrl?: string;
  scheduledAt?: string | null;
}): Promise<void> {
  await rpc('admin_set_pdot_plan', {
    p_user_id: input.userId,
    p_provider: input.provider || null,
    p_batch: input.batch || null,
    p_training_url: input.trainingUrl || null,
    p_scheduled_at: input.scheduledAt || null,
  });
}

/** Admin — PDOT training completed. Requires bond received; sets GCC ready. */
export async function markPdotCompleted(userId: string, proofUrl?: string): Promise<void> {
  await rpc('admin_mark_pdot_completed', {
    p_user_id: userId,
    p_proof_url: proofUrl || null,
  });
}

/** Admin — deployment checklist. */
export async function updateDeploymentChecklist(input: {
  userId: string;
  offer?: string;
  contract?: string;
  emigration?: string;
  visa?: string;
  insurance?: string;
  ticket?: string;
  deployed?: boolean;
  notes?: string;
}): Promise<void> {
  await rpc('admin_update_deployment_checklist', {
    p_user_id: input.userId,
    p_offer: input.offer || null,
    p_contract: input.contract || null,
    p_emigration: input.emigration || null,
    p_visa: input.visa || null,
    p_insurance: input.insurance || null,
    p_ticket: input.ticket || null,
    p_deployed: input.deployed ?? null,
    p_notes: input.notes || null,
  });
}

/** Admin only — score interview and open payment stage (RLS/trigger enforced). */
export async function recordInterviewScore(
  userId: string,
  score: number,
  notes?: string,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const tradeRequired = skillRequiresTradeTest(row.primary_skill);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      interview_score: score,
      interview_notes: notes || null,
      interview_rated_at: new Date().toISOString(),
      trade_test_required: tradeRequired,
      trade_test_status: tradeRequired ? 'pending' : 'not_required',
      stage: 'awaiting_payment',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  const next = data as WorkerVerification;
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
}

/**
 * Pilot path — skip waiting for admin video-interview score.
 * Advances awaiting_interview (or identity after KYC) → awaiting_payment.
 */
export async function waiveAssessmentInterviewPilot(userId: string): Promise<WorkerVerification> {
  // If DB still on identity after KYC submit, nudge stage before pilot waive.
  const current = await getOrCreateVerification(userId);
  if (current.stage === 'identity') {
    const { error: nudgeErr } = await supabase
      .from('worker_verification')
      .update({ stage: 'awaiting_interview', updated_at: new Date().toISOString() })
      .eq('id', current.id);
    if (nudgeErr) {
      console.warn('Could not advance identity → interview before pilot waive:', nudgeErr.message);
    }
  }

  const { data, error } = await supabase.rpc('waive_assessment_interview_pilot');
  if (error) {
    const msg = error.message || 'Could not skip interview';
    if (/could not find the function|schema cache|PGRST202/i.test(msg)) {
      throw new Error(
        'Interview pilot RPC missing. Run supabase/migrations/20260731192000_waive_interview_pilot.sql (and 20260803120000_waive_interview_accept_identity.sql) in Lovable SQL, then retry.',
      );
    }
    throw new Error(msg);
  }
  const next = (data || (await getOrCreateVerification(userId))) as WorkerVerification;
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
}

/**
 * Pilot path — fee waived via SECURITY DEFINER RPC.
 * Prefer payAssessmentFeeWithRazorpay when Razorpay is configured.
 */
export async function waiveAssessmentPaymentPilot(userId: string): Promise<WorkerVerification> {
  const { data, error } = await supabase.rpc('waive_assessment_payment_pilot');
  if (error) throw new Error(error.message);
  const next = (data || (await getOrCreateVerification(userId))) as WorkerVerification;
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
}

/**
 * Create Razorpay order → Checkout → verify signature via edge function → advance stage.
 */
const RZP_FN_URL = `${String(
  import.meta.env.VITE_SUPABASE_URL || 'https://etpiadoqryvtlpmiuxia.supabase.co',
).replace(/\/$/, '')}/functions/v1/razorpay-assessment`;
const RZP_PENDING_KEY = 'safework.razorpay.pending';

type RazorpayFnResponse = {
  error?: string;
  order_id?: string;
  amount_inr?: number;
  key_id?: string;
  verification?: WorkerVerification;
  already_paid?: boolean;
  recovered?: boolean;
};

/** Call the edge function with fetch so the real { error } body surfaces. */
async function callRazorpayFn(body: Record<string, unknown>): Promise<RazorpayFnResponse> {
  await supabase.auth.refreshSession().catch(() => null);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Your session expired. Please sign in again.');

  const res = await fetch(RZP_FN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  let json: RazorpayFnResponse = {};
  try {
    json = (await res.json()) as RazorpayFnResponse;
  } catch {
    json = {};
  }
  if (!res.ok || json?.error) {
    throw new Error(json?.error || `Payment service error (${res.status})`);
  }
  return json;
}

function storePendingCheckout(payload: {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}) {
  try {
    sessionStorage.setItem(RZP_PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function readPendingCheckout(): {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
} | null {
  try {
    const raw = sessionStorage.getItem(RZP_PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(RZP_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

async function currentVerification(): Promise<WorkerVerification> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('Not signed in');
  return getOrCreateVerification(uid);
}

function normalized(next: WorkerVerification): WorkerVerification {
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
}

/**
 * Manual/automatic recovery: confirm a real Razorpay capture and unlock the journey.
 */
export async function syncAssessmentPaymentAfterCheckout(): Promise<WorkerVerification> {
  const pending = readPendingCheckout();
  const res = await callRazorpayFn({
    action: 'recover_payment',
    razorpay_order_id: pending?.razorpay_order_id,
    razorpay_payment_id: pending?.razorpay_payment_id,
  });
  clearPendingCheckout();
  return normalized(res.verification || (await currentVerification()));
}

export async function payAssessmentFeeWithRazorpay(opts?: {
  name?: string | null;
  email?: string | null;
  contact?: string | null;
}): Promise<WorkerVerification> {
  const { openRazorpayCheckout } = await import('../lib/razorpayCheckout');

  const orderData = await callRazorpayFn({ action: 'create_order' });

  // Already paid on an earlier attempt — no double charge.
  if (orderData.recovered && orderData.verification) {
    clearPendingCheckout();
    return normalized(orderData.verification);
  }

  const orderId = String(orderData?.order_id || '');
  const amountInr = Number(orderData?.amount_inr || ASSESSMENT_FEE_INR);
  const keyId = String(orderData?.key_id || '');
  if (!orderId) throw new Error('Razorpay order was not created');
  if (!keyId.startsWith('rzp_')) {
    throw new Error(
      'Razorpay key missing from server. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET on the razorpay-assessment edge function (not VITE_).',
    );
  }

  const checkout = await openRazorpayCheckout({
    amountInr,
    description: 'SafeWork Global assessment fee',
    name: opts?.name || undefined,
    email: opts?.email || undefined,
    contact: opts?.contact || undefined,
    orderId,
    keyId,
  });

  storePendingCheckout({
    razorpay_payment_id: checkout.razorpay_payment_id,
    razorpay_order_id: checkout.razorpay_order_id || orderId,
    razorpay_signature: checkout.razorpay_signature,
  });

  try {
    const verifyData = await callRazorpayFn({
      action: 'verify_payment',
      razorpay_payment_id: checkout.razorpay_payment_id,
      razorpay_order_id: checkout.razorpay_order_id || orderId,
      razorpay_signature: checkout.razorpay_signature,
    });
    clearPendingCheckout();
    return normalized(verifyData.verification || (await currentVerification()));
  } catch (verifyError) {
    // Charged but verification failed — try recovery before surfacing the error.
    try {
      return await syncAssessmentPaymentAfterCheckout();
    } catch {
      throw verifyError instanceof Error ? verifyError : new Error('Payment verification failed');
    }
  }
}

/**
 * Admin only until Razorpay webhook verification ships.
 * Workers cannot mark paid (DB trigger + payment RLS).
 */
export async function markPaymentPaid(
  userId: string,
  amount: number,
  opts?: {
    provider?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  },
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const tradeRequired =
    row.trade_test_required ?? skillRequiresTradeTest(row.primary_skill);
  const nextStage: VerificationStage = tradeRequired ? 'trade_test' : 'medical';

  const { error: payErr } = await supabase.from('worker_assessment_payments').insert({
    user_id: userId,
    amount,
    status: 'paid',
    provider: opts?.provider || 'manual',
    paid_at: new Date().toISOString(),
  });
  if (payErr) throw new Error(payErr.message);

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      payment_status: 'paid',
      payment_amount: amount,
      paid_at: new Date().toISOString(),
      trade_test_required: tradeRequired,
      trade_test_status: tradeRequired ? row.trade_test_status || 'pending' : 'not_required',
      razorpay_payment_id: opts?.razorpayPaymentId || null,
      razorpay_order_id: opts?.razorpayOrderId || null,
      stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  const next = data as WorkerVerification;
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
}

/** Worker confirms auto-assigned trade test centre (by home state). */
export async function bookTradeTestCenter(
  userId: string,
  input: {
    centerId: string;
    centerName: string;
    reportingWindow: string;
  },
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      trade_test_center_id: input.centerId,
      trade_test_center_name: input.centerName,
      trade_test_reporting_window: input.reportingWindow,
      trade_test_booked_at: new Date().toISOString(),
      trade_test_status: row.trade_test_status === 'passed' ? 'passed' : 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/** Worker uploads result; admin must pass to advance. */
export async function submitTradeTestResult(
  userId: string,
  resultUrl: string,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  if (!row.trade_test_center_id) {
    throw new Error('Confirm your trade test centre before uploading the result');
  }
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      trade_test_result_url: resultUrl,
      trade_test_status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

export type MedicalTestDocuments = {
  bloodReportUrl: string;
  xrayReportUrl: string;
  xrayPhotoUrl: string;
};

export function medicalTestDocumentsComplete(row: {
  medical_blood_report_url?: string | null;
  medical_xray_report_url?: string | null;
  medical_xray_photo_url?: string | null;
  medical_result_url?: string | null;
}): boolean {
  return Boolean(
    (row.medical_blood_report_url || row.medical_result_url) &&
      row.medical_xray_report_url &&
      row.medical_xray_photo_url,
  );
}

/** Worker uploads blood report, X-ray report, and X-ray photo; admin must pass to advance. */
export async function submitMedicalResult(
  userId: string,
  docs: MedicalTestDocuments,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      medical_blood_report_url: docs.bloodReportUrl,
      medical_xray_report_url: docs.xrayReportUrl,
      medical_xray_photo_url: docs.xrayPhotoUrl,
      medical_result_url: docs.bloodReportUrl,
      medical_status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/** Admin — pass trade test and move to medical. */
export async function approveTradeTest(userId: string): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      trade_test_status: 'passed',
      stage: 'medical',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/** Admin — pass medical and move to bond. */
export async function approveMedical(userId: string): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  if (!medicalTestDocumentsComplete(row)) {
    throw new Error('Worker must upload blood report, X-ray report, and X-ray photo');
  }
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      medical_status: 'passed',
      stage: 'bond',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/** @deprecated Prefer submitTradeTestResult / submitMedicalResult */
export async function markTestsPassed(userId: string): Promise<WorkerVerification> {
  throw new Error('Admin must approve trade/medical results');
}

/** Admin — approve bond documents. Does not skip PDOT; original must still be marked received. */
export async function approveBond(userId: string): Promise<void> {
  await rpc('admin_review_bond_security', {
    p_user_id: userId,
    p_action: 'approve',
    p_reason: null,
  });
}

export function stageIndex(stage: VerificationStage): number {
  const order = [
    'essentials',
    'quiz',
    'media',
    'identity',
    'awaiting_interview',
    'awaiting_payment',
    'trade_test',
    'medical',
    'bond',
    'gcc_ready',
  ];
  const normalized = normalizeVerificationStage(stage);
  return Math.max(0, order.indexOf(normalized));
}

/**
 * Dev / preview only — wipe journey progress so QA can re-test from essentials.
 * Never call this from production UI (gated in the page).
 */
export async function resetVerificationJourney(userId: string): Promise<WorkerVerification> {
  await supabase.from('worker_skill_quiz_responses').delete().eq('user_id', userId);
  await supabase.from('worker_verification_interviews').delete().eq('user_id', userId);
  await supabase.from('worker_assessment_payments').delete().eq('user_id', userId);
  await supabase.from('worker_bonds').delete().eq('user_id', userId);
  await supabase.from('worker_bond_security_files').delete().eq('user_id', userId);
  await supabase.from('worker_bond_security').delete().eq('user_id', userId);

  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      stage: 'essentials',
      terms_accepted_at: null,
      terms_version: null,
      email: null,
      city: null,
      state: null,
      education_level: null,
      primary_skill: null,
      essentials_completed_at: null,
      quiz_score: null,
      quiz_completed_at: null,
      media_submitted_at: null,
      interview_score: null,
      interview_notes: null,
      interview_rated_at: null,
      trade_test_required: true,
      payment_status: 'pending',
      payment_amount: null,
      paid_at: null,
      medical_status: 'pending',
      trade_test_status: 'pending',
      trade_test_result_url: null,
      trade_test_center_id: null,
      trade_test_center_name: null,
      trade_test_reporting_window: null,
      trade_test_booked_at: null,
      medical_result_url: null,
      medical_blood_report_url: null,
      medical_xray_report_url: null,
      medical_xray_photo_url: null,
      razorpay_payment_id: null,
      razorpay_order_id: null,
      bond_status: 'pending',
      bond_rejection_reason: null,
      gcc_ready_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('worker_profiles')
    .update({
      tenth_pass_confirmed: false,
      ecr_category: null,
      ecr_status: null,
    })
    .eq('user_id', userId);

  return data as WorkerVerification;
}

