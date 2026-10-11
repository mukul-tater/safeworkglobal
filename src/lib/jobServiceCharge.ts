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

/** Worker-facing label. Shows the admin-entered amount with “+ GST” as text. GST is not calculated. */
export function formatServiceChargePlusGst(amount?: number | string | null): string {
  const total = resolveServiceChargeInr(amount);
  return `₹${total.toLocaleString('en-IN')} + GST`;
}
