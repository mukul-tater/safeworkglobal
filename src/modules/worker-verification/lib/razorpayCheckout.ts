/** Load Razorpay Checkout.js once and open payment with a server-issued key + order. */

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

/**
 * Open Razorpay Checkout.
 * `keyId` must come from the razorpay-assessment edge function (create_order) —
 * do not use VITE_ secrets; Lovable cannot store those safely.
 */
export async function openRazorpayCheckout(opts: {
  amountInr: number;
  description: string;
  keyId: string;
  name?: string;
  email?: string;
  contact?: string;
  orderId: string;
}): Promise<RazorpaySuccessResponse> {
  const key = String(opts.keyId || '').trim();
  if (!key.startsWith('rzp_')) {
    throw new Error('Razorpay key missing from payment order. Deploy razorpay-assessment edge function.');
  }
  if (!opts.orderId) {
    throw new Error('Razorpay order id missing');
  }

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
