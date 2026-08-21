export type AssessmentWorkflowStatus =
  | 'allocated'
  | 'accepted'
  | 'centre_rejected'
  | 'scheduled'
  | 'checked_in'
  | 'kyc_done'
  | 'running'
  | 'centre_submitted'
  | 'under_review'
  | 'completed'
  | 'employer_review'
  | 'approved'
  | 'rejected'
  | 'retest';

export type AssessmentOutcome = 'pass' | 'conditional_pass' | 'fail';

export type AssessmentMediaType =
  | 'kyc_photo'
  | 'kyc_video'
  | 'arrival_photo'
  | 'video_kyc_blink'
  | 'video_kyc_turn_left'
  | 'video_kyc_turn_right'
  | 'practical_photo'
  | 'practical_video'
  | 'document'
  | 'scorecard';

export type VideoKycLogEntry = {
  challenge: 'blink' | 'turn_left' | 'turn_right';
  started_at: string;
  completed_at: string;
  storage_path: string;
  duration_seconds?: number | null;
  operator_name?: string | null;
};

export type TradeTestCenterRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  partner_id: string | null;
  reporting_window: string;
  is_active: boolean;
  address: string | null;
  pincode: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  maps_url: string | null;
  instructions: string | null;
};

export type AssessmentRow = {
  id: string;
  worker_id: string;
  employer_id: string | null;
  job_id: string | null;
  partner_id: string | null;
  trade_test_center_id: string | null;
  worker_verification_id: string | null;
  status: AssessmentWorkflowStatus;
  scheduled_at: string | null;
  appointment_date: string | null;
  reporting_window: string | null;
  location: string | null;
  assessor_name: string | null;
  overall_score: number | null;
  accepted_at: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  reported_at: string | null;
  centre_submitted_at: string | null;
  aadhaar_verified: boolean;
  pan_verified: boolean;
  face_match_confirmed: boolean;
  identity_same_person: boolean;
  attendance_confirmed: boolean;
  kyc_photo_path: string | null;
  kyc_video_path: string | null;
  kyc_completed_at: string | null;
  docs_experience_ok: boolean | null;
  docs_passport_ok: boolean | null;
  docs_notes: string | null;
  docs_pre_reviewed_at: string | null;
  docs_pre_reviewed_by: string | null;
  arrival_photo_path: string | null;
  arrival_photo_taken_by: string | null;
  arrival_photo_taken_by_name: string | null;
  arrival_photo_taken_at: string | null;
  video_kyc_log: VideoKycLogEntry[];
  video_kyc_operator_id: string | null;
  video_kyc_operator_name: string | null;
  test_evidence_completed_at: string | null;
  scorecard_uploaded_at: string | null;
  outcome: AssessmentOutcome | null;
  quality_reviewed_by: string | null;
  quality_reviewed_at: string | null;
  quality_notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  worker_name?: string | null;
  worker_phone?: string | null;
  worker_email?: string | null;
  center_name?: string | null;
  center_city?: string | null;
  center_state?: string | null;
  center_address?: string | null;
  center_pincode?: string | null;
  center_contact_name?: string | null;
  center_contact_phone?: string | null;
  center_maps_url?: string | null;
  center_instructions?: string | null;
  primary_skill?: string | null;
};

export type WorkerIdentityDoc = {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  preview_url: string | null;
  uploaded_at: string | null;
};

export type WorkerIdentityPack = {
  pan_number: string | null;
  aadhaar_last4: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  has_passport: boolean;
  documents: WorkerIdentityDoc[];
};

export type AssessmentScoresInput = {
  assessor_name: string;
  safety_ppe: number;
  tool_identification: number;
  practical_skills: number;
  accuracy: number;
  quality: number;
  productivity: number;
  time_taken: number;
  workplace_behaviour: number;
  remarks?: string;
};

export type AssessmentScoresRow = AssessmentScoresInput & {
  id: string;
  assessment_id: string;
  submitted_at: string;
};

export type AssessmentMediaRow = {
  id: string;
  assessment_id: string;
  media_type: AssessmentMediaType;
  storage_path: string;
  label: string | null;
  created_at: string;
  captured_at?: string | null;
  captured_by?: string | null;
  captured_by_name?: string | null;
  duration_seconds?: number | null;
  angle?: string | null;
  face_visible?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export const SOP_SCORE_FIELDS = [
  { key: 'safety_ppe', label: 'Safety practices (PPE)' },
  { key: 'tool_identification', label: 'Tool identification' },
  { key: 'practical_skills', label: 'Practical skills' },
  { key: 'accuracy', label: 'Accuracy of work' },
  { key: 'quality', label: 'Quality' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'time_taken', label: 'Time taken' },
  { key: 'workplace_behaviour', label: 'Workplace behaviour' },
] as const;

export function averageSopScore(scores: AssessmentScoresInput): number {
  const vals = [
    scores.safety_ppe,
    scores.tool_identification,
    scores.practical_skills,
    scores.accuracy,
    scores.quality,
    scores.productivity,
    scores.time_taken,
    scores.workplace_behaviour,
  ];
  const sum = vals.reduce((a, b) => a + Number(b || 0), 0);
  return Math.round((sum / vals.length) * 100) / 100;
}
