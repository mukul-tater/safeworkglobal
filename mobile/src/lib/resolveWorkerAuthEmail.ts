import { supabase } from '../integrations/supabase/client';
import { workerAuthEmailFromIdentifier } from './workerAuthEmail';

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
