export type BondSecurityStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'resubmission_required'
  | 'approved'
  | 'rejected';

export type BondCourierStatus = 'pending' | 'couriered' | 'received' | 'verified' | 'rejected';

export type BondFileKind = 'bond' | 'courier_receipt' | 'worker_cheque' | 'guarantor_cheque';

export type BondJourneyDisplayStatus =
  | 'LOCKED'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'RESUBMISSION_REQUIRED'
  | 'APPROVED'
  | 'ORIGINAL_RECEIVED';

export interface StampPaperValue {
  state_id: string;
  state_name: string;
  name_hi: string | null;
  state_type: 'state' | 'union_territory';
  minimum_stamp_value: number;
  currency: string;
  aliases?: string[];
  active?: boolean;
}

export interface BondSecurityFile {
  id: string;
  submission_id: string;
  user_id: string;
  kind: BondFileKind;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
  replaced_at: string | null;
  deleted_at: string | null;
}

export interface BondSecurityRow {
  id: string;
  user_id: string;
  version: number;
  status: BondSecurityStatus;
  rejection_reason: string | null;
  confirmed_state: string | null;
  state_id: string | null;
  applicable_stamp_value: number | null;
  stamp_currency: string;
  state_confirmed: boolean;
  state_confirmed_at: string | null;
  bond_file_path: string | null;
  bond_file_name: string | null;
  bond_uploaded_at: string | null;
  bond_doc_status: string;
  courier_company: string | null;
  tracking_number: string | null;
  courier_date: string | null;
  courier_receipt_path: string | null;
  courier_receipt_name: string | null;
  courier_status: BondCourierStatus;
  worker_cheque_holder_name: string | null;
  worker_cheque_bank_name: string | null;
  worker_cheque_number: string | null;
  worker_cheque_date: string | null;
  worker_cheque_amount: number | null;
  worker_cheque_path: string | null;
  worker_cheque_name: string | null;
  guarantor_full_name: string | null;
  guarantor_relationship: string | null;
  guarantor_mobile: string | null;
  guarantor_address: string | null;
  guarantor_bank_name: string | null;
  guarantor_cheque_holder_name: string | null;
  guarantor_cheque_number: string | null;
  guarantor_cheque_date: string | null;
  guarantor_cheque_amount: number | null;
  guarantor_cheque_path: string | null;
  guarantor_cheque_name: string | null;
  guarantor_declaration_accepted_at: string | null;
  guarantor_otp_verified: boolean;
  guarantor_otp_verified_at: string | null;
  authenticity_declared_at: string | null;
  no_guarantee_declared_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BondSecurityDraftPayload {
  state_confirmed?: boolean;
  courier_company?: string;
  tracking_number?: string;
  courier_date?: string | null;
  worker_cheque_holder_name?: string;
  worker_cheque_bank_name?: string;
  worker_cheque_number?: string;
  worker_cheque_date?: string | null;
  worker_cheque_amount?: number | null;
  guarantor_full_name?: string;
  guarantor_relationship?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  guarantor_bank_name?: string;
  guarantor_cheque_holder_name?: string;
  guarantor_cheque_number?: string;
  guarantor_cheque_date?: string | null;
  guarantor_cheque_amount?: number | null;
  guarantor_declaration?: boolean;
  authenticity_declared?: boolean;
  no_guarantee_declared?: boolean;
}

export interface BondChecklist {
  stampBondUploaded: boolean;
  originalPrepared: boolean;
  courierReceiptUploaded: boolean;
  workerChequeUploaded: boolean;
  guarantorDetailsSubmitted: boolean;
  guarantorChequeUploaded: boolean;
  guarantorDeclarationAccepted: boolean;
  guarantorOtpVerified: boolean;
}
