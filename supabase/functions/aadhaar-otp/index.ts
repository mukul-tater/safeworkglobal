import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Aadhaar OTP for independent workers.
 * Full 12-digit number is sent only to a licensed vendor (Surepass) and is never written to our DB.
 *
 * Secrets (edge function only — not VITE_):
 *   SUREPASS_BEARER_TOKEN
 *   SUREPASS_BASE_URL (optional, default https://kyc-api.surepass.io)
 *   AADHAAR_OTP_MOCK=true  — local/QA only; OTP is 123456
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function last4FromAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4);
}

function isMock(): boolean {
  return (Deno.env.get("AADHAAR_OTP_MOCK") || "").toLowerCase() === "true";
}

async function surepass(path: string, body: Record<string, unknown>) {
  const token = (Deno.env.get("SUREPASS_BEARER_TOKEN") || "").trim();
  const base = (Deno.env.get("SUREPASS_BASE_URL") || "https://kyc-api.surepass.io").replace(/\/$/, "");
  if (!token) {
    throw new Error("Aadhaar OTP is not configured. Set SUREPASS_BEARER_TOKEN on the aadhaar-otp function.");
  }
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.success === false) {
    const message =
      payload?.message ||
      payload?.error ||
      payload?.data?.message ||
      `Aadhaar OTP vendor error (${res.status})`;
    throw new Error(String(message));
  }
  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

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
  if (userErr || !user) return json(401, { error: "Not signed in" });

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: wp, error: wpErr } = await admin
    .from("worker_profiles")
    .select("user_id, source_type, source_partner_id, aadhaar_verified, aadhaar_otp_ref, aadhaar_last4")
    .eq("user_id", user.id)
    .maybeSingle();
  if (wpErr) return json(500, { error: wpErr.message });

  const partnerSourced = wp?.source_type === "partner" || wp?.source_type === "emitra" || !!wp?.source_partner_id;
  if (partnerSourced) {
    return json(400, {
      error: "Partner-onboarded workers verify Aadhaar in person at the centre. Enter last 4 digits only.",
    });
  }

  let body: { action?: string; aadhaar_number?: string; otp?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const action = String(body.action || "");

  try {
    if (action === "send_otp") {
      const aadhaar = String(body.aadhaar_number || "").replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaar)) {
        return json(400, { error: "Enter a valid 12-digit Aadhaar number" });
      }
      const last4 = aadhaar.slice(-4);
      let ref = `mock-${user.id.slice(0, 8)}`;
      if (!isMock()) {
        const payload = await surepass("/api/v1/aadhaar-v2/generate-otp", { id_number: aadhaar });
        ref = String(payload?.data?.client_id || payload?.client_id || "");
        if (!ref) throw new Error("Vendor did not return a verification reference");
      }
      const { error: upErr } = await admin.from("worker_profiles").upsert(
        {
          user_id: user.id,
          aadhaar_last4: last4,
          aadhaar_otp_ref: ref,
          aadhaar_verified: false,
          aadhaar_verify_method: null,
          aadhaar_verified_at: null,
          aadhaar_verified_name: null,
        },
        { onConflict: "user_id" },
      );
      if (upErr) throw new Error(upErr.message);
      return json(200, { ok: true, last4, mock: isMock() });
    }

    if (action === "verify_otp") {
      const otp = String(body.otp || "").replace(/\D/g, "");
      if (!/^\d{6}$/.test(otp)) return json(400, { error: "Enter the 6-digit OTP" });
      const ref = String(wp?.aadhaar_otp_ref || "");
      if (!ref) return json(400, { error: "Request OTP first" });

      let verifiedName: string | null = null;
      let last4 = String(wp?.aadhaar_last4 || "");
      if (isMock()) {
        if (otp !== "123456") return json(400, { error: "Invalid OTP. Use 123456 in mock mode." });
        verifiedName = "Mock verified";
      } else {
        const payload = await surepass("/api/v1/aadhaar-v2/submit-otp", { client_id: ref, otp });
        const data = payload?.data || {};
        verifiedName = data.full_name || data.name || null;
        const fromVendor = last4FromAadhaar(String(data.aadhaar_number || data.masked_aadhaar || ""));
        if (fromVendor.length === 4) last4 = fromVendor;
      }
      if (!/^\d{4}$/.test(last4)) {
        return json(500, { error: "Could not record Aadhaar last 4 after OTP" });
      }

      const now = new Date().toISOString();
      const { error: upErr } = await admin
        .from("worker_profiles")
        .update({
          aadhaar_last4: last4,
          aadhaar_verified: true,
          aadhaar_verify_method: "otp",
          aadhaar_verified_at: now,
          aadhaar_verified_name: verifiedName,
          aadhaar_otp_ref: null,
        })
        .eq("user_id", user.id);
      if (upErr) throw new Error(upErr.message);
      return json(200, { ok: true, last4, verified: true, name: verifiedName, mock: isMock() });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Aadhaar OTP failed" });
  }
});
