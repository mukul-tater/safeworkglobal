import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-purge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = (Deno.env.get("PURGE_SECRET") || "").trim();
  const incoming = (req.headers.get("x-purge-secret") || "").trim();
  if (!expected || incoming !== expected) {
    return json(401, { error: "Unauthorized" });
  }

  return json(403, {
    error: "Storage purge is disabled. KYC and media cannot be bulk-deleted from this endpoint.",
  });
});
