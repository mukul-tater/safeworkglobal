import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  const webhookSecret = (Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "").trim();
  const keyId = (Deno.env.get("RAZORPAY_KEY_ID") || "").trim();
  const keySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") || "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!webhookSecret || !keyId || !keySecret || !supabaseUrl || !serviceKey) {
    console.error("razorpay-webhook missing secrets");
    return json(500, { error: "Webhook is not configured" });
  }

  const raw = await req.text();
  const signature = (req.headers.get("x-razorpay-signature") || "").trim();
  const expected = await hmacSha256Hex(webhookSecret, raw);
  if (!signature || !timingSafeEqual(expected, signature)) {
    return json(400, { error: "Invalid webhook signature" });
  }

  let event: {
    event?: string;
    id?: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const eventType = String(event.event || "");
  if (eventType !== "payment.captured") {
    return json(200, { ignored: true, event: eventType });
  }

  const entity = event.payload?.payment?.entity || {};
  const paymentId = String(entity.id || "").trim();
  const orderId = String(entity.order_id || "").trim();
  const eventId = String(event.id || `pay_${paymentId}`).trim();
  if (!paymentId || !orderId || !eventId) {
    return json(400, { error: "Missing payment fields" });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: inserted, error: insertErr } = await admin
    .from("razorpay_webhook_events")
    .insert({
      event_id: eventId,
      event_type: eventType,
      payment_id: paymentId,
      order_id: orderId,
    })
    .select("event_id")
    .maybeSingle();
  if (insertErr && insertErr.code === "23505") {
    return json(200, { already_processed: true });
  }
  if (insertErr || !inserted) {
    console.error("razorpay-webhook insert", insertErr);
    return json(500, { error: "Could not record webhook event" });
  }

  try {
    const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: auth },
    });
    const payment = await payRes.json();
    if (!payRes.ok || payment?.status !== "captured") {
      throw new Error(payment?.error?.description || "Payment is not captured");
    }
    if (String(payment.order_id || "") !== orderId) {
      throw new Error("Payment order mismatch");
    }

    const { data: row, error: rowErr } = await admin
      .from("worker_verification")
      .select("user_id, payment_status, payment_amount, razorpay_order_id, stage")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (rowErr) throw new Error(rowErr.message);
    if (!row?.user_id) {
      throw new Error("No assessment bound to this order");
    }
    if (row.payment_status === "paid") {
      return json(200, { already_paid: true, user_id: row.user_id });
    }

    const expectedPaise = Math.round(Number(row.payment_amount || 0) * 100);
    const capturedPaise = Number(payment.amount);
    if (!expectedPaise || capturedPaise !== expectedPaise) {
      throw new Error("Payment amount does not match this assessment");
    }

    const noteUser = String(payment?.notes?.user_id || "").trim();
    if (noteUser && noteUser !== row.user_id) {
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: { Authorization: auth },
      });
      const order = await orderRes.json();
      const orderUser = String(order?.notes?.user_id || "").trim();
      if (orderUser !== row.user_id) {
        throw new Error("Payment does not belong to this worker");
      }
    }

    const { error: completeErr } = await admin.rpc("complete_assessment_payment_razorpay", {
      p_user_id: row.user_id,
      p_payment_id: paymentId,
      p_order_id: orderId,
      p_amount: Number(row.payment_amount),
    });
    if (completeErr) throw new Error(completeErr.message);

    return json(200, { ok: true, user_id: row.user_id, payment_id: paymentId });
  } catch (err) {
    await admin.from("razorpay_webhook_events").delete().eq("event_id", eventId);
    console.error("razorpay-webhook", err);
    return json(400, {
      error: err instanceof Error ? err.message : "Webhook processing failed",
    });
  }
});
