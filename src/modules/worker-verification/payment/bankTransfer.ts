/** AGRIFOX current account — UPI-to-account via IFSC until a VPA is added. */
export const BANK_TRANSFER_ACCOUNT = {
  beneficiary: 'AGRIFOX SMART SOLUTIONS PVT LTD',
  accountNumber: '0897002100019045',
  bankName: 'Punjab National Bank',
  ifsc: 'PUNB0089700',
} as const;

/** Keep in sync with supabase/functions/razorpay-assessment. */
export const RAZORPAY_GATEWAY_FEE_PCT = 2.5;

export const BANK_TRANSFER_METHODS = [
  { id: 'upi', label: 'UPI' },
  { id: 'imps', label: 'IMPS' },
  { id: 'neft', label: 'NEFT' },
  { id: 'rtgs', label: 'RTGS' },
] as const;

export type BankTransferMethod = (typeof BANK_TRANSFER_METHODS)[number]['id'];

export function razorpayChargedAmountInr(baseFee: number): number {
  const base = Math.round(Number(baseFee) || 0);
  return Math.round(base * (1 + RAZORPAY_GATEWAY_FEE_PCT / 100));
}

export function razorpayGatewayFeeInr(baseFee: number): number {
  const base = Math.round(Number(baseFee) || 0);
  return razorpayChargedAmountInr(base) - base;
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Stable remark so ops can find the credit. Must match SQL bank_transfer_payment_note(). */
export function bankTransferPaymentNote(userId: string): string {
  const hex = userId.replace(/-/g, '').replace(/[^a-fA-F0-9]/g, '');
  return `SWG-${hex.slice(0, 6).toUpperCase()}`;
}

export function normalizeTransferRef(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function validateTransferRef(raw: string): string | null {
  const value = normalizeTransferRef(raw);
  if (value.length < 8 || value.length > 30) {
    return 'Enter the UTR or UPI reference from your receipt (8–30 characters)';
  }
  if (!/^[A-Z0-9]+$/.test(value)) {
    return 'Use only letters and numbers from your bank or UPI receipt';
  }
  return null;
}

export type BankTransferPayment = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  transfer_method: string | null;
  proof_path: string | null;
  proof_file_name: string | null;
  payment_note: string | null;
  transferred_on: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  created_at: string;
};

export function isBankTransferSubmitted(row: BankTransferPayment | null | undefined): boolean {
  return row?.provider === 'bank_transfer' && row.status === 'submitted';
}

export function isBankTransferRejected(row: BankTransferPayment | null | undefined): boolean {
  return row?.provider === 'bank_transfer' && row.status === 'rejected';
}
