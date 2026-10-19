import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Used only when platform_payment_settings cannot be read. Not a service charge. */
const GATEWAY_FEE_FALLBACK_PCT = 2.5;

function roundInr(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.round(n);
}

async function loadGatewayFeePct(admin: ReturnType<typeof createClient>): Promise<number> {
  try {
    const { data, error } = await admin
      .from("platform_payment_settings")
      .select("razorpay_gateway_fee_pct")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return GATEWAY_FEE_FALLBACK_PCT;
    const gateway = Number(data.razorpay_gateway_fee_pct);
    if (!Number.isFinite(gateway) || gateway < 0 || gateway > 15) {
      throw new Error("Razorpay extra percentage is invalid");
    }
    return gateway;
  } catch (error) {
    if (error instanceof Error && error.message === "Razorpay extra percentage is invalid") throw error;
    return GATEWAY_FEE_FALLBACK_PCT;
  }
}

/** Service charge is the amount saved on the job. Gateway % is added on top. */
function withGatewayFee(
  baseFee: number,
  gatewayPct: number,
): { base: number; fee: number; charged: number } {
  const base = Number(baseFee);
  if (!Number.isFinite(base) || base < 1) return { base: 0, fee: 0, charged: 0 };
  const charged = Math.round(base * (1 + gatewayPct / 100));
  return { base, fee: charged - base, charged };
}

function callbackOrigin(req: Request): string {
  const origin = (req.headers.get("origin") || "").replace(/\/$/, "");
  if (/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) return origin;
  return "";
}

function wholeRupees(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 500000) return null;
  return n;
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
    razorpay_payment_link_id?: string;
    worker_user_id?: string;
    amount_inr?: number;
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
    if (!row?.journey_job_id) return 0;
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("service_charge")
      .eq("id", row.journey_job_id)
      .maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    const n = Number(job?.service_charge);
    if (!Number.isFinite(n) || n < 1) return 0;
    return n;
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
      const gatewayPct = await loadGatewayFeePct(admin);
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
        const { base, fee, charged } = withGatewayFee(due, gatewayPct);
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

    if (action === "create_payment_link" || action === "confirm_payment_link") {
      const payerId = await resolvePayerUserId(body.worker_user_id);

      if (action === "create_payment_link") {
        const amountInr = wholeRupees(body.amount_inr);
        if (!amountInr) {
          return json(400, { error: "Enter a whole rupee amount from 1 to 5,00,000" });
        }
        const origin = callbackOrigin(req);
        if (!origin) return json(400, { error: "Open Payments in the browser to pay" });

        const { data: inserted, error: insErr } = await admin
          .from("custom_amount_payments")
          .insert({
            user_id: payerId,
            amount: amountInr,
            status: "pending",
            provider: "razorpay",
          })
          .select("id")
          .single();
        if (insErr || !inserted?.id) throw new Error(insErr?.message || "Could not save the payment");

        const referenceId = String(inserted.id).replace(/-/g, "");
        const payload: Record<string, unknown> = {
          amount: amountInr * 100,
          currency: "INR",
          accept_partial: false,
          description: "SafeWork Global payment",
          reference_id: referenceId,
          callback_url: `${origin}/payments/complete`,
          callback_method: "get",
          notes: {
            user_id: payerId,
            purpose: "custom_amount",
            amount_inr: String(amountInr),
            payment_row_id: inserted.id,
          },
        };
        const linkRes = await fetch("https://api.razorpay.com/v1/payment_links", {
          method: "POST",
          headers: {
            Authorization: razorpayAuthHeader(keyId, keySecret),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const linkJson = await linkRes.json().catch(() => ({}));
        if (!linkRes.ok || !linkJson?.id || !linkJson?.short_url) {
          await admin.from("custom_amount_payments").update({ status: "failed" }).eq("id", inserted.id);
          return json(502, {
            error: linkJson?.error?.description || "Could not create the Razorpay payment link",
          });
        }
        const { error: updErr } = await admin
          .from("custom_amount_payments")
          .update({
            razorpay_payment_link_id: linkJson.id,
            short_url: linkJson.short_url,
          })
          .eq("id", inserted.id);
        if (updErr) throw new Error(updErr.message);
        return json(200, {
          payment_link_id: linkJson.id,
          short_url: linkJson.short_url,
          amount_inr: amountInr,
        });
      }

      const linkId = String(body.razorpay_payment_link_id || "").trim();
      if (!linkId) return json(400, { error: "Missing payment link" });
      const { data: row, error: rowErr } = await admin
        .from("custom_amount_payments")
        .select("id, amount, status, razorpay_payment_link_id")
        .eq("user_id", payerId)
        .eq("razorpay_payment_link_id", linkId)
        .maybeSingle();
      if (rowErr) throw new Error(rowErr.message);
      if (!row) return json(400, { error: "No payment link matches this account" });
      const expectedInr = wholeRupees(row.amount);
      if (!expectedInr) return json(400, { error: "Saved payment amount is invalid" });
      if (row.status === "paid") {
        return json(200, { paid: true, amount_inr: expectedInr, status: "paid" });
      }

      const { ok, json: link } = await rzpGet(`/payment_links/${linkId}`);
      if (!ok) {
        return json(502, { error: link?.error?.description || "Could not read the Razorpay payment link" });
      }
      const noteUser = String(link?.notes?.user_id || "").trim();
      const paidPaise = Number(link?.amount_paid);
      const linkPaise = Number(link?.amount);
      const expectedPaise = expectedInr * 100;
      const settled = link?.status === "paid" && paidPaise === expectedPaise && linkPaise === expectedPaise;
      if (noteUser && noteUser !== payerId) {
        return json(400, { error: "Payment link does not belong to this account" });
      }
      if (!settled) {
        return json(200, { paid: false, amount_inr: expectedInr, status: String(link?.status || "pending") });
      }
      const paymentId = Array.isArray(link?.payments)
        ? String(link.payments.find((item: { status?: string }) => item?.status === "captured")?.payment_id || link.payments[0]?.payment_id || "")
        : "";
      const { error: doneErr } = await admin
        .from("custom_amount_payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          razorpay_payment_id: paymentId || null,
        })
        .eq("id", row.id)
        .eq("status", "pending");
      if (doneErr) throw new Error(doneErr.message);
      return json(200, { paid: true, amount_inr: expectedInr, status: "paid" });
    }

    const payerId = await resolvePayerUserId(body.worker_user_id);

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
          const expectedInr = roundInr(row.payment_amount);
          if (!expectedInr) {
            return json(400, { error: "Payment amount is missing" });
          }
          const expectedPaise = expectedInr * 100;
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
              expectedInr,
            );
            return json(200, { recovered: true, verification, already_paid: true });
          }
        }
      }

      const assessmentFee = await resolveAssessmentFee(payerId);
      if (assessmentFee < 1) {
        return json(400, { error: "This job has no service charge" });
      }
      const gatewayPct = await loadGatewayFeePct(admin);
      const { base, fee, charged } = withGatewayFee(assessmentFee, gatewayPct);
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
            gateway_fee_pct: String(gatewayPct),
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
        gateway_fee_pct: gatewayPct,
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

      const expectedInr = roundInr(row.payment_amount);
      if (!expectedInr) return json(400, { error: "Payment amount is missing" });
      const expectedPaise = expectedInr * 100;
      try {
        const { verifiedBy } = await assertPaymentOwned(paymentId, orderId, expectedPaise);
        const completed = await completePayment(
          paymentId,
          orderId,
          payerId,
          expectedInr,
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

      const expectedInr = roundInr(row.payment_amount);
      if (!expectedInr) return json(400, { error: "Payment amount is missing" });

      if (!paymentId) {
        const { payment, error: findErr } = await findSettledPayment(targetOrder);
        if (!payment) {
          return json(400, {
            error: findErr || "No captured payment found on this order",
          });
        }
        paymentId = payment.id;
      }

      const expectedPaise = expectedInr * 100;
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
        expectedInr,
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
