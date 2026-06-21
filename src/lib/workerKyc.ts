const KYC_DOCUMENT_TYPES = new Set([
  'passport',
  'id_card',
  'aadhaar',
  'pan',
  'national_id',
  'visa',
]);

export interface WorkerDocumentKycRow {
  document_type: string;
  verification_status: string | null;
}

/** True when admin has verified at least one identity/KYC document. */
export function isWorkerKycVerified(documents: WorkerDocumentKycRow[]): boolean {
  return documents.some(
    (doc) =>
      doc.verification_status === 'verified' &&
      KYC_DOCUMENT_TYPES.has(doc.document_type.toLowerCase()),
  );
}
