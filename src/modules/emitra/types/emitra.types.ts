export type PartnerWorkerStatus =
  | 'registered'
  | 'verified'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'selected'
  | 'placed';

export type MigrationReadinessCategory =
  | 'placement_ready'
  | 'needs_preparation'
  | 'not_ready';

export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PartnerProfile {
  id: string;
  user_id: string;
  center_name: string | null;
  owner_name: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  emitra_id: string | null;
  village_city: string | null;
  state: string | null;
  district: string | null;
  address: string | null;
  pincode: string | null;
  has_computer: boolean | null;
  has_scanner: boolean | null;
  has_printer: boolean | null;
  has_internet: boolean | null;
  has_webcam?: boolean | null;
  worker_categories: string[] | null;
  years_in_operation: number | null;
  account_holder: string | null;
  account_number: string | null;
  ifsc: string | null;
  upi_id: string | null;
  bank_name?: string | null;
  emitra_certificate_url: string | null;
  pan_card_url: string | null;
  address_proof_url: string | null;
  shop_photo_url: string | null;
  owner_photo_url: string | null;
  pan_number: string | null;
  aadhaar_number?: string | null;
  date_of_birth?: string | null;
  gst_number?: string | null;
  csc_id?: string | null;
  shop_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  village?: string | null;
  panchayat?: string | null;
  city_town?: string | null;
  google_maps_url?: string | null;
  cancelled_cheque_url?: string | null;
  aadhaar_url?: string | null;
  inside_shop_photo_url?: string | null;
  training_declaration?: boolean | null;
  agree_mea_guidelines?: boolean | null;
  agree_platform_only?: boolean | null;
  agree_confidentiality?: boolean | null;
  agree_no_misrepresentation?: boolean | null;
  agree_accurate_info?: boolean | null;
  agree_not_sub_agent?: boolean | null;
  agreement_accepted_via_otp?: boolean | null;
  agreement_accepted_at?: string | null;
  status: string;
  partner_code: string | null;
  tier: PartnerTier | null;
  mobile_verified: boolean | null;
  compliance_acknowledged_at: string | null;
  info_request_message: string | null;
  no_jobs_promise: boolean | null;
  no_unauthorized_fees: boolean | null;
  total_incentives_earned: number | null;
  workers_registered: number | null;
  workers_placed: number | null;
  leaderboard_rank: number | null;
  submitted_at: string | null;
  rejection_reason: string | null;
  accepted_terms: boolean | null;
  current_step?: number | null;
  source_lsp_id?: string | null;
  lsp_verified_at?: string | null;
}

export interface PartnerWorker {
  id: string;
  partner_profile_id: string;
  full_name: string;
  mobile: string;
  whatsapp: string | null;
  skill: string;
  experience_level: string;
  passport_available: boolean;
  preferred_country: string | null;
  state: string | null;
  district: string | null;
  skill_level: string | null;
  operator_notes: string | null;
  ready_to_relocate: boolean | null;
  family_consent: boolean | null;
  previous_gcc_experience: boolean | null;
  expected_salary: number | null;
  migration_readiness_score: number;
  migration_category: MigrationReadinessCategory;
  photo_url: string | null;
  video_url: string | null;
  status: PartnerWorkerStatus;
  source_lsp_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerActivity {
  id: string;
  partner_profile_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PartnerIncentive {
  id: string;
  partner_profile_id: string;
  worker_id: string | null;
  incentive_type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface WorkerStatusHistory {
  id: string;
  worker_id: string;
  status: PartnerWorkerStatus;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalRegistered: number;
  documentsPending: number;
  interviewsScheduled: number;
  tradeTestsBooked: number;
  workersSelected: number;
  workersDeployed: number;
  earnings: number;
  /** @deprecated use documentsPending / interviewsScheduled */
  verified: number;
  interviewed: number;
  selected: number;
  placed: number;
  incentivesEarned: number;
}
