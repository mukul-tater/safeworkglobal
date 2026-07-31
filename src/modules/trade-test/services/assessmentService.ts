import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { TRADE_TEST_REPORTING_WINDOW } from '@/data/tradeTestCenters';
import { displayableEmail } from '@/lib/workerAuthEmail';
import {
  averageSopScore,
  type AssessmentMediaRow,
  type AssessmentMediaType,
  type AssessmentOutcome,
  type AssessmentRow,
  type AssessmentScoresInput,
  type AssessmentScoresRow,
  type TradeTestCenterRow,
} from '../types';

const supabase: any = supabaseTyped;
const EVIDENCE_BUCKET = 'assessment-evidence';

async function enrichAssessments(rows: AssessmentRow[]): Promise<AssessmentRow[]> {
  if (!rows.length) return rows;
  const workerIds = [...new Set(rows.map((r) => r.worker_id))];
  const centerIds = [...new Set(rows.map((r) => r.trade_test_center_id).filter(Boolean))] as string[];
  const verIds = [...new Set(rows.map((r) => r.worker_verification_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: centers }, { data: vers }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, email').in('id', workerIds),
    centerIds.length
      ? supabase.from('trade_test_centers').select('id, name').in('id', centerIds)
      : Promise.resolve({ data: [] }),
    verIds.length
      ? supabase.from('worker_verification').select('id, primary_skill').in('id', verIds)
      : Promise.resolve({ data: [] }),
  ]);

  const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const cmap = new Map((centers || []).map((c: any) => [c.id, c]));
  const vmap = new Map((vers || []).map((v: any) => [v.id, v]));

  return rows.map((r) => {
    const p = pmap.get(r.worker_id) as any;
    const c = r.trade_test_center_id ? cmap.get(r.trade_test_center_id) : null;
    const v = r.worker_verification_id ? vmap.get(r.worker_verification_id) : null;
    return {
      ...r,
      worker_name: p?.full_name || null,
      worker_phone: p?.phone || null,
      center_name: (c as any)?.name || r.location || null,
      primary_skill: (v as any)?.primary_skill || null,
      worker_email: displayableEmail(p?.email) || null,
    } as AssessmentRow;
  });
}

export async function listTradeTestCenters(activeOnly = true): Promise<TradeTestCenterRow[]> {
  let q = supabase.from('trade_test_centers').select('*').order('state');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as TradeTestCenterRow[];
}

export async function listWorkersNeedingAllocation(): Promise<
  Array<{
    verification_id: string;
    user_id: string;
    primary_skill: string | null;
    state: string | null;
    full_name: string | null;
    phone: string | null;
  }>
> {
  const { data, error } = await supabase
    .from('worker_verification')
    .select('id, user_id, primary_skill, state, assessment_id, trade_test_status')
    .eq('stage', 'trade_test')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data || []) as any[];
  const openStatuses = new Set([
    'allocated',
    'accepted',
    'scheduled',
    'checked_in',
    'kyc_done',
    'running',
    'centre_submitted',
    'under_review',
  ]);

  const assessmentIds = rows.map((r) => r.assessment_id).filter(Boolean);
  let assessmentMap = new Map<string, any>();
  if (assessmentIds.length) {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, status, outcome')
      .in('id', assessmentIds);
    assessmentMap = new Map((assessments || []).map((a: any) => [a.id, a]));
  }

  const need = rows.filter((r) => {
    if (!r.assessment_id) return true;
    const a = assessmentMap.get(r.assessment_id);
    if (!a) return true;
    if (a.status === 'centre_rejected' || a.status === 'retest') return true;
    if (a.outcome === 'fail') return true;
    return !openStatuses.has(a.status);
  });

  if (!need.length) return [];
  const ids = need.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', ids);
  const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return need.map((r) => {
    const p = pmap.get(r.user_id) as any;
    return {
      verification_id: r.id,
      user_id: r.user_id,
      primary_skill: r.primary_skill,
      state: r.state,
      full_name: p?.full_name || null,
      phone: p?.phone || null,
    };
  });
}

/** Admin: allocate candidate to authorised centre (creates assessment). */
export async function allocateAssessment(input: {
  workerId: string;
  verificationId: string;
  centerId: string;
  appointmentDate: string;
  reportingWindow?: string;
  /** Override / set SSVN partner for the centre when allocating. */
  partnerId?: string;
}): Promise<AssessmentRow> {
  const { data: center, error: cErr } = await supabase
    .from('trade_test_centers')
    .select('*')
    .eq('id', input.centerId)
    .eq('is_active', true)
    .maybeSingle();
  if (cErr) throw new Error(cErr.message);
  if (!center) throw new Error('Trade test centre not found or inactive');

  const partnerId = input.partnerId || center.partner_id;
  if (!partnerId) {
    throw new Error('Select an SSVN partner for this centre (or link one on the centre).');
  }
  if (input.partnerId && input.partnerId !== center.partner_id) {
    await adminLinkCenterPartner(center.id, input.partnerId);
  }

  const window = input.reportingWindow || center.reporting_window || TRADE_TEST_REPORTING_WINDOW;
  const scheduledAt = `${input.appointmentDate}T03:30:00.000Z`; // ~9 AM IST

  const { data: created, error } = await supabase
    .from('assessments')
    .insert({
      worker_id: input.workerId,
      worker_verification_id: input.verificationId,
      partner_id: partnerId,
      trade_test_center_id: center.id,
      location: center.name,
      appointment_date: input.appointmentDate,
      reporting_window: window,
      scheduled_at: scheduledAt,
      status: 'allocated',
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  const { error: vErr } = await supabase
    .from('worker_verification')
    .update({
      assessment_id: created.id,
      trade_test_center_id: center.id,
      trade_test_center_name: center.name,
      trade_test_reporting_window: window,
      trade_test_booked_at: new Date().toISOString(),
      trade_test_status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.verificationId);
  if (vErr) throw new Error(vErr.message);

  const [enriched] = await enrichAssessments([created as AssessmentRow]);
  return enriched;
}

export async function listPartnerAssessments(
  partnerId: string,
  filter?: 'inbox' | 'today' | 'active' | 'history',
): Promise<AssessmentRow[]> {
  let q = supabase.from('assessments').select('*').eq('partner_id', partnerId);
  if (filter === 'inbox') q = q.eq('status', 'allocated');
  else if (filter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    q = q.gte('scheduled_at', today.toISOString()).lt('scheduled_at', tomorrow.toISOString());
  } else if (filter === 'active') {
    q = q.in('status', [
      'accepted',
      'scheduled',
      'checked_in',
      'kyc_done',
      'running',
      'centre_submitted',
    ]);
  } else if (filter === 'history') {
    q = q.in('status', ['completed', 'under_review', 'centre_rejected', 'retest']);
  }
  q = q.order('scheduled_at', { ascending: filter !== 'history' });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return enrichAssessments((data || []) as AssessmentRow[]);
}

export async function getAssessment(id: string): Promise<AssessmentRow | null> {
  const { data, error } = await supabase.from('assessments').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function getWorkerActiveAssessment(workerId: string): Promise<AssessmentRow | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function acceptAssessment(assessmentId: string): Promise<AssessmentRow> {
  const { data, error } = await supabase
    .from('assessments')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .eq('status', 'allocated')
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function rejectAssessment(
  assessmentId: string,
  reason: string,
): Promise<AssessmentRow> {
  const { data, error } = await supabase
    .from('assessments')
    .update({
      status: 'centre_rejected',
      rejected_at: new Date().toISOString(),
      reject_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .eq('status', 'allocated')
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  if (data.worker_verification_id) {
    await supabase
      .from('worker_verification')
      .update({
        assessment_id: null,
        trade_test_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.worker_verification_id);
  }

  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function checkInAssessment(assessmentId: string): Promise<AssessmentRow> {
  const { data, error } = await supabase
    .from('assessments')
    .update({
      status: 'checked_in',
      reported_at: new Date().toISOString(),
      attendance_confirmed: true,
      start_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .in('status', ['accepted', 'scheduled'])
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function saveCentreKyc(
  assessmentId: string,
  input: {
    aadhaarVerified: boolean;
    faceMatchConfirmed: boolean;
    attendanceConfirmed: boolean;
    kycPhotoPath?: string | null;
    kycVideoPath?: string | null;
  },
): Promise<AssessmentRow> {
  if (!input.aadhaarVerified || !input.faceMatchConfirmed || !input.attendanceConfirmed) {
    throw new Error('Confirm Aadhaar card, face match, and attendance');
  }
  if (!input.kycPhotoPath || !input.kycVideoPath) {
    throw new Error('Upload candidate photograph and live video recording');
  }

  const { data, error } = await supabase
    .from('assessments')
    .update({
      aadhaar_verified: true,
      face_match_confirmed: true,
      attendance_confirmed: true,
      kyc_photo_path: input.kycPhotoPath,
      kyc_video_path: input.kycVideoPath,
      kyc_completed_at: new Date().toISOString(),
      status: 'kyc_done',
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .in('status', ['checked_in', 'kyc_done', 'running'])
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await supabase.from('assessment_media').upsert(
    [
      {
        assessment_id: assessmentId,
        media_type: 'kyc_photo',
        storage_path: input.kycPhotoPath,
        label: 'Candidate photograph',
      },
      {
        assessment_id: assessmentId,
        media_type: 'kyc_video',
        storage_path: input.kycVideoPath,
        label: 'Live video recording',
      },
    ],
    { onConflict: 'assessment_id,media_type', ignoreDuplicates: false },
  ).then(() => undefined).catch(() => undefined);

  // upsert may fail without unique — insert if missing
  for (const m of [
    { media_type: 'kyc_photo' as const, path: input.kycPhotoPath, label: 'Candidate photograph' },
    { media_type: 'kyc_video' as const, path: input.kycVideoPath, label: 'Live video recording' },
  ]) {
    const { data: existing } = await supabase
      .from('assessment_media')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('media_type', m.media_type)
      .maybeSingle();
    if (existing) {
      await supabase
        .from('assessment_media')
        .update({ storage_path: m.path, label: m.label })
        .eq('id', existing.id);
    } else {
      await supabase.from('assessment_media').insert({
        assessment_id: assessmentId,
        media_type: m.media_type,
        storage_path: m.path,
        label: m.label,
      });
    }
  }

  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function saveDocChecks(
  assessmentId: string,
  input: {
    experienceOk?: boolean | null;
    passportOk?: boolean | null;
    notes?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('assessments')
    .update({
      docs_experience_ok: input.experienceOk ?? null,
      docs_passport_ok: input.passportOk ?? null,
      docs_notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId);
  if (error) throw new Error(error.message);
}

export async function saveAssessmentScores(
  assessmentId: string,
  scores: AssessmentScoresInput,
): Promise<AssessmentScoresRow> {
  const overall = averageSopScore(scores);
  const payload = {
    assessment_id: assessmentId,
    assessor_name: scores.assessor_name.trim(),
    safety_ppe: scores.safety_ppe,
    tool_identification: scores.tool_identification,
    practical_skills: scores.practical_skills,
    accuracy: scores.accuracy,
    quality: scores.quality,
    productivity: scores.productivity,
    time_taken: scores.time_taken,
    workplace_behaviour: scores.workplace_behaviour,
    remarks: scores.remarks || null,
    submitted_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('assessment_scores')
    .select('id')
    .eq('assessment_id', assessmentId)
    .maybeSingle();

  let row: any;
  if (existing?.id) {
    const { data, error } = await supabase
      .from('assessment_scores')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    row = data;
  } else {
    const { data, error } = await supabase
      .from('assessment_scores')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    row = data;
  }

  await supabase
    .from('assessments')
    .update({
      overall_score: overall,
      assessor_name: scores.assessor_name.trim(),
      status: 'running',
      scores: {
        safety_ppe: scores.safety_ppe,
        tool_identification: scores.tool_identification,
        practical_skills: scores.practical_skills,
        accuracy: scores.accuracy,
        quality: scores.quality,
        productivity: scores.productivity,
        time_taken: scores.time_taken,
        workplace_behaviour: scores.workplace_behaviour,
      },
      remarks: scores.remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId);

  return row as AssessmentScoresRow;
}

export async function getAssessmentScores(
  assessmentId: string,
): Promise<AssessmentScoresRow | null> {
  const { data, error } = await supabase
    .from('assessment_scores')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AssessmentScoresRow) || null;
}

export async function addAssessmentMedia(input: {
  assessmentId: string;
  mediaType: AssessmentMediaType;
  storagePath: string;
  label?: string;
}): Promise<AssessmentMediaRow> {
  const { data, error } = await supabase
    .from('assessment_media')
    .insert({
      assessment_id: input.assessmentId,
      media_type: input.mediaType,
      storage_path: input.storagePath,
      label: input.label || null,
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as AssessmentMediaRow;
}

export async function listAssessmentMedia(assessmentId: string): Promise<AssessmentMediaRow[]> {
  const { data, error } = await supabase
    .from('assessment_media')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as AssessmentMediaRow[];
}

export async function uploadAssessmentEvidence(
  partnerId: string,
  assessmentId: string,
  file: File,
  kind: AssessmentMediaType,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${partnerId}/${assessmentId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedEvidenceUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function submitCentreAssessment(assessmentId: string): Promise<AssessmentRow> {
  const scores = await getAssessmentScores(assessmentId);
  if (!scores) throw new Error('Complete the SOP scorecard before submitting');

  const { data: a, error: aErr } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  if (aErr) throw new Error(aErr.message);
  if (!a.aadhaar_verified || !a.kyc_photo_path || !a.kyc_video_path) {
    throw new Error('Complete identity KYC (Aadhaar + photo + video) before submitting');
  }

  const { data: media } = await supabase
    .from('assessment_media')
    .select('id')
    .eq('assessment_id', assessmentId)
    .in('media_type', ['practical_photo', 'practical_video']);
  if (!media?.length) {
    throw new Error('Upload at least one practical photo or video as evidence');
  }

  const { data, error } = await supabase
    .from('assessments')
    .update({
      status: 'centre_submitted',
      centre_submitted_at: new Date().toISOString(),
      end_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .in('status', ['kyc_done', 'running', 'centre_submitted'])
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Move to under_review for admin queue
  const { data: reviewed, error: rErr } = await supabase
    .from('assessments')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', assessmentId)
    .select('*')
    .single();
  // under_review update may fail if partner can't set it — centre_submitted is enough for admin list
  const final = rErr ? data : reviewed;
  const [row] = await enrichAssessments([final as AssessmentRow]);
  return row;
}

export async function listAssessmentsForQualityReview(): Promise<AssessmentRow[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .in('status', ['centre_submitted', 'under_review'])
    .order('centre_submitted_at', { ascending: true });
  if (error) throw new Error(error.message);
  return enrichAssessments((data || []) as AssessmentRow[]);
}

/** Admin quality review — syncs worker_verification. */
export async function qualityReviewAssessment(input: {
  assessmentId: string;
  outcome: AssessmentOutcome;
  notes?: string;
}): Promise<AssessmentRow> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data: assessment, error: aErr } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', input.assessmentId)
    .single();
  if (aErr) throw new Error(aErr.message);

  const { data, error } = await supabase
    .from('assessments')
    .update({
      outcome: input.outcome,
      quality_notes: input.notes || null,
      quality_reviewed_by: userId,
      quality_reviewed_at: new Date().toISOString(),
      status: 'completed',
      recommendation: input.outcome,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.assessmentId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  if (assessment.worker_verification_id || assessment.worker_id) {
    const passed = input.outcome === 'pass' || input.outcome === 'conditional_pass';
    const patch: Record<string, unknown> = {
      trade_test_status: passed ? 'passed' : 'failed',
      updated_at: new Date().toISOString(),
    };
    if (passed) {
      patch.stage = 'medical';
    }
    let q = supabase.from('worker_verification').update(patch);
    if (assessment.worker_verification_id) {
      q = q.eq('id', assessment.worker_verification_id);
    } else {
      q = q.eq('user_id', assessment.worker_id);
    }
    const { error: vErr } = await q;
    if (vErr) throw new Error(vErr.message);
  }

  const [row] = await enrichAssessments([data as AssessmentRow]);
  return row;
}

export async function getEmployerVisibleReport(
  workerId: string,
): Promise<{ assessment: AssessmentRow; scores: AssessmentScoresRow | null } | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('worker_id', workerId)
    .eq('status', 'completed')
    .in('outcome', ['pass', 'conditional_pass'])
    .order('quality_reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [assessment] = await enrichAssessments([data as AssessmentRow]);
  const scores = await getAssessmentScores(assessment.id);
  return { assessment, scores };
}

export async function adminLinkCenterPartner(
  centerId: string,
  partnerId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('trade_test_centers')
    .update({ partner_id: partnerId, updated_at: new Date().toISOString() })
    .eq('id', centerId);
  if (error) throw new Error(error.message);
}

export async function listSsvnPartners(): Promise<
  Array<{ id: string; partner_code: string | null; company_name: string | null }>
> {
  const { data: types } = await supabase
    .from('partner_types')
    .select('id')
    .eq('code', 'SSVN')
    .maybeSingle();
  if (!types?.id) return [];

  const { data, error } = await supabase
    .from('partners')
    .select('id, partner_code, partner_profiles_ext(company_name)')
    .eq('partner_type_id', types.id)
    .eq('status', 'approved');
  if (error) throw new Error(error.message);
  return (data || []).map((p: any) => ({
    id: p.id,
    partner_code: p.partner_code,
    company_name: p.partner_profiles_ext?.company_name || null,
  }));
}
