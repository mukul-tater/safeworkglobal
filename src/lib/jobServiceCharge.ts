import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import { getPlatformPaymentSettings } from '@/lib/platformPaymentSettings';

export const DEFAULT_SERVICE_CHARGE_INR = ASSESSMENT_FEE_INR;
export const SERVICE_CHARGE_MIN_INR = 1;
export const SERVICE_CHARGE_MAX_INR = 500_000;

/** Job service charge in INR, falling back to the platform default. */
export function resolveServiceChargeInr(amount: number | string | null | undefined): number {
  const n = typeof amount === 'string' ? Number(amount) : Number(amount);
  if (!Number.isFinite(n) || n < SERVICE_CHARGE_MIN_INR) {
    return getPlatformPaymentSettings().defaultServiceChargeInr;
  }
  return Math.min(SERVICE_CHARGE_MAX_INR, Math.round(n));
}

export function formatServiceChargeInr(amount?: number | string | null): string {
  return `₹${resolveServiceChargeInr(amount).toLocaleString('en-IN')}`;
}

export function serviceChargeGstSplit(amount?: number | string | null) {
  const total = resolveServiceChargeInr(amount);
  const rate = getPlatformPaymentSettings().gstRatePct;
  const base = rate <= 0 ? total : Math.round(total / (1 + rate / 100));
  return { base, gst: total - base, total, rate };
}

/** Worker-facing label. The stored amount includes GST; the label shows only the base. */
export function formatServiceChargePlusGst(amount?: number | string | null): string {
  const { base, total, rate } = serviceChargeGstSplit(amount);
  if (rate <= 0) return `₹${total.toLocaleString('en-IN')}`;
  return `₹${base.toLocaleString('en-IN')} + GST`;
}
