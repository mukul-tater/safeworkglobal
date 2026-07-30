export type VerificationStage =
  | 'essentials'
  | 'quiz'
  | 'media'
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'tests'
  | 'bond'
  | 'gcc_ready';

export interface WorkerVerification {
  id: string;
  user_id: string;
  stage: VerificationStage;
  terms_accepted_at: string | null;
  terms_version: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  education_level: string | null;
  primary_skill: string | null;
  essentials_completed_at: string | null;
  quiz_score: number | null;
  quiz_completed_at: string | null;
  media_submitted_at: string | null;
  interview_score: number | null;
  interview_notes: string | null;
  interview_rated_at: string | null;
  trade_test_required: boolean | null;
  payment_status: string | null;
  payment_amount: number | null;
  paid_at: string | null;
  medical_status: string | null;
  trade_test_status: string | null;
  bond_status: string | null;
  gcc_ready_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillQuizItem {
  id: string;
  skill_code: string;
  question: string;
  youtube_url: string | null;
  image_url: string | null;
  expected_answer: boolean;
  sort_order: number;
}
