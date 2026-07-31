/** Load Razorpay Checkout.js once and open a test/live payment. */

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = '1';
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Razorpay'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function getRazorpayKeyId(): string {
  return String(import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
}

export function isRazorpayConfigured(): boolean {
  return getRazorpayKeyId().startsWith('rzp_');
}

/**
 * Open Razorpay Checkout (test or live key).
 * Amount is in INR rupees; converted to paise for Razorpay.
 */
export async function openRazorpayCheckout(opts: {
  amountInr: number;
  description: string;
  name?: string;
  email?: string;
  contact?: string;
  orderId?: string;
  /** Prefer key returned from create_order; falls back to VITE_RAZORPAY_KEY_ID */
  keyId?: string;
}): Promise<RazorpaySuccessResponse> {
  const key = String(opts.keyId || getRazorpayKeyId()).trim();
  if (!key) throw new Error('Razorpay is not configured (VITE_RAZORPAY_KEY_ID)');

  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error('Razorpay SDK unavailable');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key,
      amount: Math.round(opts.amountInr * 100),
      currency: 'INR',
      name: 'SafeWork Global',
      description: opts.description,
      order_id: opts.orderId,
      prefill: {
        name: opts.name,
        email: opts.email,
        contact: opts.contact,
      },
      theme: { color: '#0F766E' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  });
}
