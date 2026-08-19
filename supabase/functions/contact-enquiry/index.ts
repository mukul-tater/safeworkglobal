import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ENQUIRY_TO = "mukultater@safeworkglobal.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const mobile = String(payload.mobile || "").trim();
    const role = String(payload.role || "").trim();
    const subject = String(payload.subject || "").trim();
    const message = String(payload.message || "").trim();

    if (!name || !email || !mobile || !role || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e2a4a; font-size: 20px;">New Contact Us enquiry</h1>
        <p style="color: #4b5563;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="color: #4b5563;"><strong>I am:</strong> ${escapeHtml(role)}</p>
        <p style="color: #4b5563;"><strong>Mobile:</strong> ${escapeHtml(mobile)}</p>
        <p style="color: #4b5563;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="color: #4b5563;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px; white-space: pre-wrap; color: #1f2937;">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Enquiry email not sent.", {
        name,
        email,
        subject,
      });
      return new Response(
        JSON.stringify({ success: true, emailed: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: "SafeWork Global <notifications@safeworkglobal.com>",
      to: [ENQUIRY_TO],
      reply_to: email,
      subject: `Contact enquiry: ${subject}`,
      html,
    });

    console.log("Contact enquiry emailed:", emailResponse);
    return new Response(
      JSON.stringify({ success: true, emailed: true, emailId: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send enquiry email";
    console.error("contact-enquiry error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
