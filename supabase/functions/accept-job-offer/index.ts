import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { normalizeIndianMobile, verifiedMobileFromIdToken } from '../_shared/firebasePhone.ts'

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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json(500, { error: 'Offer acceptance is not available right now.' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'Sign in again to accept this offer letter.' })
  }

  let payload: { idToken?: unknown; userId?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  const callerId = userData.user?.id
  if (userErr || !callerId) {
    return json(401, { error: 'Sign in again to accept this offer letter.' })
  }

  const requested = String(payload.userId ?? '').trim()
  const subjectId = requested || callerId
  if (subjectId !== callerId) {
    const { data: manages, error: manageErr } = await userClient.rpc('partner_manages_worker', {
      _worker_user_id: subjectId,
    })
    if (manageErr || manages !== true) {
      return json(403, { error: 'You cannot accept an offer letter for this worker.' })
    }
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('phone')
    .eq('id', subjectId)
    .maybeSingle()
  if (profileErr) {
    return json(500, { error: 'Could not read the mobile number on this account.' })
  }

  const profilePhone = normalizeIndianMobile(String(profile?.phone ?? ''))
  if (!profilePhone) {
    return json(400, {
      error: 'This account has no mobile number. Add the registered mobile before accepting the offer letter.',
    })
  }

  try {
    const verified = await verifiedMobileFromIdToken(String(payload.idToken ?? ''), profilePhone)
    const { data, error } = await admin.rpc('worker_accept_job_offer', {
      p_user_id: subjectId,
      p_phone: verified,
    })
    if (error) {
      return json(400, { error: error.message })
    }
    return json(200, { verification: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Offer letter could not be accepted.'
    return json(400, { error: message })
  }
})
