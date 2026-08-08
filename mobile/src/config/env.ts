import Config from 'react-native-config';

function read(key: string): string {
  const fromProcess =
    typeof globalThis !== 'undefined' &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
  const fromConfig = (Config as Record<string, string | undefined>)[key];
  return String(fromProcess || fromConfig || '').trim();
}

const SUPABASE_URL = read('SUPABASE_URL');
const SUPABASE_ANON_KEY = read('SUPABASE_ANON_KEY');
const API_BASE_URL = read('API_BASE_URL').replace(/\/$/, '');

export const ENV = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_BASE_URL,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
};

export function assertEnvConfigured(): void {
  if (!ENV.isConfigured) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY. Copy mobile/.env.example to mobile/.env and restart Metro.',
    );
  }
}
