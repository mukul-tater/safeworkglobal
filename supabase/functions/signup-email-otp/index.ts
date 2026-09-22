import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { allowDevOtpBypass } from '../_shared/firebasePhone.ts'
import {
  findValidSignupEmailTicket,
  markSignupEmailTicketConsumed,
  sha256Hex,
} from '../_shared/signupEmailTicket.ts'

const OTP_TTL_MS = 10 * 60 * 1000
const TICKET_TTL_MS = 20 * 60 * 1000
const RESEND_GAP_MS = 45 * 1000
const MAX_SENDS_PER_HOUR = 5
const MAX_ATTEMPTS = 5
const DEV_OTP_CODE = '123456'

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeEmail(value: unknown): string | null {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  if (
    email.endsWith('@workers.safeworkglobal.app') ||
    email.endsWith('@partners.safeworkglobal.app')
  ) {
    return null
  }
  return email
}

function randomOtp(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const n = (bytes[0]! * 2 ** 24 + bytes[1]! * 2 ** 16 + bytes[2]! * 2 ** 8 + bytes[3]!) % 1_000_000
  return String(n).padStart(6, '0')
}

function randomTicket(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function emailOtpDevBypass(): boolean {
  const flag = (Deno.env.get('SIGNUP_EMAIL_OTP_DEV_BYPASS') || '').toLowerCase()
  if (flag === 'true' || flag === '1') return true
  return allowDevOtpBypass()
}

async function emailAlreadyRegistered(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()
  if (profile?.id) return true

  const adminAuth = admin.auth.admin as { getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string } | null } }> }
  if (typeof adminAuth.getUserByEmail === 'function') {
    try {
      const { data } = await adminAuth.getUserByEmail(email)
      if (data?.user?.id) return true
    } catch {
      /* fall through */
    }
  }
  return false
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Server is not configured for email verification.' })
  }

  let payload: {
    action?: unknown
    email?: unknown
    otp?: unknown
    ticket?: unknown
    password?: unknown
    fullName?: unknown
  }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const action = String(payload.action || '').trim()
  if (!['send', 'verify', 'create_employer'].includes(action)) {
    return json(400, { error: 'Unknown action.' })
  }

  const email = normalizeEmail(payload.email)
  if (!email) {
    return json(400, { error: 'Enter a valid email address.' })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    if (action === 'send') {
      if (await emailAlreadyRegistered(admin, email)) {
        return json(409, { error: 'already registered' })
      }

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: sendCount } = await admin
        .from('signup_email_otps')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', hourAgo)
      if ((sendCount ?? 0) >= MAX_SENDS_PER_HOUR) {
        return json(429, { error: 'Too many codes sent. Wait a few minutes and try again.' })
      }

      const { data: latest } = await admin
        .from('signup_email_otps')
        .select('created_at')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latest?.created_at && Date.now() - new Date(latest.created_at).getTime() < RESEND_GAP_MS) {
        return json(429, { error: 'Wait a moment before requesting another code.' })
      }

      await admin
        .from('signup_email_otps')
        .update({ expires_at: new Date().toISOString() })
        .eq('email', email)
        .is('verified_at', null)

      const bypass = emailOtpDevBypass()
      const code = bypass ? DEV_OTP_CODE : randomOtp()
      const { error: insertErr } = await admin.from('signup_email_otps').insert({
        email,
        code_hash: await sha256Hex(`${email}:${code}`),
        expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      })
      if (insertErr) throw new Error(insertErr.message)

      if (!bypass) {
        const result = await sendTemplateEmail('signup-email-otp', email, {
          templateData: { code },
          idempotencyKey: `signup-email-otp-${email}-${Date.now()}`,
        })
        if (!result.sent) {
          return json(400, { error: 'Could not send a code to this email. Try a different address.' })
        }
      }

      return json(200, { sent: true, dev: bypass })
    }

    if (action === 'verify') {
      const otp = String(payload.otp || '').replace(/\s/g, '')
      if (!/^\d{6}$/.test(otp)) {
        return json(400, { error: 'Enter the 6-digit verification code.' })
      }

      const { data: row } = await admin
        .from('signup_email_otps')
        .select('id, code_hash, attempts, expires_at, verified_at')
        .eq('email', email)
        .is('consumed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row?.id) {
        return json(400, { error: 'Invalid or expired code. Request a new one.' })
      }
      if (row.verified_at) {
        return json(400, { error: 'This email is already verified. Continue creating your account.' })
      }
      if (new Date(row.expires_at).getTime() <= Date.now()) {
        return json(400, { error: 'This code expired. Request a new one.' })
      }
      if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
        return json(400, { error: 'Too many attempts. Request a new code.' })
      }

      const expected = await sha256Hex(`${email}:${otp}`)
      const bypassOk = emailOtpDevBypass() && otp === DEV_OTP_CODE
      if (row.code_hash !== expected && !bypassOk) {
        await admin
          .from('signup_email_otps')
          .update({ attempts: (row.attempts ?? 0) + 1 })
          .eq('id', row.id)
        return json(400, { error: 'Invalid or expired code. Request a new one.' })
      }

      const ticket = randomTicket()
      const { error: updErr } = await admin
        .from('signup_email_otps')
        .update({
          verified_at: new Date().toISOString(),
          ticket_hash: await sha256Hex(ticket),
          expires_at: new Date(Date.now() + TICKET_TTL_MS).toISOString(),
          attempts: (row.attempts ?? 0) + 1,
        })
        .eq('id', row.id)
      if (updErr) throw new Error(updErr.message)

      return json(200, { ticket })
    }

    const ticket = String(payload.ticket || '').trim()
    const password = String(payload.password || '')
    const fullName = String(payload.fullName || '').trim()
    const ticketId = await findValidSignupEmailTicket(admin, email, ticket)
    if (!ticketId) {
      return json(400, { error: 'Verify your email with the OTP we sent, then try again.' })
    }

    const { data: userId, error } = await admin.rpc('create_email_verified_employer_account', {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
    })
    if (error) {
      const msg = error.message || 'Could not create account.'
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json(409, { error: 'already registered' })
      }
      return json(400, { error: msg })
    }
    if (!userId) return json(500, { error: 'Could not create account. Please try again.' })
    await markSignupEmailTicketConsumed(admin, ticketId)
    return json(200, { user_id: userId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not verify email.'
    const status = /already registered/i.test(message) ? 409 : 400
    return json(status, { error: message })
  }
})
