import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { verifiedMobileFromIdToken } from '../_shared/firebasePhone.ts'
import {
  findValidSignupEmailTicket,
  isSyntheticAuthEmail,
  markSignupEmailTicketConsumed,
} from '../_shared/signupEmailTicket.ts'

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
    return json(500, { error: 'Server is not configured for account creation.' })
  }

  let payload: {
    action?: unknown
    mobile?: unknown
    idToken?: unknown
    email?: unknown
    password?: unknown
    fullName?: unknown
    emailOtpTicket?: unknown
  }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const action = String(payload.action || '').trim()
  if (!['create_worker', 'create_partner', 'bind_mobile'].includes(action)) {
    return json(400, { error: 'Unknown action.' })
  }

  try {
    const mobile = await verifiedMobileFromIdToken(String(payload.idToken ?? ''), String(payload.mobile ?? ''))
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (action === 'bind_mobile') {
      const authHeader = req.headers.get('Authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
      if (!token) return json(401, { error: 'Not authenticated' })

      const {
        data: { user },
        error: userErr,
      } = await admin.auth.getUser(token)
      if (userErr || !user) return json(401, { error: 'Not authenticated' })

      const { data: taken } = await admin
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .or(`phone.eq.${mobile},phone.eq.+91${mobile},phone.eq.91${mobile}`)
        .limit(1)
        .maybeSingle()
      if (taken?.id) {
        return json(409, { error: 'This mobile number is already registered.' })
      }

      const { error: updErr } = await admin
        .from('profiles')
        .update({ phone: mobile, mobile_verified: true, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (updErr) throw new Error(updErr.message)

      await admin
        .from('partner_profiles')
        .update({ mobile_verified: true })
        .eq('user_id', user.id)

      try {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata || {}),
            phone: mobile,
            mobile_verified: true,
          },
        })
      } catch {
        /* non-fatal */
      }

      return json(200, { user_id: user.id, mobile })
    }

    const email = String(payload.email || '').trim().toLowerCase()
    const password = String(payload.password || '')
    const fullName = String(payload.fullName || '').trim()
    let emailTicketId: string | null = null
    if (action === 'create_worker' && !isSyntheticAuthEmail(email)) {
      emailTicketId = await findValidSignupEmailTicket(
        admin,
        email,
        String(payload.emailOtpTicket || ''),
      )
      if (!emailTicketId) {
        return json(400, { error: 'Verify your email with the OTP we sent, then try again.' })
      }
    }
    const rpcName =
      action === 'create_partner'
        ? 'create_phone_verified_partner_account'
        : 'create_phone_verified_worker_account'

    const { data: userId, error } = await admin.rpc(rpcName, {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_phone: mobile,
    })
    if (error) {
      const msg = error.message || 'Could not create account.'
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json(409, { error: 'already registered' })
      }
      return json(400, { error: msg })
    }
    if (!userId) return json(500, { error: 'Could not create account. Please try again.' })
    if (emailTicketId) {
      await markSignupEmailTicketConsumed(admin, emailTicketId)
    }

    return json(200, { user_id: userId, mobile })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not complete verification.'
    const status = /not authenticated/i.test(message) ? 401 : /already registered/i.test(message) ? 409 : 400
    return json(status, { error: message })
  }
})
