import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ASSESSMENT_FEE_INR = 35400;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function razorpayAuthHeader(keyId: string, keySecret: string): string {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

type RazorpayPayment = {
  id: string;
  status?: string;
  order_id?: string;
  amount?: number;
};

function isSettled(status?: string): boolean {
  return status === "captured" || status === "authorized";
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const keyId = (Deno.env.get("RAZORPAY_KEY_ID") || Deno.env.get("VITE_RAZORPAY_KEY_ID") || "").trim();
  const keySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") || "").trim();
  if (!keyId.startsWith("rzp_") || !keySecret) {
    return json(500, {
      error:
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the edge function.",
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Missing authorization" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) return json(401, { error: "Not authenticated" });

  const admin = createClient(supabaseUrl, serviceKey);

  async function resolvePayerUserId(requested?: string): Promise<string> {
    const requestedId = String(requested || "").trim();
    if (!requestedId || requestedId === user.id) return user.id;
    const { data, error } = await userClient.rpc("partner_manages_worker", {
      _worker_user_id: requestedId,
    });
    if (error) throw new Error(error.message);
    if (data !== true) {
      throw new Error("Not allowed to pay assessment for this worker");
    }
    return requestedId;
  }

  let body: {
    action?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    worker_user_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const action = body.action || "create_order";

  const rzpAuth = razorpayAuthHeader(keyId, keySecret);

  async function rzpGet(path: string): Promise<{ ok: boolean; json: any }> {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      headers: { Authorization: rzpAuth },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  }

  /** Find a captured/authorized payment on an order. */
  async function findSettledPayment(
    orderId: string,
  ): Promise<{ payment: RazorpayPayment | null; error?: string }> {
    const { ok, json } = await rzpGet(`/orders/${orderId}/payments`);
    if (!ok) {
      return {
        payment: null,
        error: json?.error?.description || "Could not read Razorpay order payments",
      };
    }
    const items: RazorpayPayment[] = Array.isArray(json?.items) ? json.items : [];
    return { payment: items.find((p) => isSettled(p.status)) || null };
  }

  async function completePayment(paymentId: string, orderId: string, payerId: string) {
    const { data, error } = await admin.rpc("complete_assessment_payment_razorpay", {
      p_user_id: payerId,
      p_payment_id: paymentId,
      p_order_id: orderId,
      p_amount: ASSESSMENT_FEE_INR,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  try {
    const payerId = await resolvePayerUserId(body.worker_user_id);

    if (action === "create_order") {
      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("id, stage, payment_status, user_id, razorpay_order_id")
        .eq("user_id", payerId)
        .maybeSingle();
      if (rowErr) throw new Error(rowErr.message);
      if (!row) return json(404, { error: "Verification row not found" });
      if (row.stage !== "awaiting_payment") {
        return json(400, { error: "Payment stage is not active" });
      }
      if (row.payment_status === "paid") {
        return json(400, { error: "Assessment already paid" });
      }

      // Recovery: an earlier order may already be paid but never verified.
      if (row.razorpay_order_id) {
        const { payment, error: findErr } = await findSettledPayment(row.razorpay_order_id);
        if (findErr && /authenticat/i.test(findErr)) {
          return json(502, { error: findErr });
        }
        if (payment) {
          const verification = await completePayment(payment.id, row.razorpay_order_id, payerId);
          return json(200, { recovered: true, verification, already_paid: true });
        }
      }

      const amountPaise = ASSESSMENT_FEE_INR * 100;
      const receipt = `assess_${payerId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`
        .slice(0, 40);

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: razorpayAuthHeader(keyId, keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            user_id: payerId,
            purpose: "worker_assessment_fee",
          },
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        console.error("razorpay order error", orderJson);
        return json(502, {
          error: orderJson?.error?.description || "Could not create Razorpay order",
        });
      }

      const { error: updErr } = await admin
        .from("worker_verification")
        .update({
          razorpay_order_id: orderJson.id,
          payment_amount: ASSESSMENT_FEE_INR,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);

      return json(200, {
        order_id: orderJson.id,
        amount_inr: ASSESSMENT_FEE_INR,
        amount_paise: amountPaise,
        currency: "INR",
        key_id: keyId,
      });
    }

    if (action === "verify_payment") {
      const paymentId = String(body.razorpay_payment_id || "").trim();
      const orderId = String(body.razorpay_order_id || "").trim();
      const signature = String(body.razorpay_signature || "").trim();
      if (!paymentId || !orderId) {
        return json(400, { error: "Missing payment verification fields" });
      }

      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("*")
        .eq("user_id", payerId)
        .maybeSingle();
      if (rowErr) throw new Error(rowErr.message);
      if (!row) return json(404, { error: "Verification row not found" });
      if (row.stage !== "awaiting_payment" && row.payment_status !== "paid") {
        return json(400, { error: "Payment stage is not active" });
      }
      if (row.payment_status === "paid") {
        return json(200, { verification: row, already_paid: true });
      }
      if (row.razorpay_order_id && row.razorpay_order_id !== orderId) {
        return json(400, { error: "Order does not match this assessment" });
      }

      const expected = signature
        ? await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`)
        : "";
      let verifiedBy = "signature";

      if (!signature || expected !== signature) {
        // Signature missing/mismatched — confirm the real capture with Razorpay.
        const { ok, json: payment } = await rzpGet(`/payments/${paymentId}`);
        if (!ok) {
          return json(400, {
            error:
              payment?.error?.description ||
              "Invalid payment signature and payment could not be confirmed",
          });
        }
        if (!isSettled(payment?.status) || String(payment?.order_id || "") !== orderId) {
          return json(400, { error: "Payment is not captured for this order" });
        }
        verifiedBy = "razorpay_api";
      }

      const completed = await completePayment(paymentId, orderId, payerId);
      return json(200, { verification: completed, already_paid: false, verified_by: verifiedBy });
    }

    if (action === "recover_payment") {
      const orderId = String(body.razorpay_order_id || "").trim();
      let paymentId = String(body.razorpay_payment_id || "").trim();

      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("*")
        .eq("user_id", payerId)
        .maybeSingle();
      if (rowErr) throw new Error(rowErr.message);
      if (!row) return json(404, { error: "Verification row not found" });
      if (row.payment_status === "paid") {
        return json(200, { verification: row, already_paid: true });
      }

      const targetOrder = orderId || String(row.razorpay_order_id || "");
      if (!targetOrder && !paymentId) {
        return json(400, { error: "No Razorpay order or payment to recover" });
      }

      if (!paymentId) {
        const { payment, error: findErr } = await findSettledPayment(targetOrder);
        if (!payment) {
          return json(400, {
            error: findErr || "No captured payment found on this order",
          });
        }
        paymentId = payment.id;
      } else {
        const { ok, json: payment } = await rzpGet(`/payments/${paymentId}`);
        if (!ok || !isSettled(payment?.status)) {
          return json(400, {
            error: payment?.error?.description || "Payment is not captured",
          });
        }
        if (targetOrder && String(payment?.order_id || "") !== targetOrder) {
          return json(400, { error: "Payment does not belong to this order" });
        }
      }

      const verification = await completePayment(paymentId, targetOrder, payerId);
      return json(200, { verification, recovered: true });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("razorpay-assessment", e);
    return json(500, {
      error: e instanceof Error ? e.message : "Payment processing failed",
    });
  }
});
