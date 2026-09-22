/** Shared hashing + ticket consume for direct-signup email OTP. */

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function isSyntheticAuthEmail(email: string): boolean {
  const lower = email.trim().toLowerCase()
  return (
    lower.endsWith('@workers.safeworkglobal.app') ||
    lower.endsWith('@partners.safeworkglobal.app')
  )
}

type AdminQuery = {
  select: (columns: string) => AdminQuery
  update: (values: Record<string, string>) => AdminQuery
  eq: (column: string, value: string) => AdminQuery
  is: (column: string, value: null) => AdminQuery
  maybeSingle: () => Promise<{ data: { id: string; verified_at: string | null; consumed_at: string | null; expires_at: string } | null; error: { message: string } | null }>
}

type AdminFrom = { from: (table: string) => AdminQuery }

export async function findValidSignupEmailTicket(
  admin: AdminFrom,
  email: string,
  ticket: string,
): Promise<string | null> {
  const raw = String(ticket || '').trim()
  if (raw.length < 16) return null
  const ticketHash = await sha256Hex(raw)
  const { data: row, error } = await admin
    .from('signup_email_otps')
    .select('id, verified_at, consumed_at, expires_at')
    .eq('email', email)
    .eq('ticket_hash', ticketHash)
    .is('consumed_at', null)
    .maybeSingle()
  if (error || !row?.id || !row.verified_at) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) return null
  return String(row.id)
}

export async function markSignupEmailTicketConsumed(
  admin: AdminFrom,
  ticketId: string,
): Promise<void> {
  await admin
    .from('signup_email_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .is('consumed_at', null)
}
