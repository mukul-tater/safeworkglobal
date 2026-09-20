import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const MUKUL_EMAIL = 'mukultater@safeworkglobal.com'
const MUKUL_FROM = `SafeWork Global <${MUKUL_EMAIL}>`
const JOURNEY_URL = 'https://safeworkglobal.com/worker/journey'
const WORKER_MOBILE_DOMAIN = 'workers.safeworkglobal.app'
const PARTNER_MOBILE_DOMAIN = 'partners.safeworkglobal.app'

function displayableEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim() ?? ''
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower.endsWith(`@${WORKER_MOBILE_DOMAIN}`) || lower.endsWith(`@${PARTNER_MOBILE_DOMAIN}`)) {
    return null
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return null
  return lower
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]) return match[1].trim()
  const webhook = req.headers.get('x-webhook-secret')?.trim()
  return webhook || null
}

function authorized(req: Request): boolean {
  const expected = Deno.env.get('JOURNEY_EMAIL_WEBHOOK_SECRET')
  const token = bearerToken(req)
  if (!expected || !token) return false
  return token === expected
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const notificationId =
      payload?.notification_id ||
      payload?.record?.id ||
      payload?.new?.id

    if (!notificationId || typeof notificationId !== 'string') {
      return new Response(JSON.stringify({ error: 'notification_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service credentials are not configured')
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: notification, error: nErr } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, data')
      .eq('id', notificationId)
      .maybeSingle()

    if (nErr) throw nErr
    if (!notification || notification.type !== 'journey_step_cleared') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not_journey_notification' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [{ data: verification }, { data: profile }] = await Promise.all([
      supabase
        .from('worker_verification')
        .select('email')
        .eq('user_id', notification.user_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', notification.user_id)
        .maybeSingle(),
    ])

    const to = displayableEmail(verification?.email) || displayableEmail(profile?.email)
    if (!to) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no_contact_email' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = (notification.data || {}) as Record<string, unknown>
    const nextStage = typeof data.next_stage === 'string' ? data.next_stage : ''
    const isTerminal = nextStage === 'gcc_ready' || nextStage === 'deployment'
    const workerName = (profile?.full_name || '').trim() || 'there'
    const templateData = {
      workerName,
      title: notification.title,
      message: notification.message,
      journeyUrl: JOURNEY_URL,
      isTerminal,
    }
    const idempotencyKey = `journey-step-${notification.id}`

    try {
      const result = await sendTemplateEmail('journey-step-cleared', to, {
        templateData,
        idempotencyKey,
        replyTo: MUKUL_EMAIL,
        from: MUKUL_FROM,
      })
      return new Response(JSON.stringify({ success: true, emailed: result.sent, to }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (firstErr) {
      console.warn('journey email from Mukul failed, retrying noreply + reply-to', firstErr)
      const result = await sendTemplateEmail('journey-step-cleared', to, {
        templateData,
        idempotencyKey: `${idempotencyKey}-noreply`,
        replyTo: MUKUL_EMAIL,
      })
      return new Response(JSON.stringify({ success: true, emailed: result.sent, to, fromFallback: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send journey email'
    console.error('email-journey-step-cleared error:', error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
