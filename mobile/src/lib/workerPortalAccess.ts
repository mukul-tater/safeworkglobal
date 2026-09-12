import { supabase } from '../integrations/supabase/client';
import { emitraReviewBlockMessage } from './emitraReviewBlock';

export async function getEmitraReviewBlockMessage(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('source_type, review_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return emitraReviewBlockMessage(data.source_type, data.review_status);
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

export async function getWorkerVerificationStage(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('worker_verification')
    .select('stage')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.stage ?? null;
}
