import { supabase } from '../integrations/supabase/client';
import { isWorkerMobileAuthEmail } from '../lib/workerAuthEmail';
import { assertValidPassportKyc } from '../lib/passport';

export type VerificationStage =
  | 'essentials'
  | 'quiz'
  | 'media'
  | 'identity'
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'trade_test'
  | 'medical'
  | 'bond'
  | 'pdot'
  | 'deployment'
  | 'gcc_ready'
  | string;

export type WorkerVerification = {
  id: string;
  user_id: string;
  stage: VerificationStage;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  education_level?: string | null;
  primary_skill?: string | null;
  terms_accepted_at?: string | null;
  gcc_ready_at?: string | null;
  kyc_status?: string | null;
};

export const JOURNEY_STEPS: { id: VerificationStage; label: string; description: string }[] = [
  { id: 'essentials', label: 'Essentials', description: 'Contact, education, location' },
  { id: 'find_jobs', label: 'Find jobs', description: 'Apply to one UAE job. Tests match that job.' },
  { id: 'quiz', label: 'Test 1', description: 'Skill knowledge quiz' },
  { id: 'media', label: 'Skill proof', description: 'Upload work photos / video' },
  { id: 'identity', label: 'Identity (KYC)', description: 'PAN, Aadhaar, and passport valid 6+ months' },
  { id: 'awaiting_interview', label: 'Test 2', description: 'Video interview' },
  { id: 'awaiting_payment', label: 'Payment', description: 'Assessment fee' },
  { id: 'trade_test', label: 'Trade test', description: 'Physical skill assessment' },
  { id: 'medical', label: 'Medical', description: 'HIV blood test & TB chest X-ray at any nearest laboratory' },
  { id: 'bond', label: 'Agreement', description: 'Indemnity Bond on ₹100 stamp paper, notary, Aadhaar copies' },
  { id: 'pdot', label: 'PDOT', description: 'Pre-departure orientation' },
  { id: 'deployment', label: 'Deployment', description: 'Travel & placement' },
  { id: 'gcc_ready', label: 'GCC ready', description: 'Eligible to apply for jobs' },
];

export const MEDICAL_TEST_SCREENING_NOTE =
  'Get these tests done at any nearest laboratory, then upload the reports on the portal. Blood test screens for HIV, Syphilis, and Hepatitis B & C. Chest X-ray screens for active or pulmonary Tuberculosis (TB). Additional vaccinations or tests may apply for food handlers or healthcare workers.';

export const EDUCATION_LEVELS = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'ITI / Trade Certificate',
  'Diploma',
  'Graduate',
  'Post Graduate',
  'Other',
] as const;

function ecrFromTenthPass(tenthPass: boolean) {
  if (tenthPass) {
    return {
      tenth_pass_confirmed: true,
      ecr_category: 'ECNR' as const,
      ecr_status: 'not_required' as const,
    };
  }
  return {
    tenth_pass_confirmed: false,
    ecr_category: 'ECR' as const,
    ecr_status: 'required' as const,
  };
}

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
      terms_version: 'worker-v1-2026-07',
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
    tenth_pass: boolean;
  },
): Promise<WorkerVerification> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@') || isWorkerMobileAuthEmail(email)) {
    throw new Error('Enter a real contact email (not the mobile login email).');
  }

  const row = await getOrCreateVerification(userId);
  const ecr = ecrFromTenthPass(input.tenth_pass);

  const { error: profileErr } = await supabase.from('worker_profiles').upsert(
    {
      user_id: userId,
      current_city: input.city,
      current_location: [input.city, input.state].filter(Boolean).join(', '),
      experience_range: input.education_level,
      tenth_pass_confirmed: ecr.tenth_pass_confirmed,
      ecr_category: ecr.ecr_category,
      ecr_status: ecr.ecr_status,
    },
    { onConflict: 'user_id' },
  );
  if (profileErr) throw new Error(profileErr.message);

  await supabase.from('profiles').update({ email }).eq('id', userId);

  const nextStage = row.stage === 'essentials' || !row.stage ? 'find_jobs' : row.stage;
  const { data, error } = await supabase
    .from('worker_verification')
    .update({
      email,
      city: input.city,
      state: input.state,
      education_level: input.education_level,
      stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as WorkerVerification;
}

export async function submitIdentity(
  userId: string,
  input: {
    pan_number?: string;
    aadhaar_last4?: string;
    passport_number: string;
    passport_expiry: string;
  },
): Promise<void> {
  const row = await getOrCreateVerification(userId);
  const { passportNumber, passportExpiry } = assertValidPassportKyc({
    number: input.passport_number,
    expiry: input.passport_expiry,
  });

  await supabase.from('worker_profiles').upsert(
    {
      user_id: userId,
      pan_number: input.pan_number || null,
      aadhaar_last4: input.aadhaar_last4 || null,
      passport_number: passportNumber,
      passport_expiry: passportExpiry,
      has_passport: true,
      kyc_status: 'submitted',
      kyc_submitted_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  const { error } = await supabase
    .from('worker_verification')
    .update({
      stage: 'awaiting_interview',
      kyc_status: 'submitted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (error) throw new Error(error.message);
}

export function stageIndex(stage: string | null | undefined): number {
  const idx = JOURNEY_STEPS.findIndex((s) => s.id === stage);
  return idx < 0 ? 0 : idx;
}
