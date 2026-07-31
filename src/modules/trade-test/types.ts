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
  | 'practical_photo'
  | 'practical_video'
  | 'document';

export type TradeTestCenterRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  partner_id: string | null;
  reporting_window: string;
  is_active: boolean;
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
  face_match_confirmed: boolean;
  attendance_confirmed: boolean;
  kyc_photo_path: string | null;
  kyc_video_path: string | null;
  kyc_completed_at: string | null;
  docs_experience_ok: boolean | null;
  docs_passport_ok: boolean | null;
  docs_notes: string | null;
  outcome: AssessmentOutcome | null;
  quality_reviewed_by: string | null;
  quality_reviewed_at: string | null;
  quality_notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  worker_name?: string | null;
  worker_phone?: string | null;
  center_name?: string | null;
  primary_skill?: string | null;
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
