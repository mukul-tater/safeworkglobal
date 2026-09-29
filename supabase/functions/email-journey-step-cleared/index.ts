import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const MUKUL_EMAIL = 'mukultater@safeworkglobal.com'
const MUKUL_FROM = `SafeWork Global <${MUKUL_EMAIL}>`
const JOURNEY_URL = 'https://safeworkglobal.com/worker/journey'
const ADMIN_URL = 'https://safeworkglobal.com/admin/journey-ops'
const WORKER_MOBILE_DOMAIN = 'workers.safeworkglobal.app'
const PARTNER_MOBILE_DOMAIN = 'partners.safeworkglobal.app'

const STAGE_LABELS: Record<string, string> = {
  pre_declaration: 'Pre-declaration',
  essentials: 'Essentials',
  find_jobs: 'Find jobs',
  apply_job: 'Find jobs',
  quiz: 'Test 1 — Basic trade knowledge',
  media: 'Skill proof upload',
  identity: 'Identity (KYC)',
  awaiting_interview: 'Test 2 — Video interview',
  awaiting_payment: 'Payment',
  trade_test: 'Test 3 — Physical trade test',
  tests: 'Test 3 — Physical trade test',
  medical: 'Medical test',
  bond: 'Bond & Security',
  pdot: 'PDOT training',
  deployment: 'Deployment',
  gcc_ready: 'GCC ready',
}

function stageLabel(stage: string | null | undefined): string {
  if (!stage) return 'a journey step'
  return STAGE_LABELS[stage] || stage
}

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

function displayText(value: string | null | undefined, fallback = 'not provided'): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || fallback
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
    const isReupload = notification?.type === 'kyc_reupload_required'
    const isSlip = notification?.type === 'trade_test_slip' || notification?.type === 'trade_test_slip_cancelled'
    if (!notification || (notification.type !== 'journey_step_cleared' && !isReupload && !isSlip)) {
      return new Response(JSON.stringify({ skipped: true, reason: 'not_journey_notification' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [{ data: verification }, { data: profile }] = await Promise.all([
      supabase
        .from('worker_verification')
        .select('email, primary_skill, city, state, journey_job_id')
        .eq('user_id', notification.user_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', notification.user_id)
        .maybeSingle(),
    ])

    let jobTitle: string | null = null
    if (verification?.journey_job_id) {
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', verification.journey_job_id)
        .maybeSingle()
      jobTitle = job?.title ?? null
    }

    const data = (notification.data || {}) as Record<string, unknown>

    if (isSlip) {
      const assessmentId = typeof data.assessment_id === 'string' ? data.assessment_id : ''
      const cancelled = notification.type === 'trade_test_slip_cancelled' || data.cancelled === true
      let slipData: Record<string, string | boolean> = {
        workerName: displayText(profile?.full_name, 'there'),
        cancelled,
        cancelReason: typeof data.reject_reason === 'string' ? data.reject_reason : '',
        reference: typeof data.booking_reference === 'string' ? data.booking_reference : '',
        journeyUrl: JOURNEY_URL,
        testName: 'Test 3 — Physical trade test',
      }
      if (assessmentId) {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('booking_reference, appointment_date, reporting_window, status, job_id, trade_test_center_id, worker_verification_id')
          .eq('id', assessmentId)
          .maybeSingle()
        let skill = verification?.primary_skill || ''
        let jobTitle = ''
        let jobCountry = ''
        let jobLocation = ''
        let experience = ''
        const jobId = assessment?.job_id || verification?.journey_job_id
        if (jobId) {
          const { data: job } = await supabase
            .from('jobs')
            .select('title, country, location, experience_level')
            .eq('id', jobId)
            .maybeSingle()
          jobTitle = job?.title || ''
          jobCountry = job?.country || ''
          jobLocation = job?.location || ''
          experience = job?.experience_level || ''
        }
        const trade = (skill || jobTitle || 'your trade').trim()
        let centreName = ''
        let address = ''
        let contact = ''
        let mapsUrl = ''
        let instructions = ''
        if (assessment?.trade_test_center_id) {
          const { data: center } = await supabase
            .from('trade_test_centers')
            .select('name, address, city, state, pincode, contact_name, contact_phone, maps_url, instructions')
            .eq('id', assessment.trade_test_center_id)
            .maybeSingle()
          centreName = center?.name || ''
          address = [center?.address, center?.city, center?.state, center?.pincode].filter(Boolean).join(', ')
          contact = [center?.contact_name, center?.contact_phone].filter(Boolean).join(' · ')
          mapsUrl = center?.maps_url || ''
          instructions = center?.instructions || ''
        }
        const status = assessment?.status === 'accepted' || assessment?.status === 'scheduled'
          ? 'Accepted by centre'
          : assessment?.status === 'checked_in'
            ? 'Checked in'
            : cancelled
              ? 'Cancelled'
              : 'Booked'
        slipData = {
          ...slipData,
          reference: assessment?.booking_reference || slipData.reference,
          appliedFor: `Applied for: ${trade}`,
          testToday: `Test today: ${trade} physical trade test`,
          intro: `This person applied for a ${trade} job and is here to give the ${trade} physical trade test.`,
          jobPlace: [jobLocation, jobCountry].filter(Boolean).join(', '),
          experience,
          appointmentDate: assessment?.appointment_date || '',
          reportingWindow: assessment?.reporting_window || '',
          centreName,
          address,
          contact,
          mapsUrl,
          instructions,
          status,
        }
      }

      const workerEmail = displayableEmail(verification?.email) || displayableEmail(profile?.email)
      if (!workerEmail) {
        return new Response(JSON.stringify({ success: true, skipped: 'no_contact_email' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      try {
        const result = await sendTemplateEmail('trade-test-slip', workerEmail, {
          templateData: slipData,
          idempotencyKey: `trade-test-slip-${notification.id}`,
          replyTo: MUKUL_EMAIL,
          from: MUKUL_FROM,
        })
        return new Response(JSON.stringify({ success: true, emailed: result.sent, to: workerEmail }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (firstErr) {
        console.warn('trade test slip email from Mukul failed, retrying noreply', firstErr)
        try {
          const result = await sendTemplateEmail('trade-test-slip', workerEmail, {
            templateData: slipData,
            idempotencyKey: `trade-test-slip-${notification.id}-noreply`,
            replyTo: MUKUL_EMAIL,
          })
          return new Response(JSON.stringify({ success: true, emailed: result.sent, to: workerEmail, fromFallback: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (slipErr) {
          console.error('trade test slip email failed', slipErr)
          return new Response(JSON.stringify({ success: false, emailed: false }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    const nextStage = typeof data.next_stage === 'string' ? data.next_stage : ''
    const clearedStage = typeof data.cleared_stage === 'string' ? data.cleared_stage : ''
    const isTerminal = nextStage === 'gcc_ready' || nextStage === 'deployment'
    const workerName = displayText(profile?.full_name, 'Unknown worker')
    const workerEmail = displayableEmail(verification?.email) || displayableEmail(profile?.email)
    const location = [verification?.city, verification?.state].filter(Boolean).join(', ')

    const workerTemplateData = {
      workerName: displayText(profile?.full_name, 'there'),
      title: notification.title,
      message: notification.message,
      journeyUrl: JOURNEY_URL,
      isTerminal: isReupload ? false : isTerminal,
      isReupload,
    }
    const opsTemplateData = {
      workerName,
      workerEmail: workerEmail || 'not provided',
      workerPhone: displayText(profile?.phone),
      trade: displayText(verification?.primary_skill, 'not specified'),
      location: displayText(location, 'not specified'),
      jobTitle: displayText(jobTitle, 'not specified'),
      clearedStep: stageLabel(clearedStage),
      nextStep: stageLabel(nextStage || (isTerminal ? 'gcc_ready' : null)),
      isTerminal,
      adminUrl: ADMIN_URL,
    }

    let workerEmailed = false
    let workerSkipped: string | undefined
    let workerFromFallback = false

    if (!workerEmail) {
      workerSkipped = 'no_contact_email'
    } else {
      const idempotencyKey = `journey-step-${notification.id}`
      try {
        const result = await sendTemplateEmail('journey-step-cleared', workerEmail, {
          templateData: workerTemplateData,
          idempotencyKey,
          replyTo: MUKUL_EMAIL,
          from: MUKUL_FROM,
        })
        workerEmailed = result.sent
      } catch (firstErr) {
        console.warn('journey email from Mukul failed, retrying noreply + reply-to', firstErr)
        try {
          const result = await sendTemplateEmail('journey-step-cleared', workerEmail, {
            templateData: workerTemplateData,
            idempotencyKey: `${idempotencyKey}-noreply`,
            replyTo: MUKUL_EMAIL,
          })
          workerEmailed = result.sent
          workerFromFallback = true
        } catch (workerErr) {
          console.error('journey email to worker failed', workerErr)
        }
      }
    }

    let opsEmailed = false
    if (!isReupload) {
      try {
        const opsResult = await sendTemplateEmail('journey-step-cleared-ops', MUKUL_EMAIL, {
          templateData: opsTemplateData,
          idempotencyKey: `journey-step-ops-${notification.id}`,
        })
        opsEmailed = opsResult.sent
      } catch (opsErr) {
        console.error('journey ops email to Mukul failed', opsErr)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      emailed: workerEmailed,
      to: workerEmail,
      skipped: workerSkipped,
      fromFallback: workerFromFallback || undefined,
      opsEmailed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send journey email'
    console.error('email-journey-step-cleared error:', error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
