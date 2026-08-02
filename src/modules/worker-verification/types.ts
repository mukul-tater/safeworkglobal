export type VerificationStage =
  | 'essentials'
  | 'quiz'
  | 'media'
  | 'identity'
  | 'awaiting_interview'
  | 'awaiting_payment'
  | 'trade_test'
  | 'medical'
  | 'tests'
  | 'bond'
  | 'pdot'
  | 'deployment'
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
  trade_test_result_url: string | null;
  trade_test_center_id: string | null;
  trade_test_center_name: string | null;
  trade_test_reporting_window: string | null;
  trade_test_booked_at: string | null;
  medical_result_url: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  bond_status: string | null;
  gcc_ready_at: string | null;
  kyc_status: string | null;
  kyc_verified_at: string | null;
  kyc_rejection_reason: string | null;
  interview_scheduled_at: string | null;
  interview_meeting_url: string | null;
  interviewer_user_id: string | null;
  interview_status: string | null;
  interview_attempts: number | null;
  trade_test_scheduled_at: string | null;
  trade_test_place: string | null;
  trade_test_instructions: string | null;
  medical_scheduled_at: string | null;
  medical_place: string | null;
  medical_instructions: string | null;
  bond_template_id: string | null;
  bond_courier_tracking: string | null;
  bond_couriered_at: string | null;
  bond_received_at: string | null;
  pdot_status: string | null;
  pdot_provider: string | null;
  pdot_batch: string | null;
  pdot_training_url: string | null;
  pdot_scheduled_at: string | null;
  pdot_completed_at: string | null;
  pdot_proof_url: string | null;
  deploy_offer_status: string | null;
  deploy_contract_status: string | null;
  deploy_emigration_status: string | null;
  deploy_visa_status: string | null;
  deploy_insurance_status: string | null;
  deploy_ticket_status: string | null;
  deployed_at: string | null;
  deployment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillQuizItem {
  id: string;
  skill_code: string;
  question: string;
  question_hi: string | null;
  youtube_url: string | null;
  image_url: string | null;
  expected_answer: boolean;
  sort_order: number;
  region?: string | null;
  active?: boolean | null;
}

export interface BondTemplate {
  id: string;
  version: string;
  title: string;
  file_url: string;
  courier_address: string;
  instructions: string | null;
  active: boolean;
}

export interface SkillQuizConfig {
  id: string;
  skill_code: string;
  region: string | null;
  questions_to_show: number;
  selection_mode: 'random_active' | 'explicit_ids';
  selected_ids: string[];
  pass_score: number;
  active: boolean;
}

export interface InterviewerAssignment {
  interview_id: string;
  worker_user_id: string;
  full_name: string | null;
  primary_skill: string | null;
  state: string | null;
  quiz_score: number | null;
  scheduled_at: string | null;
  meeting_url: string | null;
  status: string | null;
  decision: string | null;
  attempt_no: number | null;
}
