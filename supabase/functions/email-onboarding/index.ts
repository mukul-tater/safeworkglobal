import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { z } from 'npm:zod@3.25.76'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { isNewOnboardingAccount, onboardingRole, onboardingUserEmail, onboardingDestination, ONBOARDING_ADMIN_EMAIL } from '../_shared/onboardingEmail.ts'

const Input = z.object({ user_id: z.string().uuid() }).strict()
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405)
  const secret = Deno.env.get('JOURNEY_EMAIL_WEBHOOK_SECRET')
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return response({ error: 'Unauthorized' }, 401)
  const parsed = Input.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return response({ error: 'A valid user_id is required' }, 400)
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key || !Deno.env.get('LOVABLE_API_KEY')) return response({ error: 'Onboarding email is not configured' }, 500)

  try {
    const client = createClient(url, key)
    const [{ data: profile, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
      client.from('profiles').select('id,full_name,email,phone,created_at').eq('id', parsed.data.user_id).maybeSingle(),
      client.from('user_roles').select('role').eq('user_id', parsed.data.user_id),
    ])
    if (profileError || roleError) throw new Error('Could not load onboarding account')
    if (!profile) return response({ skipped: 'account_not_found' })
    if (!isNewOnboardingAccount(profile.created_at)) return response({ skipped: 'existing_account' })
    if (roles?.some(row => row.role === 'admin')) return response({ skipped: 'admin_account' })
    const role = roles?.map(row => onboardingRole(row.role)).find(value => value !== null)
    if (!role) return response({ skipped: 'unsupported_role' })

    const email = onboardingUserEmail(profile.email)
    const data = { name: profile.full_name, role, email, phone: profile.phone, createdAt: profile.created_at, dashboardUrl: onboardingDestination(role) }
    // Both are single-recipient, account-specific notices, never a mailing list.
    // All retries use the account ID so role additions cannot resend welcomes.
    const results = await Promise.allSettled([
      email ? sendTemplateEmail('onboarding-welcome', email, { templateData: data, idempotencyKey: `onboarding-welcome-${profile.id}` }) : Promise.resolve({ sent: false, reason: 'no_deliverable_email' }),
      sendTemplateEmail('onboarding-admin', ONBOARDING_ADMIN_EMAIL, { templateData: data, idempotencyKey: `onboarding-admin-${profile.id}` }),
    ])
    const outcomes = results.map((result, index) => {
      const recipient = index === 0 ? 'user' : 'admin'
      if (result.status === 'fulfilled') {
        console.log(JSON.stringify({ event: 'onboarding_email', recipient, ...result.value }))
        return { recipient, ...result.value }
      }
      const error = result.reason
      const code = error instanceof EmailAPIError ? error.code : 'sending_unavailable'
      const status = error instanceof EmailAPIError ? error.status : 500
      console.error(JSON.stringify({ event: 'onboarding_email_failed', recipient, code, status }))
      return { recipient, sent: false, error: code }
    })
    return response({ outcomes }, results.some(result => result.status === 'rejected') ? 502 : 200)
  } catch {
    console.error('onboarding_email_failed: account_lookup_unavailable')
    return response({ error: 'Onboarding email sending unavailable' }, 500)
  }
})