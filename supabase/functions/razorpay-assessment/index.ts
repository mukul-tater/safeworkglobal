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

  let body: {
    action?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const action = body.action || "create_order";

  try {
    if (action === "create_order") {
      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("id, stage, payment_status, user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (rowErr) throw new Error(rowErr.message);
      if (!row) return json(404, { error: "Verification row not found" });
      if (row.stage !== "awaiting_payment") {
        return json(400, { error: "Payment stage is not active" });
      }
      if (row.payment_status === "paid") {
        return json(400, { error: "Assessment already paid" });
      }

      const amountPaise = ASSESSMENT_FEE_INR * 100;
      const receipt = `assess_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`
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
            user_id: user.id,
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
      if (!paymentId || !orderId || !signature) {
        return json(400, { error: "Missing payment verification fields" });
      }

      const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
      if (expected !== signature) {
        return json(400, { error: "Invalid payment signature" });
      }

      const { data: row, error: rowErr } = await admin
        .from("worker_verification")
        .select("*")
        .eq("user_id", user.id)
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

      const { data: completed, error: rpcErr } = await admin.rpc(
        "complete_assessment_payment_razorpay",
        {
          p_user_id: user.id,
          p_payment_id: paymentId,
          p_order_id: orderId,
          p_amount: ASSESSMENT_FEE_INR,
        },
      );
      if (rpcErr) throw new Error(rpcErr.message);

      return json(200, { verification: completed, already_paid: false });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("razorpay-assessment", e);
    return json(500, {
      error: e instanceof Error ? e.message : "Payment processing failed",
    });
  }
});
