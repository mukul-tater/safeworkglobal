import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';

export const DEFAULT_SERVICE_CHARGE_INR = ASSESSMENT_FEE_INR;
export const SERVICE_CHARGE_MIN_INR = 1;
export const SERVICE_CHARGE_MAX_INR = 500_000;

/** Job service charge in INR, falling back to the platform default. */
export function resolveServiceChargeInr(amount: number | string | null | undefined): number {
  const n = typeof amount === 'string' ? Number(amount) : Number(amount);
  if (!Number.isFinite(n) || n < SERVICE_CHARGE_MIN_INR) return DEFAULT_SERVICE_CHARGE_INR;
  return Math.min(SERVICE_CHARGE_MAX_INR, Math.round(n));
}

export function formatServiceChargeInr(amount?: number | string | null): string {
  return `₹${resolveServiceChargeInr(amount).toLocaleString('en-IN')}`;
}

export function serviceChargeGstSplit(amount?: number | string | null) {
  const total = resolveServiceChargeInr(amount);
  const base = Math.round(total / 1.18);
  return { base, gst: total - base, total };
}
