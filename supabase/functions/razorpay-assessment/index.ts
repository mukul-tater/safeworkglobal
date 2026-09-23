import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ASSESSMENT_FEE_INR = 35400;
/** Keep in sync with src/modules/worker-verification/payment/bankTransfer.ts */
const RAZORPAY_GATEWAY_FEE_PCT = 2.5;

function resolveFeeInr(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return ASSESSMENT_FEE_INR;
  return Math.round(n);
}

function withGatewayFee(baseFee: number): { base: number; fee: number; charged: number } {
  const base = resolveFeeInr(baseFee);
  const charged = Math.round(base * (1 + RAZORPAY_GATEWAY_FEE_PCT / 100));
  return { base, fee: charged - base, charged };
}

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
  return status === "captured";
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
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

  async function resolveAssessmentFee(payerId: string): Promise<number> {
    const { data: row, error } = await admin
      .from("worker_verification")
      .select("journey_job_id")
      .eq("user_id", payerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.journey_job_id) return ASSESSMENT_FEE_INR;
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("service_charge")
      .eq("id", row.journey_job_id)
      .maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    return resolveFeeInr(job?.service_charge);
  }

  async function completePayment(paymentId: string, orderId: string, payerId: string, amountInr: number) {
    const { data, error } = await admin.rpc("complete_assessment_payment_razorpay", {
      p_user_id: payerId,
      p_payment_id: paymentId,
      p_order_id: orderId,
      p_amount: amountInr,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  try {
    if (action === "create_job_change_order" || action === "verify_job_change_payment") {
      const payerId = await resolvePayerUserId(body.worker_user_id);
      const { data: feeRow, error: feeErr } = await admin
        .from("worker_verification")
        .select("job_change_fee_due, job_change_fee_paid_at")
        .eq("user_id", payerId)
        .maybeSingle();
      if (feeErr) throw new Error(feeErr.message);
      const due = Math.round(Number(feeRow?.job_change_fee_due || 0));
      if (due < 1) return json(400, { error: "No extra amount is due" });
      if (feeRow?.job_change_fee_paid_at) {
        return json(200, { already_paid: true, amount_inr: due });
      }

      if (action === "create_job_change_order") {
        const { base, fee, charged } = withGatewayFee(due);
        const amountPaise = charged * 100;
        const receipt = `jchg_${payerId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`.slice(0, 40);
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
              purpose: "job_change_fee",
              base_fee_inr: String(base),
              charged_inr: String(charged),
            },
          }),
        });
        const orderJson = await orderRes.json();
        if (!orderRes.ok) {
          return json(502, {
            error: orderJson?.error?.description || "Could not create Razorpay order",
          });
        }
        const { error: insErr } = await admin.from("worker_job_change_payments").insert({
          user_id: payerId,
          amount: base,
          charged_amount: charged,
          status: "pending",
          provider: "razorpay",
          razorpay_order_id: orderJson.id,
        });
        if (insErr) throw new Error(insErr.message);
        return json(200, {
          order_id: orderJson.id,
          amount_inr: charged,
          amount_paise: amountPaise,
          base_fee_inr: base,
          gateway_fee_inr: fee,
          currency: "INR",
          key_id: keyId,
        });
      }

      const paymentId = String(body.razorpay_payment_id || "").trim();
      const orderId = String(body.razorpay_order_id || "").trim();
      if (!paymentId || !orderId) {
        return json(400, { error: "Missing payment verification fields" });
      }
      const { data: pendingPay, error: pendingErr } = await admin
        .from("worker_job_change_payments")
        .select("id, charged_amount, razorpay_order_id")
        .eq("user_id", payerId)
        .eq("razorpay_order_id", orderId)
        .eq("status", "pending")
        .maybeSingle();
      if (pendingErr) throw new Error(pendingErr.message);
      if (!pendingPay) return json(400, { error: "No job-change order matches this payment" });

      const expectedPaise = Math.round(Number(pendingPay.charged_amount || due)) * 100;
      const expectedSig = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
      const signature = String(body.razorpay_signature || "").trim();
      if (!signature || !timingSafeEqual(expectedSig, signature)) {
        const { ok, json: payment } = await rzpGet(`/payments/${paymentId}`);
        if (!ok || !isSettled(payment?.status) || String(payment?.order_id || "") !== orderId) {
          return json(400, { error: "Payment could not be confirmed" });
        }
        if (Number(payment?.amount) !== expectedPaise) {
          return json(400, { error: "Payment amount does not match this job change" });
        }
      }
      const { error: doneErr } = await admin.rpc("complete_job_change_fee_razorpay", {
        p_user_id: payerId,
        p_payment_id: paymentId,
        p_order_id: orderId,
        p_amount: Number(pendingPay.charged_amount || due),
      });
      if (doneErr) throw new Error(doneErr.message);
      return json(200, { already_paid: true, amount_inr: due });
    }

    const payerId = await resolvePayerUserId(body.worker_user_id);
    const assessmentFee = await resolveAssessmentFee(payerId);

    if (action === "create_order") {
      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("id, stage, payment_status, user_id, razorpay_order_id, payment_amount")
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
          const { ok, json: full } = await rzpGet(`/payments/${payment.id}`);
          const { ok: orderOk, json: order } = await rzpGet(`/orders/${row.razorpay_order_id}`);
          const expectedPaise = resolveFeeInr(row.payment_amount ?? assessmentFee) * 100;
          const noteUser = String(full?.notes?.user_id || order?.notes?.user_id || "").trim();
          if (
            ok &&
            orderOk &&
            isSettled(full?.status) &&
            String(full?.order_id || "") === row.razorpay_order_id &&
            Number(full?.amount) === expectedPaise &&
            noteUser === payerId
          ) {
            const verification = await completePayment(
              payment.id,
              row.razorpay_order_id,
              payerId,
              resolveFeeInr(row.payment_amount ?? assessmentFee),
            );
            return json(200, { recovered: true, verification, already_paid: true });
          }
        }
      }

      const { base, fee, charged } = withGatewayFee(assessmentFee);
      const amountPaise = charged * 100;
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
            base_fee_inr: String(base),
            gateway_fee_pct: String(RAZORPAY_GATEWAY_FEE_PCT),
            charged_inr: String(charged),
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
          payment_amount: charged,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);

      return json(200, {
        order_id: orderJson.id,
        amount_inr: charged,
        amount_paise: amountPaise,
        base_fee_inr: base,
        gateway_fee_inr: fee,
        gateway_fee_pct: RAZORPAY_GATEWAY_FEE_PCT,
        currency: "INR",
        key_id: keyId,
      });
    }

    async function assertPaymentOwned(
      paymentId: string,
      orderId: string,
      expectedPaise: number,
    ): Promise<{ verifiedBy: string }> {
      const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
      const signature = String(body.razorpay_signature || "").trim();
      let verifiedBy = "signature";
      if (!signature || !timingSafeEqual(expected, signature)) {
        verifiedBy = "razorpay_api";
      }

      const { ok, json: payment } = await rzpGet(`/payments/${paymentId}`);
      if (!ok) {
        throw Object.assign(new Error(payment?.error?.description || "Payment could not be confirmed"), {
          status: 400,
        });
      }
      if (!isSettled(payment?.status)) {
        throw Object.assign(new Error("Payment is not captured"), { status: 400 });
      }
      if (String(payment?.order_id || "") !== orderId) {
        throw Object.assign(new Error("Payment does not belong to this order"), { status: 400 });
      }
      const capturedPaise = Number(payment?.amount);
      if (!Number.isFinite(capturedPaise) || capturedPaise !== expectedPaise) {
        throw Object.assign(new Error("Payment amount does not match this assessment"), { status: 400 });
      }
      const noteUser = String(payment?.notes?.user_id || "").trim();
      if (noteUser === payerId) return { verifiedBy };
      const { ok: orderOk, json: order } = await rzpGet(`/orders/${orderId}`);
      const orderUser = String(order?.notes?.user_id || "").trim();
      if (!orderOk || orderUser !== payerId) {
        throw Object.assign(new Error("Payment does not belong to this worker"), { status: 400 });
      }
      return { verifiedBy };
    }

    if (action === "verify_payment") {
      const paymentId = String(body.razorpay_payment_id || "").trim();
      const orderId = String(body.razorpay_order_id || "").trim();
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
      const boundOrder = String(row.razorpay_order_id || "").trim();
      if (!boundOrder) {
        return json(400, { error: "No Razorpay order bound to this assessment" });
      }
      if (boundOrder !== orderId) {
        return json(400, { error: "Order does not match this assessment" });
      }

      const expectedPaise = resolveFeeInr(row.payment_amount ?? assessmentFee) * 100;
      try {
        const { verifiedBy } = await assertPaymentOwned(paymentId, orderId, expectedPaise);
        const completed = await completePayment(
          paymentId,
          orderId,
          payerId,
          resolveFeeInr(row.payment_amount ?? assessmentFee),
        );
        return json(200, { verification: completed, already_paid: false, verified_by: verifiedBy });
      } catch (err) {
        const status = (err as { status?: number }).status || 400;
        return json(status, { error: err instanceof Error ? err.message : "Payment verification failed" });
      }
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

      const boundOrder = String(row.razorpay_order_id || "").trim();
      if (!boundOrder) {
        return json(400, { error: "No Razorpay order bound to this assessment" });
      }
      if (orderId && orderId !== boundOrder) {
        return json(400, { error: "Order does not match this assessment" });
      }
      const targetOrder = boundOrder;

      if (!paymentId) {
        const { payment, error: findErr } = await findSettledPayment(targetOrder);
        if (!payment) {
          return json(400, {
            error: findErr || "No captured payment found on this order",
          });
        }
        paymentId = payment.id;
      }

      const expectedPaise = resolveFeeInr(row.payment_amount ?? assessmentFee) * 100;
      try {
        await assertPaymentOwned(paymentId, targetOrder, expectedPaise);
      } catch (err) {
        const status = (err as { status?: number }).status || 400;
        return json(status, { error: err instanceof Error ? err.message : "Payment recovery failed" });
      }

      const verification = await completePayment(
        paymentId,
        targetOrder,
        payerId,
        resolveFeeInr(row.payment_amount ?? assessmentFee),
      );
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
