import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const MAX_LEN = 4000

function clean(value: unknown, max = 300): string {
  return String(value ?? '').trim().slice(0, max)
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const name = clean(payload.name, 120)
    const email = clean(payload.email, 200)
    const mobile = clean(payload.mobile, 30)
    const role = clean(payload.role, 60)
    const subject = clean(payload.subject, 200)
    const message = clean(payload.message, MAX_LEN)
    const submissionId = clean(payload.submissionId, 100)

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!name || !emailOk || !mobile || !role || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await sendTemplateEmail('contact-enquiry', '', {
      templateData: { name, email, mobile, role, subject, message },
      idempotencyKey: `contact-enquiry-${submissionId || crypto.randomUUID()}`,
      replyTo: email,
    })

    return new Response(JSON.stringify({ success: true, emailed: result.sent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send enquiry email'
    console.error('contact-enquiry error:', error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
