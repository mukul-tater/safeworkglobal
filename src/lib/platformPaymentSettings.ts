import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ASSESSMENT_FEE_INR, ASSESSMENT_FEE_INCLUSIONS } from '@/modules/worker-verification/constants';

/** Built-in values used until the database row loads, and if it never does. */
export const DEFAULT_PLATFORM_PAYMENT_SETTINGS = {
  defaultServiceChargeInr: ASSESSMENT_FEE_INR,
  uaeServiceChargeInr: 35400,
  uaeDeliveryServiceChargeInr: 94400,
  ukraineServiceChargeInr: 236000,
  europeServiceChargeInr: 354000,
  gstRatePct: 18,
  razorpayGatewayFeePct: 2.5,
  bankBeneficiary: 'AGRIFOX SMART SOLUTIONS PVT LTD',
  bankAccountNumber: '0897002100019045',
  bankName: 'Punjab National Bank',
  bankIfsc: 'PUNB0089700',
  feeInclusions: [...ASSESSMENT_FEE_INCLUSIONS] as string[],
  indemnityBondStampInr: 100,
  fxRates: {
    AED: 23,
    CZK: 665 / 150,
  } as Record<string, number>,
};

export type PlatformPaymentSettings = typeof DEFAULT_PLATFORM_PAYMENT_SETTINGS;

export type FxRateInput = { code: string; inrPerUnit: number };

let current: PlatformPaymentSettings = cloneSettings(DEFAULT_PLATFORM_PAYMENT_SETTINGS);
let fromDatabase = false;
let inflight: Promise<PlatformPaymentSettings> | null = null;
const listeners = new Set<() => void>();

function cloneSettings(settings: PlatformPaymentSettings): PlatformPaymentSettings {
  return {
    ...settings,
    feeInclusions: [...settings.feeInclusions],
    fxRates: { ...settings.fxRates },
  };
}

function publish(next: PlatformPaymentSettings, stored: boolean) {
  current = cloneSettings(next);
  fromDatabase = stored;
  listeners.forEach((listener) => listener());
}

export function getPlatformPaymentSettings(): PlatformPaymentSettings {
  return current;
}

export function paymentSettingsFromDatabase(): boolean {
  return fromDatabase;
}

export function subscribePlatformPaymentSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function finiteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapRow(row: Record<string, unknown>, fxRates: Record<string, number>): PlatformPaymentSettings {
  const defaults = DEFAULT_PLATFORM_PAYMENT_SETTINGS;
  const inclusions = Array.isArray(row.fee_inclusions)
    ? row.fee_inclusions.map((item) => String(item).trim()).filter(Boolean)
    : defaults.feeInclusions;
  return {
    defaultServiceChargeInr: finiteNumber(row.default_service_charge_inr, defaults.defaultServiceChargeInr),
    uaeServiceChargeInr: finiteNumber(row.uae_service_charge_inr, defaults.uaeServiceChargeInr),
    uaeDeliveryServiceChargeInr: finiteNumber(row.uae_delivery_service_charge_inr, defaults.uaeDeliveryServiceChargeInr),
    ukraineServiceChargeInr: finiteNumber(row.ukraine_service_charge_inr, defaults.ukraineServiceChargeInr),
    europeServiceChargeInr: finiteNumber(row.europe_service_charge_inr, defaults.europeServiceChargeInr),
    gstRatePct: finiteNumber(row.gst_rate_pct, defaults.gstRatePct),
    razorpayGatewayFeePct: finiteNumber(row.razorpay_gateway_fee_pct, defaults.razorpayGatewayFeePct),
    bankBeneficiary: String(row.bank_beneficiary || defaults.bankBeneficiary),
    bankAccountNumber: String(row.bank_account_number || defaults.bankAccountNumber),
    bankName: String(row.bank_name || defaults.bankName),
    bankIfsc: String(row.bank_ifsc || defaults.bankIfsc),
    feeInclusions: inclusions.length ? inclusions : [...defaults.feeInclusions],
    indemnityBondStampInr: finiteNumber(row.indemnity_bond_stamp_inr, defaults.indemnityBondStampInr),
    fxRates: { ...defaults.fxRates, ...fxRates },
  };
}

export async function loadPlatformPaymentSettings(): Promise<PlatformPaymentSettings> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const db = supabase as any;
      const [settingsRes, fxRes] = await Promise.all([
        db.from('platform_payment_settings').select('*').eq('id', 1).maybeSingle(),
        db.from('fx_rates').select('currency_code, inr_per_unit'),
      ]);
      const fxRates: Record<string, number> = {};
      if (!fxRes.error && Array.isArray(fxRes.data)) {
        for (const row of fxRes.data) {
          const code = String(row.currency_code || '').toUpperCase();
          const rate = Number(row.inr_per_unit);
          if (code && Number.isFinite(rate) && rate > 0) fxRates[code] = rate;
        }
      }
      if (settingsRes.error || !settingsRes.data) {
        if (Object.keys(fxRates).length) {
          publish({ ...cloneSettings(current), fxRates: { ...current.fxRates, ...fxRates } }, fromDatabase);
        }
        return current;
      }
      publish(mapRow(settingsRes.data, fxRates), true);
      return current;
    } catch {
      return current;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function usePlatformPaymentSettings(): PlatformPaymentSettings {
  const [settings, setSettings] = useState(current);
  useEffect(() => {
    const unsubscribe = subscribePlatformPaymentSettings(() => setSettings(getPlatformPaymentSettings()));
    void loadPlatformPaymentSettings();
    return unsubscribe;
  }, []);
  return settings;
}

export function getDefaultServiceChargeInr(): number {
  return current.defaultServiceChargeInr;
}

export function getRazorpayGatewayFeePct(): number {
  return current.razorpayGatewayFeePct;
}

export function getAssessmentFeeInclusions(): string[] {
  return current.feeInclusions;
}

export function getBankTransferAccount() {
  return {
    beneficiary: current.bankBeneficiary,
    accountNumber: current.bankAccountNumber,
    bankName: current.bankName,
    ifsc: current.bankIfsc,
  };
}

export function getIndemnityBondStampInr(): number {
  return current.indemnityBondStampInr;
}

/** Swap the built-in ₹100 stamp wording for the configured amount. */
export function withConfiguredStamp(text: string): string {
  const amount = Math.round(getIndemnityBondStampInr());
  const label = `₹${amount.toLocaleString('en-IN')}`;
  if (label === '₹100') return text;
  return text.split('₹100').join(label);
}

export function getInrPerUnit(currency: string): number | null {
  const rate = current.fxRates[currency.toUpperCase()];
  return rate != null && Number.isFinite(rate) && rate > 0 ? rate : null;
}

export type PlatformPaymentSettingsInput = {
  defaultServiceChargeInr: number;
  uaeServiceChargeInr: number;
  uaeDeliveryServiceChargeInr: number;
  ukraineServiceChargeInr: number;
  europeServiceChargeInr: number;
  gstRatePct: number;
  razorpayGatewayFeePct: number;
  bankBeneficiary: string;
  bankAccountNumber: string;
  bankName: string;
  bankIfsc: string;
  feeInclusions: string[];
  indemnityBondStampInr: number;
  fxRates: FxRateInput[];
};

export async function savePlatformPaymentSettings(input: PlatformPaymentSettingsInput): Promise<void> {
  const db = supabase as any;
  const { error } = await db.rpc('admin_save_platform_payment_settings', {
    p_default_service_charge_inr: input.defaultServiceChargeInr,
    p_uae_service_charge_inr: input.uaeServiceChargeInr,
    p_uae_delivery_service_charge_inr: input.uaeDeliveryServiceChargeInr,
    p_ukraine_service_charge_inr: input.ukraineServiceChargeInr,
    p_europe_service_charge_inr: input.europeServiceChargeInr,
    p_gst_rate_pct: input.gstRatePct,
    p_razorpay_gateway_fee_pct: input.razorpayGatewayFeePct,
    p_bank_beneficiary: input.bankBeneficiary,
    p_bank_account_number: input.bankAccountNumber,
    p_bank_name: input.bankName,
    p_bank_ifsc: input.bankIfsc,
    p_fee_inclusions: input.feeInclusions,
    p_indemnity_bond_stamp_inr: input.indemnityBondStampInr,
    p_fx: input.fxRates.map((row) => ({ code: row.code, inr_per_unit: row.inrPerUnit })),
  });
  if (error) throw new Error(error.message);
  await loadPlatformPaymentSettings();
}
