import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { inferWorkerSkillFromJob } from '@/lib/inferWorkerSkillFromJob';
import { skillRequiresTradeTest } from '../constants';
import type { WorkerVerification } from '../types';
import {
  ensureWorkerSkillRow,
  getOrCreateVerification,
  payJobChangeFeeWithRazorpay,
  uploadBankTransferProof,
} from './verificationService';

const supabase: any = supabaseTyped;

export function canChangeJourneyJob(row: Pick<WorkerVerification, 'stage' | 'gcc_ready_at'>): boolean {
  if (row.gcc_ready_at) return false;
  return row.stage !== 'gcc_ready' && row.stage !== 'deployment';
}

export type JobSwitchPolicy = {
  enabled: boolean;
  blocked: boolean;
  feeDue: number;
  feePaid: boolean;
  canSwitch: boolean;
  reason: string | null;
};

export async function getJobSwitchPolicy(workerUserId: string): Promise<JobSwitchPolicy> {
  const { data, error } = await supabase.rpc('job_switch_policy', { p_user_id: workerUserId });
  if (error) throw new Error(error.message);
  const row = (data || {}) as Record<string, unknown>;
  return {
    enabled: row.enabled !== false,
    blocked: Boolean(row.blocked),
    feeDue: Number(row.fee_due || 0),
    feePaid: Boolean(row.fee_paid),
    canSwitch: Boolean(row.can_switch),
    reason: typeof row.reason === 'string' ? row.reason : null,
  };
}

async function syncSkillFromJob(
  row: WorkerVerification,
  opts: {
    jobId: string;
    title?: string;
    description?: string;
    skills?: string[];
    advanceFromFindJobs?: boolean;
  },
): Promise<WorkerVerification> {
  const nextSkill = inferWorkerSkillFromJob(
    opts.title || '',
    opts.description || '',
    opts.skills || [],
  );
  const tradeRequired = skillRequiresTradeTest(nextSkill);
  const patch: Record<string, unknown> = {
    journey_job_id: opts.jobId,
    primary_skill: nextSkill,
    trade_test_required: tradeRequired,
    updated_at: new Date().toISOString(),
  };
  if (row.stage === 'quiz' || !row.journey_job_id || row.journey_job_id === opts.jobId) {
    patch.trade_test_status = tradeRequired ? 'pending' : 'not_required';
  }
  if (opts.advanceFromFindJobs && (row.stage === 'find_jobs' || row.stage === 'apply_job')) {
    patch.stage = 'quiz';
  }

  const { data: updated, error: updErr } = await supabase
    .from('worker_verification')
    .update(patch)
    .eq('id', row.id)
    .select('*')
    .single();
  if (updErr) throw new Error(updErr.message);

  await ensureWorkerSkillRow(row.user_id, nextSkill);
  await supabase
    .from('worker_profiles')
    .update({
      primary_skill: nextSkill,
      primary_work_type: nextSkill,
    })
    .eq('user_id', row.user_id);

  return updated as WorkerVerification;
}

export async function applyToJobForJourney(opts: {
  jobId: string;
  workerUserId: string;
  title?: string;
  description?: string;
  skills?: string[];
}): Promise<{ applicationId: string; verification: WorkerVerification | null }> {
  const existing = await getOrCreateVerification(opts.workerUserId);
  if (existing.journey_job_id && existing.journey_job_id !== opts.jobId) {
    throw new Error('CHANGE_JOB_REQUIRED');
  }

  const { data, error } = await supabase.rpc('apply_to_job_for_journey', {
    p_job_id: opts.jobId,
    p_user_id: opts.workerUserId,
  });
  if (error) throw new Error(error.message);

  const row = await getOrCreateVerification(opts.workerUserId);
  const updated = await syncSkillFromJob(row, { ...opts, advanceFromFindJobs: true });

  return {
    applicationId: String(data),
    verification: updated,
  };
}

export async function changeJourneyJob(opts: {
  jobId: string;
  workerUserId: string;
  title?: string;
  description?: string;
  skills?: string[];
}): Promise<{ applicationId: string; verification: WorkerVerification | null }> {
  const existing = await getOrCreateVerification(opts.workerUserId);
  if (!canChangeJourneyJob(existing)) {
    throw new Error('This job cannot be changed after GCC ready');
  }

  const skill = inferWorkerSkillFromJob(opts.title || '', opts.description || '', opts.skills || []);
  const { data, error } = await supabase.rpc('change_journey_job', {
    p_job_id: opts.jobId,
    p_user_id: opts.workerUserId,
    p_primary_skill: skill,
    p_trade_test_required: skillRequiresTradeTest(skill),
  });
  if (error) throw new Error(error.message);

  const row = await getOrCreateVerification(opts.workerUserId);
  if (row.primary_skill) {
    await ensureWorkerSkillRow(row.user_id, row.primary_skill);
    await supabase
      .from('worker_profiles')
      .update({
        primary_skill: row.primary_skill,
        primary_work_type: row.primary_skill,
      })
      .eq('user_id', row.user_id);
  }

  return {
    applicationId: String(data),
    verification: row,
  };
}

export async function payJobChangeFee(opts: {
  workerUserId: string;
  name?: string | null;
  email?: string | null;
  contact?: string | null;
}): Promise<void> {
  await payJobChangeFeeWithRazorpay(opts);
}

export async function submitJobChangeBankTransfer(opts: {
  workerUserId: string;
  method: 'upi' | 'imps' | 'neft' | 'rtgs';
  providerRef: string;
  amount: number;
  transferredOn: string;
  file: File;
}): Promise<void> {
  const proof = await uploadBankTransferProof(opts.workerUserId, opts.file);
  const { error } = await supabase.rpc('submit_job_change_bank_transfer', {
    p_method: opts.method,
    p_provider_ref: opts.providerRef,
    p_proof_path: proof.path,
    p_proof_file_name: proof.fileName,
    p_amount: opts.amount,
    p_transferred_on: opts.transferredOn,
    p_worker_user_id: opts.workerUserId,
  });
  if (error) throw new Error(error.message);
}

export async function toggleFavouriteJob(opts: {
  jobId: string;
  workerUserId: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_saved_job', {
    p_job_id: opts.jobId,
    p_user_id: opts.workerUserId,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listFavouriteJobIds(workerUserId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('user_id', workerUserId);
  if (error) return new Set();
  return new Set((data || []).map((row: { job_id: string }) => row.job_id));
}

export async function listAppliedJobIds(workerUserId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id')
    .eq('worker_id', workerUserId);
  if (error) return new Set();
  return new Set((data || []).map((row: { job_id: string }) => row.job_id));
}
