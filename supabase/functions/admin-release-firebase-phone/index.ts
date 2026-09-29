import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({ userId: z.string().uuid() }).strict()

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function base64Url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function normalizeIndianPhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '')
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null
}

function loadServiceAccount(): ServiceAccount {
  const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceAccount>
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        }
      }
    } catch {
      throw new Error('Firebase Admin credentials are invalid.')
    }
  }

  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')?.trim()
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')?.trim()
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n').trim()
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured.')
  }
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey }
}

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const keyBytes = Uint8Array.from(
    atob(account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
    (char) => char.charCodeAt(0),
  )
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const unsigned = `${header}.${claims}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  )
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const result = await response.json() as { access_token?: string; error?: string }
  if (!response.ok || !result.access_token) {
    console.error('Firebase Admin OAuth failed', { status: response.status, code: result.error ?? 'unknown' })
    throw new Error('Firebase phone release is unavailable.')
  }
  return result.access_token
}

async function firebaseRequest(
  account: ServiceAccount,
  token: string,
  action: 'lookup' | 'delete',
  body: Record<string, unknown>,
) {
  return fetch(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/accounts:${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Account deletion is not configured.' })
  if (!jwt) return json(401, { error: 'Not authenticated.' })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json(400, { error: 'A valid userId is required.' })

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: callerData, error: callerError } = await admin.auth.getUser(jwt)
  const caller = callerData.user
  if (callerError || !caller) return json(401, { error: 'Not authenticated.' })
  if (caller.id === parsed.data.userId) return json(403, { error: 'You cannot delete your own account.' })

  const { data: callerIsAdmin, error: callerRoleError } = await admin.rpc('has_role', {
    _user_id: caller.id,
    _role: 'admin',
  })
  if (callerRoleError || callerIsAdmin !== true) return json(403, { error: 'Admin access is required.' })

  const { data: targetIsAdmin, error: targetRoleError } = await admin.rpc('has_role', {
    _user_id: parsed.data.userId,
    _role: 'admin',
  })
  if (targetRoleError) return json(500, { error: 'Could not verify the target account.' })
  if (targetIsAdmin === true) return json(403, { error: 'Administrator accounts cannot be deleted here.' })

  const [{ data: profile, error: profileError }, { data: targetData, error: targetError }] = await Promise.all([
    admin.from('profiles').select('phone').eq('id', parsed.data.userId).maybeSingle(),
    admin.auth.admin.getUserById(parsed.data.userId),
  ])
  if (profileError) return json(500, { error: 'Could not load the target account.' })
  if (targetError || !targetData.user) return json(404, { error: 'User account not found.' })

  const authUser = targetData.user
  const candidates = [profile?.phone, authUser.phone, authUser.user_metadata?.phone]
  const phone = candidates.map(normalizeIndianPhone).find((value): value is string => Boolean(value))
  if (!phone) return json(200, { ok: true, released: false })

  try {
    const account = loadServiceAccount()
    if (account.project_id !== 'safeworkglobal1') {
      throw new Error('Firebase Admin credentials are configured for the wrong project.')
    }
    const token = await googleAccessToken(account)
    const lookup = await firebaseRequest(account, token, 'lookup', { phoneNumber: [phone] })
    const lookupBody = await lookup.json() as { users?: { localId?: string }[]; error?: { message?: string } }
    if (!lookup.ok) {
      console.error('Firebase phone lookup failed', { status: lookup.status, code: lookupBody.error?.message ?? 'unknown' })
      return json(502, { error: 'Could not release the mobile number. The account was not deleted.' })
    }
    const localId = lookupBody.users?.[0]?.localId
    if (!localId) return json(200, { ok: true, released: false })

    const deletion = await firebaseRequest(account, token, 'delete', { localId })
    if (!deletion.ok) {
      const deletionBody = await deletion.json().catch(() => ({})) as { error?: { message?: string } }
      console.error('Firebase phone deletion failed', { status: deletion.status, code: deletionBody.error?.message ?? 'unknown' })
      return json(502, { error: 'Could not release the mobile number. The account was not deleted.' })
    }
    return json(200, { ok: true, released: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase phone release is unavailable.'
    console.error('Firebase phone release failed', { reason: message })
    return json(500, { error: message })
  }
})