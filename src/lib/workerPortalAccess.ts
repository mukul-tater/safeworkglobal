import { supabase } from '@/integrations/supabase/client';
import { emitraReviewBlockMessage } from '@/lib/emitraReviewBlock';

/**
 * eMitra-sourced workers onboarded via partner OTP are login-ready.
 * Only rejected rows are blocked from the portal.
 * Organic workers use review_status = not_required.
 */
export async function getEmitraReviewBlockMessage(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('source_type, review_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return emitraReviewBlockMessage(data.source_type, data.review_status);
}

/** Apply is allowed after Essentials (Find jobs / Apply journey steps). */
export async function isWorkerReadyToApply(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('worker_can_apply_to_jobs', { p_user_id: userId });
  if (error) return false;
  return Boolean(data);
}

export async function isWorkerGccReady(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('worker_verification')
    .select('stage, gcc_ready_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return false;
  return data.stage === 'gcc_ready' || !!data.gcc_ready_at;
}
