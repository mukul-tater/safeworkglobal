import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { isWorkerMobileAuthEmail } from '@/lib/workerAuthEmail';
import type { SkillQuizItem, VerificationStage, WorkerVerification } from '../types';
import {
  WORKER_TERMS_VERSION,
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
  },
): Promise<WorkerVerification> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@') || isWorkerMobileAuthEmail(email)) {
    throw new Error('Enter a real email before continuing. Temporary mobile login emails are not allowed.');
  }

  const row = await getOrCreateVerification(userId);

  await supabase
    .from('worker_profiles')
    .upsert(
      {
        user_id: userId,
        current_city: input.city,
        current_location: [input.city, input.state].filter(Boolean).join(', '),
        primary_skill: input.primary_skill,
        primary_work_type: input.primary_skill,
        experience_range: input.education_level,
      },
      { onConflict: 'user_id' },
    );

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

export async function loadQuizItems(skill: string): Promise<SkillQuizItem[]> {
  // Questions ship in per-skill JSON under quiz-data/ (e.g. welder.questions.json).
  return loadQuizItemsFromJson(skill);
}

export async function submitQuiz(
  userId: string,
  answers: { quiz_item_id: string; answer: boolean; expected: boolean }[],
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const correct = answers.filter((a) => a.answer === a.expected).length;
  const score = answers.length ? Math.round((correct / answers.length) * 1000) / 10 : 0;

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      quiz_score: score,
      quiz_completed_at: new Date().toISOString(),
      stage: 'media',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
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
 * Soft KYC — PAN + Aadhaar last-4 + passport number + document photos.
 * Advances to Test 2 (video interview) when coming from the identity stage;
 * if the worker already finished later stages, keep their stage.
 */
export async function completeIdentityKyc(
  userId: string,
  opts: {
    panNumber: string;
    aadhaarLast4: string;
    passportNumber: string;
    nextStageIfCurrentIdentity?: boolean;
  },
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const stay =
    row.stage !== 'identity' &&
    row.stage !== 'media' &&
    row.stage !== 'essentials' &&
    row.stage !== 'quiz';

  const now = new Date().toISOString();
  const passport = opts.passportNumber.trim().toUpperCase();
  const kycPayload = {
    user_id: userId,
    pan_number: opts.panNumber.trim().toUpperCase(),
    aadhaar_last4: opts.aadhaarLast4,
    passport_number: passport,
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

  const nextStage = stay ? row.stage : 'awaiting_interview';
  if (nextStage === row.stage) {
    return { ...row, updated_at: now };
  }

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      stage: nextStage,
      updated_at: now,
    })
    .eq('id', row.id)
    .select('*')
    .single();

  // KYC profile write already succeeded — don't fail the whole submit if stage
  // advance is blocked (e.g. identity stage constraint not applied yet).
  if (error) {
    console.warn('Identity KYC stage advance failed:', error.message);
    return { ...row, updated_at: now };
  }
  return data as WorkerVerification;
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
 * Pilot path until Razorpay is live — calls SECURITY DEFINER RPC.
 * Advances awaiting_payment → trade_test | medical with provider pilot_waive.
 */
export async function waiveAssessmentPaymentPilot(userId: string): Promise<WorkerVerification> {
  const { data, error } = await supabase.rpc('waive_assessment_payment_pilot');
  if (error) throw new Error(error.message);
  const next = (data || (await getOrCreateVerification(userId))) as WorkerVerification;
  return { ...next, stage: normalizeVerificationStage(next.stage, next.trade_test_required) };
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

/** Worker uploads result; admin must pass to advance. */
export async function submitMedicalResult(
  userId: string,
  resultUrl: string,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      medical_result_url: resultUrl,
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

/** Worker submits bond for admin review — does not grant GCC ready. */
export async function submitBond(
  userId: string,
  method: 'estamp' | 'emitra' | 'physical_upload',
  stampDocUrl?: string,
  videoProofUrl?: string,
): Promise<WorkerVerification> {
  if (!stampDocUrl?.trim() || !videoProofUrl?.trim()) {
    throw new Error('Stamp paper and video proof uploads are required');
  }
  const row = await getOrCreateVerification(userId);
  const { error: bondErr } = await supabase.from('worker_bonds').insert({
    user_id: userId,
    method,
    stamp_doc_url: stampDocUrl,
    video_proof_url: videoProofUrl,
    status: 'submitted',
  });
  if (bondErr) throw new Error(bondErr.message);

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      bond_status: 'submitted',
      stage: 'bond',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  return data as WorkerVerification;
}

/** Admin — approve bond and mark GCC ready. */
export async function approveBond(userId: string): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      bond_status: 'approved',
      stage: 'gcc_ready',
      gcc_ready_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('worker_profiles')
    .update({ onboarding_completed: true, onboarded_at: new Date().toISOString() })
    .eq('user_id', userId);

  await supabase
    .from('worker_bonds')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'submitted');

  return data as WorkerVerification;
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
      razorpay_payment_id: null,
      razorpay_order_id: null,
      bond_status: 'pending',
      gcc_ready_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

