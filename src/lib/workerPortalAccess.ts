import { supabase } from '@/integrations/supabase/client';

/**
 * eMitra-sourced workers must be approved before using the worker portal / applying.
 * Organic workers use review_status = not_required.
 */
export async function getEmitraReviewBlockMessage(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('source_type, review_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.source_type !== 'emitra') return null;

  if (data.review_status === 'pending') {
    return 'Your eMitra registration is pending SafeWork approval. You will be able to sign in once approved.';
  }
  if (data.review_status === 'rejected') {
    return 'Your eMitra registration was not approved. Contact support or your partner centre.';
  }
  return null;
}

/** Apply / job interest requires GCC-ready verification stage. */
export async function isWorkerGccReady(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('worker_verification')
    .select('stage, gcc_ready_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return false;
  return data.stage === 'gcc_ready' || !!data.gcc_ready_at;
}
