import { supabase } from '@/integrations/supabase/client';

const RZP_FN_URL = `${String(
  import.meta.env.VITE_SUPABASE_URL || 'https://etpiadoqryvtlpmiuxia.supabase.co',
).replace(/\/$/, '')}/functions/v1/razorpay-assessment`;

export type CustomPaymentLink = {
  payment_link_id: string;
  short_url: string;
  amount_inr: number;
};

export type CustomPaymentStatus = {
  paid: boolean;
  amount_inr: number;
  status: string;
};

type RazorpayFnResponse = CustomPaymentLink & CustomPaymentStatus & { error?: string };

async function callRazorpayFn(body: Record<string, unknown>): Promise<RazorpayFnResponse> {
  await supabase.auth.refreshSession().catch(() => null);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sign in to pay.');

  const res = await fetch(RZP_FN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  let json: RazorpayFnResponse = { paid: false, amount_inr: 0, status: '', payment_link_id: '', short_url: '' };
  try {
    json = (await res.json()) as RazorpayFnResponse;
  } catch {
    json = { paid: false, amount_inr: 0, status: '', payment_link_id: '', short_url: '' };
  }
  if (!res.ok || json?.error) {
    throw new Error(json?.error || `Payment service error (${res.status})`);
  }
  return json;
}

/** Razorpay payment link for the rupee amount the user typed. The charged total is stored first. */
export function createCustomPaymentLink(amountInr: number): Promise<CustomPaymentLink> {
  return callRazorpayFn({ action: 'create_payment_link', amount_inr: amountInr });
}

/** Confirm a payment link against the amount saved when it was created. */
export function confirmCustomPaymentLink(paymentLinkId: string): Promise<CustomPaymentStatus> {
  return callRazorpayFn({ action: 'confirm_payment_link', razorpay_payment_link_id: paymentLinkId });
}
