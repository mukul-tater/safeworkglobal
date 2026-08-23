import { supabase as supabaseTyped } from '@/integrations/supabase/client';
// Many tables referenced here (partner_workers, partner_activities, partner_incentives,
// partner_worker_status_history) and the partner-worker-media bucket are not yet in the
// generated types. Use an untyped client to avoid TS schema errors until migrations land.
const supabase: any = supabaseTyped;
import { calculateMigrationScore, getMigrationCategory } from '../lib/migrationScore';
import type {
  DashboardStats,
  PartnerActivity,
  PartnerIncentive,
  PartnerProfile,
  PartnerWorker,
  WorkerStatusHistory,
} from '../types/emitra.types';
import { getLspSession } from '@/modules/lsp/services/lspSession';

export async function getPartnerProfile(userId: string): Promise<PartnerProfile | null> {
  const { data } = await supabase
    .from('partner_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as PartnerProfile | null;
}

export type PartnerApplicationPayload = Partial<
  Omit<PartnerProfile, 'id' | 'user_id' | 'status' | 'partner_code' | 'tier'>
> & {
  current_step?: number;
  submitted_at?: string | null;
  status?: string;
};

const EMITRA_V2_COLUMNS = [
  'gst_number',
  'csc_id',
  'shop_name',
  'address_line1',
  'address_line2',
  'village',
  'panchayat',
  'city_town',
  'google_maps_url',
  'date_of_birth',
  'has_webcam',
  'bank_name',
  'cancelled_cheque_url',
  'aadhaar_url',
  'inside_shop_photo_url',
  'training_declaration',
  'agree_mea_guidelines',
  'agree_platform_only',
  'agree_confidentiality',
  'agree_no_misrepresentation',
  'agree_accurate_info',
  'agree_not_sub_agent',
  'agreement_accepted_via_otp',
  'agreement_accepted_at',
] as const;

const IDENTITY_COLUMNS = [
  'aadhaar_number',
  'pan_number',
  'account_number',
  'ifsc',
  'account_holder',
  'aadhaar_front_url',
  'aadhaar_back_url',
  'pan_card_url',
] as const;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '');
  }
  return String(error || '');
}

function isNetworkError(error: unknown): boolean {
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed/i.test(
    errorMessage(error),
  );
}

function missingColumnFromPostgrest(message: string): string | null {
  const match = message.match(/could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  const message = error.message || '';
  return error.code === 'PGRST204' || /could not find the '.*' column/i.test(message);
}

function isPrivilegedFieldError(error: { code?: string; message?: string }): boolean {
  const message = error.message || '';
  return (
    error.code === '42501'
    || /row-level security/i.test(message)
    || /cannot modify approval/i.test(message)
  );
}

function isIdentityLockError(error: { code?: string; message?: string }): boolean {
  return /cannot modify identity|sensitive identity|bank details after initial/i.test(
    error.message || '',
  );
}

function mapPartnerProfileError(error: { code?: string; message?: string }): Error {
  const message = error.message || 'Failed to save partner application';

  if (isNetworkError(error)) {
    return new Error('Could not save progress. Check your connection and try again.');
  }

  if (isMissingColumnError(error)) {
    return new Error(
      'Partner database is missing E-Mitra columns. Run supabase migration 20260823010000_partner_profiles_emitra_v2_ensure_columns.sql in the Supabase SQL editor, then retry.',
    );
  }

  if (error.code === '42501' || /row-level security/i.test(message)) {
    return new Error('You do not have permission to save this application. Please sign in again.');
  }

  return new Error(message);
}

function deleteKey(row: Record<string, unknown>, key: string): boolean {
  if (key === 'user_id' || !(key in row)) return false;
  delete row[key];
  return true;
}

/** Drop keys PostgREST/RLS reject so a partial save can still succeed. */
function stripBlockedKeys(
  row: Record<string, unknown>,
  error: { code?: string; message?: string },
): boolean {
  if (isNetworkError(error)) {
    let stripped = false;
    for (const key of IDENTITY_COLUMNS) {
      stripped = deleteKey(row, key) || stripped;
    }
    return stripped;
  }

  if (isMissingColumnError(error)) {
    let stripped = false;
    const missing = missingColumnFromPostgrest(error.message || '');
    if (missing) stripped = deleteKey(row, missing) || stripped;
    for (const key of EMITRA_V2_COLUMNS) {
      stripped = deleteKey(row, key) || stripped;
    }
    return stripped;
  }

  if (isIdentityLockError(error)) {
    let stripped = false;
    for (const key of IDENTITY_COLUMNS) {
      stripped = deleteKey(row, key) || stripped;
    }
    return stripped;
  }

  if (isPrivilegedFieldError(error)) {
    let stripped = false;
    for (const key of ['status', 'source_lsp_id'] as const) {
      stripped = deleteKey(row, key) || stripped;
    }
    return stripped;
  }

  return false;
}

function takeIdentityFields(row: Record<string, unknown>): Record<string, unknown> {
  const identity: Record<string, unknown> = {};
  for (const key of ['aadhaar_number', 'pan_number'] as const) {
    const value = row[key];
    if (value) identity[key] = value;
    delete row[key];
  }
  return identity;
}

async function writePartnerRow(
  userId: string,
  existing: boolean,
  row: Record<string, unknown>,
): Promise<void> {
  let update = existing;
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = update
      ? await supabase.from('partner_profiles').update(row).eq('user_id', userId)
      : await supabase.from('partner_profiles').insert(row);

    if (!error) return;
    if (/duplicate|unique/i.test(error.message || '')) {
      update = true;
      delete row.user_id;
      continue;
    }
    if (!stripBlockedKeys(row, error)) throw mapPartnerProfileError(error);
    if (isNetworkError(error)) await new Promise((r) => setTimeout(r, 400));
  }

  throw new Error('Failed to save partner application');
}

/** Update or insert partner_profiles without PostgREST upsert (more reliable with RLS). */
export async function savePartnerApplication(
  userId: string,
  payload: PartnerApplicationPayload,
): Promise<void> {
  let existing: { id: string } | null = null;
  let fetchError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    existing = result.data;
    fetchError = result.error;
    if (!fetchError) break;
    if (!isNetworkError(fetchError) || attempt === 1) throw mapPartnerProfileError(fetchError);
    await new Promise((r) => setTimeout(r, 400));
  }

  const row: Record<string, unknown> = { ...payload };
  delete row.id;
  if (existing) {
    delete row.user_id;
  } else {
    row.user_id = userId;
  }

  // Aadhaar (12 digits) in the same PATCH as the rest of the form can be
  // dropped by bot/WAF filters as "Failed to fetch". Save it separately.
  const identity = takeIdentityFields(row);
  await writePartnerRow(userId, !!existing, row);

  if (Object.keys(identity).length === 0) return;
  try {
    await writePartnerRow(userId, true, identity);
  } catch (error) {
    // Aadhaar/PAN are optional. A blocked or filtered identity write must not
    // fail the rest of the application (step 2 Continue).
    console.warn('Could not save partner identity numbers', error);
  }
}

export function isPartnerOperational(profile: PartnerProfile | null): boolean {
  return !!profile && (profile.status === 'approved' || profile.status === 'active');
}

export async function getDashboardStats(partnerProfileId: string): Promise<DashboardStats> {
  // Same source as My Workers (`partner_list_my_workers` → worker_profiles).
  // Do not count `partner_workers` — that is the old kiosk table and is not
  // written by Add Worker, so it stays at 0 while the list shows real accounts.
  const [{ data: myWorkers }, { data: profile }] = await Promise.all([
    supabase.rpc('partner_list_my_workers'),
    supabase
      .from('partner_profiles')
      .select('total_incentives_earned')
      .eq('id', partnerProfileId)
      .single(),
  ]);

  const list: { user_id: string }[] = myWorkers || [];
  const ids = list.map((w) => w.user_id);
  const earnings = Number(profile?.total_incentives_earned || 0);

  let stages: { user_id: string; stage: string | null }[] = [];
  let hiredIds = new Set<string>();
  if (ids.length) {
    const [{ data: verification }, { data: apps }] = await Promise.all([
      supabase.from('worker_verification').select('user_id, stage').in('user_id', ids),
      supabase.from('job_applications').select('worker_id').in('worker_id', ids).eq('status', 'HIRED'),
    ]);
    stages = verification || [];
    hiredIds = new Set((apps || []).map((a: { worker_id: string }) => a.worker_id));
  }

  const stageByUser = new Map(stages.map((s) => [s.user_id, s.stage || 'essentials']));
  const stageOf = (id: string) => stageByUser.get(id) || 'essentials';

  const documentsPending = ids.filter((id) =>
    ['essentials', 'quiz', 'media', 'identity'].includes(stageOf(id)),
  ).length;
  const interviewsScheduled = ids.filter((id) => stageOf(id) === 'awaiting_interview').length;
  const tradeTestsBooked = ids.filter((id) =>
    ['trade_test', 'tests'].includes(stageOf(id)),
  ).length;
  const deployed = ids.filter((id) =>
    ['deployment', 'gcc_ready'].includes(stageOf(id)),
  ).length;
  const selected = hiredIds.size;
  const verified = ids.filter((id) => stageOf(id) !== 'essentials').length;

  return {
    totalRegistered: list.length,
    documentsPending,
    interviewsScheduled,
    tradeTestsBooked,
    workersSelected: selected,
    workersDeployed: deployed,
    earnings,
    verified,
    interviewed: interviewsScheduled,
    selected,
    placed: deployed,
    incentivesEarned: earnings,
  };
}

export async function getPartnerActivities(partnerProfileId: string, limit = 10): Promise<PartnerActivity[]> {
  const { data } = await supabase
    .from('partner_activities')
    .select('*')
    .eq('partner_profile_id', partnerProfileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as PartnerActivity[];
}

export async function getPartnerIncentives(partnerProfileId: string): Promise<PartnerIncentive[]> {
  const { data } = await supabase
    .from('partner_incentives')
    .select('*')
    .eq('partner_profile_id', partnerProfileId)
    .order('created_at', { ascending: false });
  return (data || []) as PartnerIncentive[];
}

export async function getLeaderboardRank(partnerProfileId: string): Promise<number | null> {
  const { data } = await supabase
    .from('partner_profiles')
    .select('id, workers_placed')
    .in('status', ['approved', 'active'])
    .order('workers_placed', { ascending: false });

  if (!data) return null;
  const idx = data.findIndex(p => p.id === partnerProfileId);
  return idx >= 0 ? idx + 1 : null;
}

export interface WorkerFilters {
  skill?: string;
  state?: string;
  district?: string;
  status?: string;
  passportAvailable?: string;
  search?: string;
}

export async function getPartnerWorkers(
  partnerProfileId: string,
  filters: WorkerFilters = {}
): Promise<PartnerWorker[]> {
  let query = supabase
    .from('partner_workers')
    .select('*')
    .eq('partner_profile_id', partnerProfileId)
    .order('created_at', { ascending: false });

  if (filters.skill && filters.skill !== 'all') query = query.eq('skill', filters.skill);
  if (filters.state && filters.state !== 'all') query = query.eq('state', filters.state);
  if (filters.district && filters.district !== 'all') query = query.eq('district', filters.district);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.passportAvailable === 'yes') query = query.eq('passport_available', true);
  if (filters.passportAvailable === 'no') query = query.eq('passport_available', false);

  const { data } = await query;
  let results = (data || []) as PartnerWorker[];

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      w =>
        w.full_name.toLowerCase().includes(q) ||
        w.mobile.includes(q) ||
        w.skill.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getWorkerById(workerId: string): Promise<PartnerWorker | null> {
  const { data } = await supabase
    .from('partner_workers')
    .select('*')
    .eq('id', workerId)
    .maybeSingle();
  return data as PartnerWorker | null;
}

export async function getWorkerStatusHistory(workerId: string): Promise<WorkerStatusHistory[]> {
  const { data } = await supabase
    .from('partner_worker_status_history')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: true });
  return (data || []) as WorkerStatusHistory[];
}

export async function createPartnerWorker(
  partnerProfileId: string,
  payload: Record<string, unknown>
): Promise<{ worker: PartnerWorker | null; error?: string }> {
  const migrationAnswers = {
    passportAvailable: !!payload.passport_available,
    readyToRelocate: !!payload.ready_to_relocate,
    familyConsent: !!payload.family_consent,
    previousGccExperience: !!payload.previous_gcc_experience,
    expectedSalary: payload.expected_salary as number | null,
  };
  const score = calculateMigrationScore(migrationAnswers);
  const category = getMigrationCategory(score);

  // Attribute to Rajasthan LSP when operator entered via trusted launch
  let sourceLspId: string | null = getLspSession()?.lspId ?? null;
  if (!sourceLspId && typeof payload.source_lsp_id === 'string') {
    sourceLspId = payload.source_lsp_id;
  }

  const { data, error } = await supabase
    .from('partner_workers')
    .insert({
      partner_profile_id: partnerProfileId,
      full_name: payload.full_name,
      mobile: payload.mobile,
      whatsapp: payload.whatsapp,
      skill: Array.isArray(payload.skills)
        ? (payload.skills as string[]).join(', ')
        : (payload.skill as string),
      experience_level: payload.experience_level,
      passport_available: payload.passport_available,
      preferred_country: payload.preferred_country || null,
      state: payload.state,
      district: payload.district,
      skill_level: payload.skill_level || null,
      operator_notes: payload.operator_notes || null,
      ready_to_relocate: payload.ready_to_relocate,
      family_consent: payload.family_consent,
      previous_gcc_experience: payload.previous_gcc_experience,
      expected_salary: payload.expected_salary || null,
      migration_readiness_score: score,
      migration_category: category,
      photo_url: payload.photo_url || null,
      video_url: payload.video_url || null,
      status: 'registered',
      ...(sourceLspId ? { source_lsp_id: sourceLspId } : {}),
    })
    .select()
    .single();

  if (error) {
    const missingTable = /could not find the table|partner_workers|PGRST205/i.test(error.message || '');
    return {
      worker: null,
      error: missingTable
        ? 'Worker database tables are missing. Run migration 20260609150000_ensure_partner_workers_tables.sql in Supabase SQL editor, then retry.'
        : error.message,
    };
  }
  return { worker: data as PartnerWorker };
}

export interface WorkerRegistrationDraft {
  current_step: number;
  draft_data: Record<string, unknown>;
  photo_url: string | null;
  video_url: string | null;
}

export async function loadWorkerRegistrationDraft(
  partnerProfileId: string,
  userId: string,
): Promise<WorkerRegistrationDraft | null> {
  const { data, error } = await supabase
    .from('partner_worker_drafts')
    .select('current_step, draft_data, photo_url, video_url')
    .eq('partner_profile_id', partnerProfileId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    current_step: data.current_step ?? 0,
    draft_data: (data.draft_data as Record<string, unknown>) || {},
    photo_url: data.photo_url ?? null,
    video_url: data.video_url ?? null,
  };
}

export async function saveWorkerRegistrationDraft(
  partnerProfileId: string,
  userId: string,
  currentStep: number,
  draftData: Record<string, unknown>,
  media?: { photo_url?: string | null; video_url?: string | null },
): Promise<{ error?: string }> {
  const row: Record<string, unknown> = {
    partner_profile_id: partnerProfileId,
    user_id: userId,
    current_step: currentStep,
    draft_data: draftData,
    updated_at: new Date().toISOString(),
  };
  if (media?.photo_url !== undefined) row.photo_url = media.photo_url;
  if (media?.video_url !== undefined) row.video_url = media.video_url;

  const { data: existing, error: fetchError } = await supabase
    .from('partner_worker_drafts')
    .select('id')
    .eq('partner_profile_id', partnerProfileId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    const missing = /could not find the table|partner_worker_drafts|PGRST205/i.test(fetchError.message || '');
    return {
      error: missing
        ? 'Draft saving is unavailable. Run migration 20260609160000_partner_worker_drafts.sql in Supabase.'
        : fetchError.message,
    };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('partner_worker_drafts')
      .update(row)
      .eq('id', existing.id);
    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.from('partner_worker_drafts').insert(row);
  return error ? { error: error.message } : {};
}

export async function deleteWorkerRegistrationDraft(
  partnerProfileId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from('partner_worker_drafts')
    .delete()
    .eq('partner_profile_id', partnerProfileId)
    .eq('user_id', userId);
}

export async function updatePartnerWorker(
  workerId: string,
  payload: Record<string, unknown>
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('partner_workers')
    .update(payload)
    .eq('id', workerId);
  return error ? { error: error.message } : {};
}

export async function updateWorkerStatus(
  workerId: string,
  status: string
): Promise<{ error?: string }> {
  return updatePartnerWorker(workerId, { status });
}

function complianceStorageKey(profileId: string) {
  return `emitra_compliance_ack:${profileId}`;
}

export function isComplianceAcknowledged(profile: PartnerProfile): boolean {
  if (profile.compliance_acknowledged_at) return true;
  try {
    return localStorage.getItem(complianceStorageKey(profile.id)) === '1';
  } catch {
    return false;
  }
}

export async function acknowledgeCompliance(partnerProfileId: string): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('partner_profiles')
    .update({ compliance_acknowledged_at: now, updated_at: now })
    .eq('id', partnerProfileId);

  if (!error) return {};

  try {
    localStorage.setItem(complianceStorageKey(partnerProfileId), '1');
    return {};
  } catch {
    return { error: error.message };
  }
}

const WORKER_MEDIA_BUCKET = 'partner-worker-media';
const WORKER_MEDIA_FALLBACK_BUCKET = 'partner-documents';

function isBucketMissingError(message: string) {
  return /bucket not found/i.test(message);
}

/** Stored as `path` or `bucket:path` when using fallback storage */
function parseWorkerMediaRef(stored: string): { bucket: string; path: string } {
  const sep = stored.indexOf(':');
  if (sep > 0 && stored.startsWith('partner-')) {
    return { bucket: stored.slice(0, sep), path: stored.slice(sep + 1) };
  }
  return { bucket: WORKER_MEDIA_BUCKET, path: stored };
}

export async function uploadWorkerMedia(
  userId: string,
  file: File,
  type: 'photo' | 'video'
): Promise<{ path: string | null; error?: string }> {
  if (file.size > (type === 'video' ? 50 : 8) * 1024 * 1024) {
    return { path: null, error: `File must be under ${type === 'video' ? 50 : 8} MB` };
  }
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${type}-${Date.now()}.${ext}`;
  const uploadOpts = { upsert: true, contentType: file.type };

  const primaryPath = `${userId}/${fileName}`;
  const { error: primaryError } = await supabase.storage
    .from(WORKER_MEDIA_BUCKET)
    .upload(primaryPath, file, uploadOpts);

  if (!primaryError) return { path: primaryPath };

  if (!isBucketMissingError(primaryError.message || '')) {
    return { path: null, error: primaryError.message };
  }

  const fallbackPath = `${userId}/worker-media/${fileName}`;
  const { error: fallbackError } = await supabase.storage
    .from(WORKER_MEDIA_FALLBACK_BUCKET)
    .upload(fallbackPath, file, uploadOpts);

  if (fallbackError) {
    return {
      path: null,
      error:
        'Worker media storage is not configured. Run migration 20260609140000_ensure_partner_worker_media_bucket.sql in Supabase SQL editor.',
    };
  }

  return { path: `${WORKER_MEDIA_FALLBACK_BUCKET}:${fallbackPath}` };
}

export async function getSignedMediaUrl(stored: string): Promise<string | null> {
  const { bucket, path } = parseWorkerMediaRef(stored);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (!error && data?.signedUrl) return data.signedUrl;

  if (bucket !== WORKER_MEDIA_BUCKET) return null;

  const { data: fallback } = await supabase.storage
    .from(WORKER_MEDIA_FALLBACK_BUCKET)
    .createSignedUrl(stored, 3600);
  return fallback?.signedUrl || null;
}
