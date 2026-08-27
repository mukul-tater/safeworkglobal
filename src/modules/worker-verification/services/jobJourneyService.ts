import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { inferWorkerSkillFromJob } from '@/lib/inferWorkerSkillFromJob';
import { skillRequiresTradeTest } from '../constants';
import type { WorkerVerification } from '../types';
import { getOrCreateVerification } from './verificationService';

const supabase: any = supabaseTyped;

export function canChangeJourneyJob(row: Pick<WorkerVerification, 'stage' | 'gcc_ready_at'>): boolean {
  if (row.gcc_ready_at) return false;
  return row.stage !== 'gcc_ready' && row.stage !== 'deployment';
}

async function patchSkillFromJob(
  row: WorkerVerification,
  opts: {
    jobId: string;
    title?: string;
    description?: string;
    skills?: string[];
    fallbackSkill?: string | null;
  },
): Promise<WorkerVerification> {
  const inferred = inferWorkerSkillFromJob(
    opts.title || '',
    opts.description || '',
    opts.skills || [],
  );
  const nextSkill = inferred !== 'Other' ? inferred : opts.fallbackSkill || null;
  const patch: Record<string, unknown> = {
    journey_job_id: opts.jobId,
    updated_at: new Date().toISOString(),
  };
  if (nextSkill && nextSkill !== row.primary_skill) {
    patch.primary_skill = nextSkill;
    patch.trade_test_required = skillRequiresTradeTest(nextSkill);
    const tradeRequired = skillRequiresTradeTest(nextSkill);
    if (row.stage === 'quiz' || !row.journey_job_id || row.journey_job_id === opts.jobId) {
      patch.trade_test_status = tradeRequired ? 'pending' : 'not_required';
    }
  }
  if (row.stage === 'find_jobs' || row.stage === 'apply_job') {
    patch.stage = 'quiz';
  }

  const { data: updated, error: updErr } = await supabase
    .from('worker_verification')
    .update(patch)
    .eq('id', row.id)
    .select('*')
    .single();
  if (updErr) throw new Error(updErr.message);
  return updated as WorkerVerification;
}

export async function applyToJobForJourney(opts: {
  jobId: string;
  workerUserId: string;
  title?: string;
  description?: string;
  skills?: string[];
  fallbackSkill?: string | null;
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
  const updated = await patchSkillFromJob(row, opts);

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
  fallbackSkill?: string | null;
}): Promise<{ applicationId: string; verification: WorkerVerification | null }> {
  const existing = await getOrCreateVerification(opts.workerUserId);
  if (!canChangeJourneyJob(existing)) {
    throw new Error('This job cannot be changed after GCC ready');
  }

  const { data, error } = await supabase.rpc('change_journey_job', {
    p_job_id: opts.jobId,
    p_user_id: opts.workerUserId,
  });
  if (error) throw new Error(error.message);

  const row = await getOrCreateVerification(opts.workerUserId);
  const inferred = inferWorkerSkillFromJob(
    opts.title || '',
    opts.description || '',
    opts.skills || [],
  );
  const nextSkill = inferred !== 'Other' ? inferred : opts.fallbackSkill || row.primary_skill;
  const tradeRequired = skillRequiresTradeTest(nextSkill);
  const { data: updated, error: updErr } = await supabase
    .from('worker_verification')
    .update({
      primary_skill: nextSkill,
      trade_test_required: tradeRequired,
      trade_test_status: tradeRequired ? 'pending' : 'not_required',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .select('*')
    .single();
  if (updErr) throw new Error(updErr.message);

  return {
    applicationId: String(data),
    verification: updated as WorkerVerification,
  };
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
