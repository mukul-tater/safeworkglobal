import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { getWorkerDocumentSignedUrl } from '@/lib/storage';
import { isValidIndianMobile, normalizeIndianMobile } from '@/lib/validations/common';
import type { BondTemplate } from '../types';
import { lookupStampPaper, STATE_STAMP_PAPER_VALUES } from '../bond-security/stampPaper';
import type {
  BondFileKind,
  BondSecurityDraftPayload,
  BondSecurityRow,
  StampPaperValue,
} from '../bond-security/types';

const supabase: any = supabaseTyped;
const DOCS_BUCKET = 'worker-documents';
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const API_BASE = import.meta.env.VITE_WORKER_API_URL || '/api';

export const BOND_SECURITY_ACCEPT = 'application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png';

function rpcError(error: { message?: string } | null): never {
  throw new Error(error?.message || 'Request failed');
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args ?? {});
  if (error) rpcError(error);
  return data as T;
}

export async function listStampPaperValues(): Promise<StampPaperValue[]> {
  const { data, error } = await supabase
    .from('state_stamp_paper_values')
    .select('state_id, state_name, name_hi, state_type, minimum_stamp_value, currency, aliases, active')
    .eq('active', true);
  if (error || !data?.length) return STATE_STAMP_PAPER_VALUES;
  return data as StampPaperValue[];
}

export function stampForRegisteredState(
  registeredState: string | null | undefined,
  catalog: StampPaperValue[],
): StampPaperValue | null {
  return lookupStampPaper(registeredState, catalog);
}

export async function loadBondSecurity(userId: string): Promise<BondSecurityRow | null> {
  const { data, error } = await supabase
    .from('worker_bond_security')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BondSecurityRow) || null;
}

export async function upsertBondSecurity(payload: BondSecurityDraftPayload): Promise<BondSecurityRow> {
  return rpc<BondSecurityRow>('worker_upsert_bond_security', { p_payload: payload });
}

export async function submitBondSecurity(): Promise<BondSecurityRow> {
  return rpc<BondSecurityRow>('worker_submit_bond_security');
}

export async function confirmGuarantorOtp(mobile: string): Promise<BondSecurityRow> {
  return rpc<BondSecurityRow>('worker_confirm_guarantor_otp', {
    p_mobile: normalizeIndianMobile(mobile),
  });
}

export function validateBondFile(file: File): string | null {
  if (file.size > MAX_BYTES) return 'Maximum file size is 10 MB.';
  const typeOk = ACCEPT.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!typeOk) return 'Accepted formats: PDF, JPG, JPEG, PNG.';
  return null;
}

export async function uploadBondSecurityFile(
  userId: string,
  kind: BondFileKind,
  file: File,
): Promise<BondSecurityRow> {
  const invalid = validateBondFile(file);
  if (invalid) throw new Error(invalid);
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${userId}/bond-security/${kind}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) throw new Error(upErr.message);
  return rpc<BondSecurityRow>('worker_attach_bond_security_file', {
    p_kind: kind,
    p_path: path,
    p_file_name: file.name,
    p_file_size: file.size,
  });
}

export async function previewBondSecurityFile(pathOrUrl: string): Promise<string> {
  return getWorkerDocumentSignedUrl(pathOrUrl, 60 * 10);
}

export async function sendGuarantorOtp(mobile: string): Promise<{ demo?: boolean; message: string }> {
  const mobileNumber = normalizeIndianMobile(mobile);
  if (!isValidIndianMobile(mobileNumber)) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }
  const res = await fetch(`${API_BASE}/bond/guarantor-otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || body.errors?.mobileNumber?.[0] || 'Could not send OTP');
  }
  return body.data || { message: body.message || 'OTP sent' };
}

export async function verifyGuarantorOtpApi(
  mobile: string,
  otp: string,
): Promise<{ verified: boolean }> {
  const mobileNumber = normalizeIndianMobile(mobile);
  const res = await fetch(`${API_BASE}/bond/guarantor-otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, otp: otp.replace(/\D/g, '') }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || body.errors?.otp?.[0] || 'OTP verification failed');
  }
  return { verified: true };
}

export async function reviewBondSecurity(
  userId: string,
  action: 'approve' | 'reject' | 'resubmission',
  reason?: string,
): Promise<void> {
  await rpc('admin_review_bond_security', {
    p_user_id: userId,
    p_action: action,
    p_reason: reason || null,
  });
}

export async function markBondOriginalReceived(userId: string): Promise<void> {
  await rpc('admin_mark_bond_received', { p_user_id: userId });
}

export async function loadBondSecurityForAdmin(userId: string): Promise<BondSecurityRow | null> {
  return loadBondSecurity(userId);
}

export type BondTemplateWithCheques = BondTemplate & {
  worker_cheque_amount?: number | null;
  guarantor_cheque_amount?: number | null;
};
