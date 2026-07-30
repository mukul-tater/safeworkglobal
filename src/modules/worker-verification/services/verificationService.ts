import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import type { SkillQuizItem, VerificationStage, WorkerVerification } from '../types';
import { INTERVIEW_TRADE_TEST_THRESHOLD, WORKER_TERMS_VERSION } from '../constants';

const supabase: any = supabaseTyped;

export async function getOrCreateVerification(userId: string): Promise<WorkerVerification> {
  const { data: existing, error: fetchErr } = await supabase
    .from('worker_verification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (existing) return existing as WorkerVerification;

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

  await supabase.from('profiles').update({ email: input.email }).eq('id', userId);

  // Ensure a worker_skills row for media uploads
  const { data: existingSkill } = await supabase
    .from('worker_skills')
    .select('id')
    .eq('worker_id', userId)
    .eq('skill_name', input.primary_skill)
    .maybeSingle();

  if (!existingSkill) {
    await supabase.from('worker_skills').insert({
      worker_id: userId,
      skill_name: input.primary_skill,
      proficiency_level: 'intermediate',
      years_of_experience: 0,
    });
  }

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      email: input.email,
      city: input.city,
      state: input.state,
      education_level: input.education_level,
      primary_skill: input.primary_skill,
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
  const { data, error } = await supabase
    .from('worker_skill_quiz_items')
    .select('id, skill_code, question, youtube_url, image_url, expected_answer, sort_order')
    .eq('active', true)
    .in('skill_code', [skill, 'Other'])
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  const items = (data || []) as SkillQuizItem[];
  const forSkill = items.filter((i) => i.skill_code === skill);
  return forSkill.length >= 3 ? forSkill : items.filter((i) => i.skill_code === 'Other');
}

export async function submitQuiz(
  userId: string,
  answers: { quiz_item_id: string; answer: boolean; expected: boolean }[],
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const payload = answers.map((a) => ({
    user_id: userId,
    quiz_item_id: a.quiz_item_id,
    answer: a.answer,
    is_correct: a.answer === a.expected,
  }));

  const { error: upsertErr } = await supabase
    .from('worker_skill_quiz_responses')
    .upsert(payload, { onConflict: 'user_id,quiz_item_id' });
  if (upsertErr) throw new Error(upsertErr.message);

  const correct = payload.filter((p) => p.is_correct).length;
  const score = payload.length ? Math.round((correct / payload.length) * 1000) / 10 : 0;

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
 * Soft KYC — PAN + Aadhaar last-4 + document uploads. Required before job apply.
 * Advances to Test 2 (video interview) when coming from the identity stage;
 * if the worker already finished later stages, keep their stage.
 */
export async function completeIdentityKyc(
  userId: string,
  opts: {
    panNumber: string;
    aadhaarLast4: string;
    nextStageIfCurrentIdentity?: boolean;
  },
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const stay =
    row.stage !== 'identity' &&
    row.stage !== 'media' &&
    row.stage !== 'essentials' &&
    row.stage !== 'quiz';

  const { error: wpErr } = await supabase.from('worker_profiles').upsert(
    {
      user_id: userId,
      pan_number: opts.panNumber.trim().toUpperCase(),
      aadhaar_last4: opts.aadhaarLast4,
      kyc_status: 'submitted',
    } as any,
    { onConflict: 'user_id' },
  );
  if (wpErr) throw new Error(wpErr.message);

  const nextStage = stay ? row.stage : 'awaiting_interview';
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

/** Admin/dev helper — mark interview scored (also usable for demo from UI later). */
export async function recordInterviewScore(
  userId: string,
  score: number,
  notes?: string,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const tradeRequired = score < INTERVIEW_TRADE_TEST_THRESHOLD;
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
  return data as WorkerVerification;
}

export async function markPaymentPaid(userId: string, amount: number): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  await supabase.from('worker_assessment_payments').insert({
    user_id: userId,
    amount,
    status: 'paid',
    provider: 'manual',
    paid_at: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      payment_status: 'paid',
      payment_amount: amount,
      paid_at: new Date().toISOString(),
      stage: 'tests',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

export async function markTestsPassed(userId: string): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  const tradeStatus = row.trade_test_required ? 'passed' : 'not_required';
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      medical_status: 'passed',
      trade_test_status: tradeStatus,
      stage: 'bond',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

export async function submitBond(
  userId: string,
  method: 'estamp' | 'emitra' | 'physical_upload',
  stampDocUrl?: string,
  videoProofUrl?: string,
): Promise<WorkerVerification> {
  const row = await getOrCreateVerification(userId);
  await supabase.from('worker_bonds').insert({
    user_id: userId,
    method,
    stamp_doc_url: stampDocUrl || null,
    video_proof_url: videoProofUrl || null,
    status: 'submitted',
  });

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
    'tests',
    'bond',
    'gcc_ready',
  ];
  return Math.max(0, order.indexOf(stage));
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

