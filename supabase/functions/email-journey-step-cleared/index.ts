import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const MUKUL_EMAIL = 'mukultater@safeworkglobal.com'
const MUKUL_FROM = `SafeWork Global <${MUKUL_EMAIL}>`
const OPS_EMAILS = [
  'mukultater@safeworkglobal.com',
  'admin@safeworkglobal.com',
  'ops@safeworkglobal.com',
]
const JOURNEY_URL = 'https://safeworkglobal.com/worker/journey'
const ADMIN_URL = 'https://safeworkglobal.com/admin/journey-ops'
const CENTRE_INBOX_URL = 'https://safeworkglobal.com/partner/ssvn/inbox'
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
  awaiting_offer: 'Offer letter',
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

function displayPhone(phone: string | null | undefined): string {
  const digits = (phone || '').replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return displayText(phone, '')
  return `+91 ${digits}`
}

function yearsLabel(years: number | null | undefined): string {
  if (years == null || Number.isNaN(Number(years))) return ''
  const n = Number(years)
  if (n <= 0) return ''
  return n === 1 ? '1 year' : `${n} years`
}

type ServiceClient = ReturnType<typeof createClient>

async function centreContactEmail(supabase: ServiceClient, partnerId: string): Promise<string | null> {
  const [{ data: ext }, { data: org }] = await Promise.all([
    supabase.from('partner_profiles_ext').select('email').eq('partner_id', partnerId).maybeSingle(),
    supabase.from('partners').select('user_id').eq('id', partnerId).maybeSingle(),
  ])
  const registered = displayableEmail((ext as { email?: string | null } | null)?.email)
  if (registered) return registered
  const userId = (org as { user_id?: string | null } | null)?.user_id
  if (!userId) return null
  const { data: partnerProfile } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle()
  return displayableEmail((partnerProfile as { email?: string | null } | null)?.email)
}

async function emailTradeTestCentre(
  supabase: ServiceClient,
  input: {
    notificationId: string
    assessmentId: string
    partnerId: string
    cancelled: boolean
    cancelReason: string
    templateData: Record<string, string | boolean>
  },
): Promise<{ emailed: boolean; to: string | null; skipped?: string }> {
  let to: string | null = null
  try {
    to = await centreContactEmail(supabase, input.partnerId)
  } catch (err) {
    console.error('trade test centre email lookup failed', err)
    return { emailed: false, to: null, skipped: 'lookup_failed' }
  }
  if (!to) return { emailed: false, to: null, skipped: 'no_centre_email' }

  const idempotencyKey = `trade-test-centre-${input.notificationId}`
  try {
    const result = await sendTemplateEmail('trade-test-centre-brief', to, {
      templateData: input.templateData,
      idempotencyKey,
      replyTo: MUKUL_EMAIL,
      from: MUKUL_FROM,
    })
    return { emailed: result.sent, to }
  } catch (firstErr) {
    console.warn('trade test centre email from Mukul failed, retrying noreply', firstErr)
    try {
      const result = await sendTemplateEmail('trade-test-centre-brief', to, {
        templateData: input.templateData,
        idempotencyKey: `${idempotencyKey}-noreply`,
        replyTo: MUKUL_EMAIL,
      })
      return { emailed: result.sent, to }
    } catch (err) {
      console.error('trade test centre email failed', err)
      return { emailed: false, to, skipped: 'send_failed' }
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]) return match[1].trim()
  const webhook = req.headers.get('x-webhook-secret')?.trim()
  return webhook || null
}

function minuteKey(value: unknown): string {
  const date = new Date(String(value || ''))
  if (Number.isNaN(date.getTime())) return 'unscheduled'
  return date.toISOString().slice(0, 16)
}

async function deliverJourneyMail(input: {
  workerEmail: string | null
  idempotencyKey: string
  workerTemplateData: Record<string, unknown>
  opsTemplateData: Record<string, unknown>
  preferNoreply?: boolean
  skipOps?: boolean
}): Promise<{ emailed: boolean; opsEmailed: boolean; skipped?: string; to: string | null }> {
  let emailed = false
  let skipped: string | undefined
  if (!input.workerEmail) {
    skipped = 'no_contact_email'
  } else if (input.preferNoreply) {
    try {
      const result = await sendTemplateEmail('journey-step-cleared', input.workerEmail, {
        templateData: input.workerTemplateData,
        idempotencyKey: input.idempotencyKey,
        replyTo: MUKUL_EMAIL,
      })
      emailed = result.sent
    } catch (workerErr) {
      console.error('journey email to worker failed', workerErr)
    }
  } else {
    try {
      const result = await sendTemplateEmail('journey-step-cleared', input.workerEmail, {
        templateData: input.workerTemplateData,
        idempotencyKey: input.idempotencyKey,
        replyTo: MUKUL_EMAIL,
        from: MUKUL_FROM,
      })
      emailed = result.sent
    } catch (firstErr) {
      console.warn('journey email from Mukul failed, retrying noreply', firstErr)
      try {
        const result = await sendTemplateEmail('journey-step-cleared', input.workerEmail, {
          templateData: input.workerTemplateData,
          idempotencyKey: `${input.idempotencyKey}-noreply`,
          replyTo: MUKUL_EMAIL,
        })
        emailed = result.sent
      } catch (workerErr) {
        console.error('journey email to worker failed', workerErr)
      }
    }
  }

  let opsEmailed = false
  if (!input.skipOps) for (const opsEmail of OPS_EMAILS) {
    try {
      const opsResult = await sendTemplateEmail('journey-step-cleared-ops', opsEmail, {
        templateData: input.opsTemplateData,
        idempotencyKey: `ops-${opsEmail}-${input.idempotencyKey}`,
      })
      opsEmailed = opsEmailed || opsResult.sent
    } catch (opsErr) {
      console.error('journey ops email failed', opsEmail, opsErr)
    }
  }

  return { emailed, opsEmailed, skipped, to: input.workerEmail }
}

function authorized(req: Request): boolean {
  const expected = Deno.env.get('JOURNEY_EMAIL_WEBHOOK_SECRET')
  const token = bearerToken(req)
  if (!expected || !token) return false
  return token === expected
}

async function callerUserId(req: Request): Promise<string | null> {
  const token = bearerToken(req)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!token || !supabaseUrl || !anonKey) return null
  if (token === Deno.env.get('JOURNEY_EMAIL_WEBHOOK_SECRET')) return null
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

async function callerIsAdmin(req: Request): Promise<boolean> {
  const userId = await callerUserId(req)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!userId || !supabaseUrl || !serviceKey) return false
  const service = createClient(supabaseUrl, serviceKey)
  const { data } = await service
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()
  return !!data
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

  const webhookOk = authorized(req)
  const callerId = webhookOk ? null : await callerUserId(req)
  const adminOk = callerId ? await callerIsAdmin(req) : false

  try {
    const payload = await req.json().catch(() => ({}))
    const kind = typeof payload?.kind === 'string' ? payload.kind : ''
    const directUserId = typeof payload?.user_id === 'string' ? payload.user_id : ''
    const directAllowed = (kind === 'interview_scheduled' && adminOk)
      || (kind === 'job_selected' && !!callerId && (adminOk || callerId === directUserId))
    const notificationId =
      payload?.notification_id ||
      payload?.record?.id ||
      payload?.new?.id

    if (!webhookOk && !(directAllowed && directUserId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if ((!notificationId || typeof notificationId !== 'string') && !(directAllowed && directUserId)) {
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

    if (directAllowed && directUserId && (kind === 'interview_scheduled' || kind === 'job_selected')) {
      const [{ data: verification }, { data: profile }] = await Promise.all([
        supabase
          .from('worker_verification')
          .select('email, primary_skill, city, state, journey_job_id, interview_scheduled_at, interview_meeting_url')
          .eq('user_id', directUserId)
          .maybeSingle(),
        supabase.from('profiles').select('email, full_name, phone').eq('id', directUserId).maybeSingle(),
      ])
      let jobTitle: string | null = null
      let jobTitleHi: string | null = null
      if (verification?.journey_job_id) {
        const { data: job } = await supabase
          .from('jobs')
          .select('title, title_hi')
          .eq('id', verification.journey_job_id)
          .maybeSingle()
        jobTitle = job?.title ?? null
        jobTitleHi = job?.title_hi ?? null
      }
      const tradeLine = [jobTitle, jobTitleHi].filter((value) => value && String(value).trim()).join(' / ')
      const when = verification?.interview_scheduled_at
        ? new Date(verification.interview_scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : ''
      const workerEmail = displayableEmail(verification?.email) || displayableEmail(profile?.email)
      const message = kind === 'interview_scheduled'
        ? `Your video interview${tradeLine ? ` for ${tradeLine}` : ''} is on ${when || 'the scheduled time'} IST.${verification?.interview_meeting_url ? ` Join: ${verification.interview_meeting_url}` : ''}`
        : `You selected ${tradeLine || 'a job'}. This trade stays on your journey.`
      const idempotencyKey = kind === 'interview_scheduled'
        ? `interview-${directUserId}-${minuteKey(verification?.interview_scheduled_at)}`
        : `job-selected-${directUserId}-${verification?.journey_job_id || 'none'}`
      const sent = await deliverJourneyMail({
        workerEmail,
        idempotencyKey,
        preferNoreply: true,
        workerTemplateData: {
          workerName: displayText(profile?.full_name, 'there'),
          title: kind === 'interview_scheduled' ? 'Video interview scheduled' : 'Job selected',
          message,
          journeyUrl: JOURNEY_URL,
          isTerminal: false,
          isReupload: false,
        },
        opsTemplateData: {
          workerName: displayText(profile?.full_name, 'Unknown worker'),
          workerEmail: workerEmail || '',
          workerPhone: profile?.phone?.trim() || '',
          trade: tradeLine || verification?.primary_skill || '',
          location: [verification?.city, verification?.state].filter(Boolean).join(', '),
          clearedStep: kind === 'interview_scheduled' ? 'Video interview scheduled' : 'Job selected',
          nextStep: kind === 'interview_scheduled' ? 'Join the video interview' : (tradeLine || 'Test 1'),
          isTerminal: false,
          adminUrl: ADMIN_URL,
        },
      })
      return new Response(JSON.stringify({ success: true, direct: true, ...sent }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: notification, error: nErr } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, data')
      .eq('id', notificationId)
      .maybeSingle()

    if (nErr) throw nErr
    const isReupload = notification?.type === 'kyc_reupload_required'
    const isSlip = notification?.type === 'trade_test_slip' || notification?.type === 'trade_test_slip_cancelled'
    const isJobMail = notification?.type === 'job_selected' || notification?.type === 'interview_scheduled'
    if (!notification || (notification.type !== 'journey_step_cleared' && !isReupload && !isSlip && !isJobMail)) {
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
      let centrePartnerId = ''
      let centreNameForBrief = ''
      if (assessmentId) {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('booking_reference, appointment_date, reporting_window, status, job_id, partner_id, trade_test_center_id, worker_verification_id')
          .eq('id', assessmentId)
          .maybeSingle()
        centrePartnerId = assessment?.partner_id || ''
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
          centreNameForBrief = centreName
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

      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('years_of_experience, current_city, state, aadhaar_last4')
        .eq('user_id', notification.user_id)
        .maybeSingle()
      const workerLocation = [
        workerProfile?.current_city || verification?.city,
        workerProfile?.state || verification?.state,
      ].filter(Boolean).join(', ')
      const aadhaarEnding = (workerProfile?.aadhaar_last4 || '').replace(/\D/g, '').slice(-4)
      const trade = String(slipData.appliedFor || '').replace(/^Applied for:\s*/i, '')
        || verification?.primary_skill
        || 'trade'
      const centreEmail = centrePartnerId
        ? await emailTradeTestCentre(supabase, {
            notificationId: notification.id,
            assessmentId,
            partnerId: centrePartnerId,
            cancelled,
            cancelReason: String(slipData.cancelReason || ''),
            templateData: {
              centreName: centreNameForBrief || 'Trade test centre',
              cancelled,
              cancelReason: String(slipData.cancelReason || ''),
              workerName: displayText(profile?.full_name, 'A worker'),
              workerPhone: displayPhone(profile?.phone),
              workerEmail: displayableEmail(verification?.email) || displayableEmail(profile?.email) || '',
              trade,
              yearsExperience: yearsLabel(
                workerProfile?.years_of_experience == null
                  ? null
                  : Number(workerProfile.years_of_experience),
              ),
              workerLocation,
              aadhaarEnding,
              appliedFor: trade,
              jobPlace: String(slipData.jobPlace || ''),
              experienceAsked: String(slipData.experience || ''),
              reference: String(slipData.reference || ''),
              appointmentDate: String(slipData.appointmentDate || ''),
              reportingWindow: String(slipData.reportingWindow || ''),
              portalUrl: assessmentId
                ? `https://safeworkglobal.com/partner/ssvn/assessment/${assessmentId}`
                : CENTRE_INBOX_URL,
            },
          })
        : { emailed: false, to: null, skipped: 'no_centre' }

      const workerEmail = displayableEmail(verification?.email) || displayableEmail(profile?.email)
      if (!workerEmail) {
        return new Response(JSON.stringify({
          success: true,
          skipped: 'no_contact_email',
          centreEmailed: centreEmail.emailed,
          centreTo: centreEmail.to,
          centreSkipped: centreEmail.skipped,
        }), {
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
        return new Response(JSON.stringify({
          success: true,
          emailed: result.sent,
          to: workerEmail,
          centreEmailed: centreEmail.emailed,
          centreTo: centreEmail.to,
          centreSkipped: centreEmail.skipped,
        }), {
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
          return new Response(JSON.stringify({
            success: true,
            emailed: result.sent,
            to: workerEmail,
            fromFallback: true,
            centreEmailed: centreEmail.emailed,
            centreTo: centreEmail.to,
            centreSkipped: centreEmail.skipped,
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (slipErr) {
          console.error('trade test slip email failed', slipErr)
          return new Response(JSON.stringify({
            success: centreEmail.emailed,
            emailed: false,
            centreEmailed: centreEmail.emailed,
            centreTo: centreEmail.to,
            centreSkipped: centreEmail.skipped,
          }), {
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

    const tradeLine = (jobTitle || '').trim()
    const workerTemplateData = {
      workerName: displayText(profile?.full_name, 'there'),
      title: notification.title,
      message: tradeLine && !String(notification.message || '').includes(tradeLine)
        ? `Trade: ${tradeLine}\n\n${notification.message}`
        : notification.message,
      journeyUrl: JOURNEY_URL,
      isTerminal: isReupload ? false : isTerminal,
      isReupload,
    }
    const trade = [verification?.primary_skill, jobTitle]
      .map((value) => value?.trim() ?? '')
      .find((value) => value.length > 0) || ''
    const opsTemplateData = {
      workerName,
      workerEmail: workerEmail || '',
      workerPhone: profile?.phone?.trim() || '',
      trade,
      location,
      clearedStep: notification.type === 'job_selected'
        ? 'Job selected'
        : notification.type === 'interview_scheduled'
          ? 'Video interview scheduled'
          : stageLabel(clearedStage),
      nextStep: notification.type === 'job_selected'
        ? (tradeLine || 'Test 1')
        : notification.type === 'interview_scheduled'
          ? 'Join the video interview'
          : stageLabel(nextStage || (isTerminal ? 'gcc_ready' : null)),
      isTerminal,
      adminUrl: ADMIN_URL,
    }

    const mailData = (notification.data || {}) as Record<string, unknown>
    const tradeMail = notification.type === 'interview_scheduled' || notification.type === 'job_selected'
    const idempotencyKey = notification.type === 'interview_scheduled'
      ? `interview-${notification.user_id}-${minuteKey(mailData.scheduled_at)}`
      : notification.type === 'job_selected'
        ? `job-selected-${notification.user_id}-${String(mailData.job_id || verification?.journey_job_id || '')}`
        : `journey-step-${notification.id}`
    const sent = await deliverJourneyMail({
      workerEmail,
      idempotencyKey,
      workerTemplateData,
      opsTemplateData,
      preferNoreply: tradeMail,
      skipOps: isReupload,
    })

    return new Response(JSON.stringify({
      success: true,
      emailed: sent.emailed,
      to: workerEmail,
      skipped: sent.skipped,
      opsEmailed: isReupload ? false : sent.opsEmailed,
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
