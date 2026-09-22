import { supabase } from '@/integrations/supabase/client';
import { getWorkerDocumentSignedUrl } from '@/lib/storage';
import { loadWorkerSkillsWithMedia, type WorkerSkillWithMedia } from '@/lib/workerSkillMedia';
import { displayableEmail } from '@/lib/workerAuthEmail';
import { listMedicalReports } from '@/modules/worker-verification/services/verificationService';
import type { MedicalReport } from '@/modules/worker-verification/types';
import { signedEvidenceUrl } from '@/modules/trade-test/services/assessmentService';
import type { AssessmentMediaRow, AssessmentRow, AssessmentScoresRow } from '@/modules/trade-test/types';

export type ShareRecipientType = 'employer' | 'ra';

export interface ShareRecipient {
  recipient_type: ShareRecipientType;
  recipient_id: string;
  name: string;
  detail: string;
}

export interface WorkerShareRow {
  share_id: string;
  recipient_type: ShareRecipientType;
  recipient_id: string;
  recipient_name: string;
  recipient_detail: string;
  share_token: string;
  created_at: string;
  revoked_at: string | null;
}

export interface CreatedWorkerShare {
  share_id: string;
  share_token: string;
  recipient_type: ShareRecipientType;
  recipient_id: string;
}

export interface WorkerShareAccess {
  share_id: string;
  worker_id: string;
  worker_name: string;
  recipient_type: ShareRecipientType;
  recipient_id: string;
  recipient_name: string;
}

export interface MySharedWorker {
  share_id: string;
  worker_id: string;
  share_token: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  primary_work_type: string | null;
  current_location: string | null;
}

export interface DossierDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  verification_status: string | null;
  uploaded_at: string | null;
}

export interface DossierExperience {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

export interface DossierCertification {
  id: string;
  certification_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_url: string | null;
  verified: boolean | null;
}

export interface DossierTradeTest {
  assessment: AssessmentRow;
  scores: AssessmentScoresRow | null;
  media: Array<AssessmentMediaRow & { url: string }>;
}

export interface WorkerDossier {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  workerProfile: Record<string, unknown> | null;
  skills: WorkerSkillWithMedia[];
  experiences: DossierExperience[];
  certifications: DossierCertification[];
  documents: DossierDocument[];
  medicalReports: MedicalReport[];
  tradeTests: DossierTradeTest[];
}

const SHARE_RETURN_KEY = 'swg_share_return';

export function workerShareUrl(token: string): string {
  return `${window.location.origin}/shared-worker/${token}`;
}

export function rememberShareReturnPath(path: string): void {
  try {
    sessionStorage.setItem(SHARE_RETURN_KEY, path);
  } catch {
    /* ignore */
  }
}

export function peekShareReturnPath(): string | null {
  try {
    const next = sessionStorage.getItem(SHARE_RETURN_KEY);
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  } catch {
    /* ignore */
  }
  return null;
}

export function consumeShareReturnPath(): string | null {
  const next = peekShareReturnPath();
  try {
    sessionStorage.removeItem(SHARE_RETURN_KEY);
  } catch {
    /* ignore */
  }
  return next;
}

export async function listShareRecipients(query = ''): Promise<ShareRecipient[]> {
  const { data, error } = await supabase.rpc('admin_list_share_recipients', { p_query: query });
  if (error) throw error;
  return (data ?? []) as ShareRecipient[];
}

export async function listWorkerShares(workerId: string): Promise<WorkerShareRow[]> {
  const { data, error } = await supabase.rpc('admin_list_worker_shares', { p_worker_id: workerId });
  if (error) throw error;
  return (data ?? []) as WorkerShareRow[];
}

export async function createWorkerShare(
  workerId: string,
  recipientType: ShareRecipientType,
  recipientId: string,
): Promise<CreatedWorkerShare> {
  const { data, error } = await supabase.rpc('admin_create_worker_share', {
    p_worker_id: workerId,
    p_recipient_type: recipientType,
    p_recipient_id: recipientId,
  });
  if (error) throw error;
  const row = (data ?? [])[0] as CreatedWorkerShare | undefined;
  if (!row) throw new Error('Share was not created');
  return row;
}

export async function revokeWorkerShare(shareId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_revoke_worker_share', { p_share_id: shareId });
  if (error) throw error;
}

export async function getWorkerShareByToken(token: string): Promise<WorkerShareAccess> {
  const { data, error } = await supabase.rpc('get_worker_share_by_token', { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0] as WorkerShareAccess | undefined;
  if (!row) throw new Error('Share link is invalid');
  return row;
}

export async function listMySharedWorkers(): Promise<MySharedWorker[]> {
  const { data, error } = await supabase.rpc('list_my_shared_workers');
  if (error) throw error;
  return (data ?? []) as MySharedWorker[];
}

async function signDocUrl(urlOrPath: string): Promise<string> {
  try {
    return await getWorkerDocumentSignedUrl(urlOrPath);
  } catch {
    return urlOrPath;
  }
}

export async function loadWorkerDossier(workerId: string): Promise<WorkerDossier> {
  const [
    profileRes,
    workerProfileRes,
    skills,
    experienceRes,
    certsRes,
    docsRes,
    verificationRes,
    assessmentsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone, avatar_url').eq('id', workerId).maybeSingle(),
    supabase.from('worker_profiles').select('*').eq('user_id', workerId).maybeSingle(),
    loadWorkerSkillsWithMedia(workerId).catch(() => [] as WorkerSkillWithMedia[]),
    supabase.from('work_experience').select('*').eq('worker_id', workerId).order('start_date', { ascending: false }),
    supabase.from('worker_certifications').select('*').eq('worker_id', workerId),
    supabase.from('worker_documents').select('*').eq('worker_id', workerId).order('uploaded_at', { ascending: false }),
    supabase.from('worker_verification').select('*').eq('user_id', workerId).maybeSingle(),
    supabase.from('assessments').select('*').eq('worker_id', workerId).order('created_at', { ascending: false }),
  ]);

  const documents = await Promise.all(
    (docsRes.data ?? []).map(async (doc) => ({
      id: doc.id,
      document_name: doc.document_name,
      document_type: doc.document_type,
      file_url: await signDocUrl(doc.file_url),
      verification_status: doc.verification_status,
      uploaded_at: doc.uploaded_at,
    })),
  );

  const medicalReports = listMedicalReports(verificationRes.data ?? {});
  const signedMedical = await Promise.all(
    medicalReports.map(async (report) => ({
      ...report,
      url: await signDocUrl(report.url),
    })),
  );

  const assessments = (assessmentsRes.data ?? []) as unknown as AssessmentRow[];
  const assessmentIds = assessments.map((a) => a.id);
  let scoresByAssessment = new Map<string, AssessmentScoresRow>();
  let mediaByAssessment = new Map<string, AssessmentMediaRow[]>();

  if (assessmentIds.length > 0) {
    const [scoresRes, mediaRes] = await Promise.all([
      supabase.from('assessment_scores').select('*').in('assessment_id', assessmentIds),
      supabase.from('assessment_media').select('*').in('assessment_id', assessmentIds).order('captured_at', { ascending: true }),
    ]);
    (scoresRes.data ?? []).forEach((row) => {
      scoresByAssessment.set(row.assessment_id, row as unknown as AssessmentScoresRow);
    });
    (mediaRes.data ?? []).forEach((row) => {
      const list = mediaByAssessment.get(row.assessment_id) ?? [];
      list.push(row as unknown as AssessmentMediaRow);
      mediaByAssessment.set(row.assessment_id, list);
    });
  }

  const tradeTests: DossierTradeTest[] = await Promise.all(
    assessments.map(async (assessment) => {
      const extraPaths = [
        assessment.kyc_photo_path,
        assessment.kyc_video_path,
        assessment.arrival_photo_path,
      ].filter((p): p is string => Boolean(p));
      const tableMedia = mediaByAssessment.get(assessment.id) ?? [];
      const knownPaths = new Set(tableMedia.map((m) => m.storage_path));
      const extras: AssessmentMediaRow[] = extraPaths
        .filter((path) => !knownPaths.has(path))
        .map((path, i) => ({
          id: `path-${assessment.id}-${i}`,
          assessment_id: assessment.id,
          media_type: path === assessment.kyc_video_path ? 'kyc_video' : path === assessment.arrival_photo_path ? 'arrival_photo' : 'kyc_photo',
          storage_path: path,
          label: path === assessment.kyc_video_path ? 'KYC video' : path === assessment.arrival_photo_path ? 'Arrival photo' : 'KYC photo',
          created_at: assessment.created_at,
          captured_at: assessment.kyc_completed_at || assessment.created_at,
        }));

      const media = await Promise.all(
        [...tableMedia, ...extras].map(async (item) => {
          let url = '';
          try {
            url = await signedEvidenceUrl(item.storage_path);
          } catch {
            url = '';
          }
          return { ...item, url };
        }),
      );

      return {
        assessment,
        scores: scoresByAssessment.get(assessment.id) ?? null,
        media,
      };
    }),
  );

  return {
    profile: {
      id: workerId,
      full_name: profileRes.data?.full_name ?? null,
      email: displayableEmail(profileRes.data?.email) || '',
      phone: profileRes.data?.phone ?? null,
      avatar_url: profileRes.data?.avatar_url ?? null,
    },
    workerProfile: (workerProfileRes.data as Record<string, unknown> | null) ?? null,
    skills,
    experiences: (experienceRes.data ?? []) as DossierExperience[],
    certifications: (certsRes.data ?? []) as DossierCertification[],
    documents,
    medicalReports: signedMedical,
    tradeTests,
  };
}
