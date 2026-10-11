import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import type { WorkerVerification } from '@/modules/worker-verification/types';

const supabase: any = supabaseTyped;

export type JobOfferLetter = {
  id: string | null;
  user_id: string;
  job_id: string;
  job_title: string | null;
  stage: string | null;
  interview_status: string | null;
  payment_taken: boolean;
  file_name: string | null;
  storage_path: string | null;
  version: number | null;
  status: 'pending' | 'accepted' | 'declined' | null;
  downloaded_version: number | null;
  accepted_at: string | null;
  accepted_phone: string | null;
  declined_at: string | null;
  uploaded_role: 'admin' | 'employer' | null;
};

export type OfferLetterQueueRow = {
  user_id: string;
  job_id: string;
  stage: string;
  full_name: string | null;
  phone: string | null;
  job_title: string | null;
  job_country: string | null;
  posted_by_role: string | null;
  file_name: string | null;
  version: number | null;
  letter_status: 'pending' | 'accepted' | 'declined' | null;
  downloaded_version: number | null;
  accepted_at: string | null;
  declined_at: string | null;
  uploaded_role: 'admin' | 'employer' | null;
  updated_at: string;
};

function asLetter(data: unknown): JobOfferLetter | null {
  if (!data || typeof data !== 'object') return null;
  return data as JobOfferLetter;
}

export function offerFileReady(letter: JobOfferLetter | null): boolean {
  return Boolean(letter?.id && letter.storage_path && letter.version);
}

export function offerDownloaded(letter: JobOfferLetter | null): boolean {
  return Boolean(
    letter?.version && letter.downloaded_version && letter.downloaded_version === letter.version,
  );
}

export async function getJobOffer(userId?: string | null): Promise<JobOfferLetter | null> {
  const { data, error } = await supabase.rpc('worker_get_job_offer', {
    p_user_id: userId || null,
  });
  if (error) throw new Error(error.message);
  return asLetter(data);
}

export async function listJobOfferQueue(): Promise<OfferLetterQueueRow[]> {
  const { data, error } = await supabase.rpc('list_job_offer_queue');
  if (error) throw new Error(error.message);
  return (data || []) as OfferLetterQueueRow[];
}

export async function uploadJobOfferLetter(userId: string, jobId: string, file: File): Promise<JobOfferLetter> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) throw new Error('Upload a PDF offer letter');
  if (file.size > 8 * 1024 * 1024) throw new Error('PDF must be 8 MB or smaller');
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_') || 'offer-letter.pdf';
  const filename = safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
  const path = `${userId}/${jobId}/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage.from('offer-letters').upload(path, file, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);
  const { data, error } = await supabase.rpc('register_job_offer_letter', {
    p_user_id: userId,
    p_path: path,
    p_file_name: file.name,
  });
  if (error) throw new Error(error.message);
  const letter = asLetter(data);
  if (!letter) throw new Error('Offer letter could not be saved');
  return letter;
}

export async function offerLetterSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('offer-letters').createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not open the offer letter');
  return data.signedUrl;
}

export async function markOfferDownloaded(userId?: string | null): Promise<JobOfferLetter> {
  const { data, error } = await supabase.rpc('worker_mark_offer_downloaded', {
    p_user_id: userId || null,
  });
  if (error) throw new Error(error.message);
  const letter = asLetter(data);
  if (!letter?.storage_path) throw new Error('No offer letter on this job yet');
  return letter;
}

export async function declineJobOffer(userId?: string | null): Promise<JobOfferLetter> {
  const { data, error } = await supabase.rpc('worker_decline_job_offer', {
    p_user_id: userId || null,
  });
  if (error) throw new Error(error.message);
  const letter = asLetter(data);
  if (!letter) throw new Error('Offer letter could not be declined');
  return letter;
}

export async function acceptJobOffer(userId: string, idToken: string): Promise<WorkerVerification> {
  const { data, error } = await supabase.functions.invoke('accept-job-offer', {
    body: { idToken, userId },
  });
  if (error) {
    let message = error.message || 'Offer letter could not be accepted';
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = String(body.error);
    } catch {
      /* keep the client message */
    }
    throw new Error(message);
  }
  const verification = (data as { verification?: WorkerVerification; error?: string } | null)?.verification;
  const serverError = (data as { error?: string } | null)?.error;
  if (!verification) throw new Error(serverError || 'Offer letter could not be accepted');
  return verification;
}
