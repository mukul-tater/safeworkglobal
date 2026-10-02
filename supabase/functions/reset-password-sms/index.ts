import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { normalizeIndianMobile, verifiedMobileFromIdToken } from '../_shared/firebasePhone.ts'

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isSyntheticAuthEmail(email: string | null | undefined): boolean {
  const lower = email?.trim().toLowerCase() ?? ''
  return (
    lower.endsWith('@workers.safeworkglobal.app') ||
    lower.endsWith('@partners.safeworkglobal.app')
  )
}

function passwordIssue(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  if (password.length > 72) return 'Password is too long'
  if (!/^[a-zA-Z0-9]+$/.test(password)) return 'Password can only contain letters and numbers'
  return null
}

type AccountLookup =
  | { status: 'synthetic'; userId: string }
  | { status: 'email' }
  | { status: 'ambiguous' }
  | { status: 'missing' }

/** The verified mobile may reset only the account that owns that number. */
async function findMobileAccount(
  admin: ReturnType<typeof createClient>,
  mobile: string,
): Promise<AccountLookup> {
  const phoneVariants = [mobile, `+91${mobile}`, `91${mobile}`]
  const { data: profileRows, error: profileErr } = await admin
    .from('profiles')
    .select('id, phone')
    .in('phone', phoneVariants)

  if (profileErr) {
    throw new Error('Could not look up this mobile number.')
  }

  const profileIds = [...new Set((profileRows ?? []).map((row) => row.id).filter(Boolean))]
  if (profileIds.length === 0) return { status: 'missing' }

  const syntheticIds: string[] = []
  let sawRealEmail = false
  for (const userId of profileIds) {
    const { data: authUser, error: userErr } = await admin.auth.admin.getUserById(userId)
    const email = authUser.user?.email?.trim()
    if (userErr || !authUser.user || !email) continue
    if (isSyntheticAuthEmail(email)) {
      syntheticIds.push(userId)
    } else {
      sawRealEmail = true
    }
  }

  if (syntheticIds.length > 1) return { status: 'ambiguous' }
  if (syntheticIds.length === 1) return { status: 'synthetic', userId: syntheticIds[0] }
  return sawRealEmail ? { status: 'email' } : { status: 'missing' }
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
    return json(500, { error: 'Password reset is not available right now.' })
  }

  let payload: { action?: unknown; mobile?: unknown; idToken?: unknown; password?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const action = String(payload.action ?? '')
  if (action !== 'prepare' && action !== 'complete') {
    return json(400, { error: 'Invalid request.' })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    if (action === 'prepare') {
      const mobile = normalizeIndianMobile(String(payload.mobile ?? ''))
      if (!mobile) {
        return json(400, { error: 'Enter a valid 10-digit Indian mobile number.' })
      }
      const account = await findMobileAccount(admin, mobile)
      if (account.status === 'synthetic') return json(200, { ok: true })
      if (account.status === 'email') {
        return json(200, {
          ok: false,
          error: 'This number uses an email account. Enter that email to get a reset link.',
        })
      }
      if (account.status === 'ambiguous') {
        return json(200, {
          ok: false,
          error: 'More than one account uses this number. Reset with the email on your account.',
        })
      }
      return json(200, {
        ok: false,
        error: 'No account uses this number. If you signed up with an email, enter that email.',
      })
    }

    const mobile = await verifiedMobileFromIdToken(
      String(payload.idToken ?? ''),
      String(payload.mobile ?? ''),
    )
    const issue = passwordIssue(String(payload.password ?? ''))
    if (issue) return json(400, { error: issue })

    const account = await findMobileAccount(admin, mobile)
    if (account.status === 'email') {
      return json(400, {
        error: 'This number uses an email account. Enter that email to get a reset link.',
      })
    }
    if (account.status === 'ambiguous') {
      return json(400, {
        error: 'More than one account uses this number. Reset with the email on your account.',
      })
    }
    if (account.status !== 'synthetic') {
      return json(404, {
        error: 'No account uses this number. If you signed up with an email, enter that email.',
      })
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(account.userId, {
      password: String(payload.password),
    })
    if (updateErr) {
      return json(400, { error: updateErr.message || 'Could not update the password.' })
    }

    return json(200, { ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not reset the password.'
    const status = /not configured|look up/i.test(message) ? 500 : 400
    return json(status, { error: message })
  }
})
