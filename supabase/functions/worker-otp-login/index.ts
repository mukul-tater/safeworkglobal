import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { verifiedMobileFromIdToken } from '../_shared/firebasePhone.ts'

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
    return json(500, { error: 'Server is not configured for OTP login.' })
  }

  let payload: { mobile?: unknown; idToken?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  try {
    const mobile = await verifiedMobileFromIdToken(
      String(payload.idToken ?? ''),
      String(payload.mobile ?? ''),
    )

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const phoneVariants = [mobile, `+91${mobile}`, `91${mobile}`]
    const { data: profileRows, error: profileErr } = await admin
      .from('profiles')
      .select('id, phone, email')
      .in('phone', phoneVariants)

    if (profileErr) {
      return json(500, { error: 'Could not look up this mobile number.' })
    }

    const profileIds = [...new Set((profileRows ?? []).map((row) => row.id).filter(Boolean))]
    if (profileIds.length === 0) {
      return json(404, { error: 'No worker account found for this mobile number.' })
    }

    const { data: roleRows } = await admin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profileIds)

    const workerId = (roleRows ?? []).find((row) => row.role === 'worker')?.user_id
    if (!workerId) {
      const other = (roleRows ?? []).find((row) => row.role && row.role !== 'worker')
      if (other?.role) {
        return json(403, {
          error: `This account is registered as a ${other.role}. Please continue from the correct portal.`,
        })
      }
      return json(404, { error: 'No worker account found for this mobile number.' })
    }

    const { data: authUser, error: userErr } = await admin.auth.admin.getUserById(workerId)
    const email = authUser.user?.email?.trim()
    if (userErr || !authUser.user || !email) {
      return json(404, { error: 'No worker account found for this mobile number.' })
    }

    if (!authUser.user.email_confirmed_at) {
      await admin.auth.admin.updateUserById(workerId, { email_confirm: true })
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkErr || !linkData?.properties?.hashed_token) {
      return json(500, { error: linkErr?.message || 'Could not start a session. Please try again.' })
    }

    const hashedToken = linkData.properties.hashed_token
    const emailOtp = linkData.properties.email_otp
    let accessToken = ''
    let refreshToken = ''

    for (const type of ['magiclink', 'email'] as const) {
      const { data, error } = await admin.auth.verifyOtp({
        token_hash: hashedToken,
        type,
      })
      if (!error && data.session?.access_token && data.session.refresh_token) {
        accessToken = data.session.access_token
        refreshToken = data.session.refresh_token
        break
      }
    }

    if (!accessToken && emailOtp) {
      for (const type of ['magiclink', 'email'] as const) {
        const { data, error } = await admin.auth.verifyOtp({
          email,
          token: emailOtp,
          type,
        })
        if (!error && data.session?.access_token && data.session.refresh_token) {
          accessToken = data.session.access_token
          refreshToken = data.session.refresh_token
          break
        }
      }
    }

    if (!accessToken || !refreshToken) {
      return json(500, { error: 'Could not start a session. Please try again.' })
    }

    await admin
      .from('profiles')
      .update({ phone: mobile, mobile_verified: true })
      .eq('id', workerId)
    try {
      await admin.auth.admin.updateUserById(workerId, {
        user_metadata: {
          ...(authUser.user.user_metadata || {}),
          phone: mobile,
          mobile_verified: true,
        },
      })
    } catch {
      /* non-fatal */
    }

    return json(200, {
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not sign in with OTP.'
    return json(401, { error: message })
  }
})
