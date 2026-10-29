import { ASSESSMENT_FEE_INR } from '@/modules/worker-verification/constants';
import {
  getPlatformPaymentSettings,
  type PlatformPaymentSettings,
} from '@/lib/platformPaymentSettings';

export const DEFAULT_SERVICE_CHARGE_INR = ASSESSMENT_FEE_INR;
export const SERVICE_CHARGE_MIN_INR = 1;
export const SERVICE_CHARGE_MAX_INR = 500_000;

/** Job service charge in INR. Missing or invalid amounts are 0. */
export function resolveServiceChargeInr(amount: number | string | null | undefined): number {
  const n = typeof amount === 'string' ? Number(amount) : Number(amount);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(SERVICE_CHARGE_MAX_INR, Math.round(n));
}

export function formatServiceChargeInr(amount?: number | string | null): string {
  return `₹${resolveServiceChargeInr(amount).toLocaleString('en-IN')}`;
}

function formatGstPercent(pct: number): string {
  const rounded = Math.round(pct * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Worker-facing label. The job's saved charge is what the worker pays.
 * The GST % from Fees & payments is written next to that amount.
 */
export function formatServiceChargePlusGst(amount?: number | string | null): string {
  const total = resolveServiceChargeInr(amount);
  const formatted = `₹${total.toLocaleString('en-IN')}`;
  const gst = getPlatformPaymentSettings().gstRatePct;
  if (!Number.isFinite(gst) || gst <= 0) return formatted;
  return `${formatted} + ${formatGstPercent(gst)}% GST`;
}

/** Preset used when an admin posts a new job. Delivery wins over the UAE preset. */
export function suggestedServiceChargeInr(input: {
  country?: string | null;
  title?: string | null;
  settings?: PlatformPaymentSettings;
}): { amount: number; label: string } {
  const settings = input.settings ?? getPlatformPaymentSettings();
  const country = (input.country || '').trim().toLowerCase();
  const title = (input.title || '').trim().toLowerCase();
  const delivery = /\b(delivery|bike rider|bike delivery)\b/.test(title);
  if (country === 'uae' && delivery) {
    return { amount: settings.uaeDeliveryServiceChargeInr, label: 'UAE bike delivery' };
  }
  const nanny = /\b(nanny|house maid|maid|house help)\b/.test(title);
  if (country === 'uae' && nanny) {
    return { amount: 25000, label: 'UAE Nanny / House Maid' };
  }
  if (country === 'uae') return { amount: settings.uaeServiceChargeInr, label: 'UAE trades' };
  if (country === 'ukraine') return { amount: settings.ukraineServiceChargeInr, label: 'Ukraine listings' };
  if (country === 'europe') return { amount: settings.europeServiceChargeInr, label: 'Europe listings' };
  return { amount: settings.defaultServiceChargeInr, label: 'default' };
}
