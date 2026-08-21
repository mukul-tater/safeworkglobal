import type {
  BondChecklist,
  BondJourneyDisplayStatus,
  BondSecurityRow,
  BondSecurityStatus,
} from './types';

export function bondChecklist(row: BondSecurityRow | null): BondChecklist {
  return {
    stampBondUploaded: Boolean(row?.bond_file_path),
    originalPrepared: Boolean(row?.courier_company && row?.tracking_number && row?.courier_date),
    courierReceiptUploaded: Boolean(row?.courier_receipt_path),
    workerChequeUploaded: Boolean(row?.worker_cheque_path && row?.worker_cheque_holder_name && row?.worker_cheque_number),
    guarantorDetailsSubmitted: Boolean(
      row?.guarantor_full_name &&
        row?.guarantor_relationship &&
        row?.guarantor_mobile &&
        row?.guarantor_address,
    ),
    guarantorChequeUploaded: Boolean(row?.guarantor_cheque_path && row?.guarantor_cheque_number),
    guarantorDeclarationAccepted: Boolean(row?.guarantor_declaration_accepted_at),
    guarantorOtpVerified: Boolean(row?.guarantor_otp_verified),
  };
}

export function checklistComplete(list: BondChecklist): boolean {
  return Object.values(list).every(Boolean);
}

export function displayBondStatus(input: {
  journeyStage: string;
  bondStatus: string | null;
  packStatus: BondSecurityStatus | null;
  originalReceived: boolean;
}): BondJourneyDisplayStatus {
  if (input.journeyStage !== 'bond' && !input.originalReceived) {
    if (['pdot', 'gcc_ready', 'deployment'].includes(input.journeyStage) && input.originalReceived) {
      return 'ORIGINAL_RECEIVED';
    }
    if (input.journeyStage !== 'bond') return 'LOCKED';
  }
  if (input.originalReceived) return 'ORIGINAL_RECEIVED';
  const status = input.packStatus || input.bondStatus;
  if (status === 'approved') return 'APPROVED';
  if (status === 'resubmission_required' || status === 'rejected') return 'RESUBMISSION_REQUIRED';
  if (status === 'submitted') return 'UNDER_VERIFICATION';
  if (status === 'in_progress') return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export function isBondLockedForEdit(status: BondSecurityStatus | null | undefined): boolean {
  return status === 'submitted' || status === 'approved';
}
