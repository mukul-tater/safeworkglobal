import { supabase } from '@/integrations/supabase/client';
import { workerAuthEmailFromIdentifier } from '@/lib/workerAuthEmail';

/**
 * Map a typed mobile or email to the Auth email used by signInWithPassword.
 * eMitra kiosk accounts are created with a real contact email, so mobile login
 * must look up that email — not assume the legacy m…@workers… address.
 */
export async function resolveWorkerAuthEmail(identifier: string): Promise<string | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  const { data, error } = await supabase.rpc('resolve_worker_auth_email', {
    p_identifier: raw,
  });

  if (!error && typeof data === 'string' && data.includes('@')) {
    return data.toLowerCase();
  }

  return workerAuthEmailFromIdentifier(raw);
}
