import { supabase } from '@/integrations/supabase/client';
import { workerApi } from '../services/workerApi';
import type { WorkerAuthResponse } from '../types/worker.types';

const PREFILL_KEY = 'worker_google_prefill';

export type WorkerGoogleBridgeResult = 'home' | 'register' | 'failed';

export function readGoogleRegisterPrefill(): { email: string; fullName: string } | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_KEY);
    return JSON.parse(raw) as { email: string; fullName: string };
  } catch {
    return null;
  }
}

export function workerPathAfterGoogleBridge(result: WorkerGoogleBridgeResult): string {
  if (result === 'register') return '/register';
  if (result === 'home') return '/home';
  return '/login';
}

export async function completeWorkerGoogleBridge(
  loginWithGoogle: (auth: WorkerAuthResponse) => Promise<{ success: boolean; error?: string }>
): Promise<WorkerGoogleBridgeResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return 'failed';

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email.split('@')[0];

  try {
    const result = await workerApi.googleAuth({
      email: user.email,
      fullName,
    });

    if ('needsRegistration' in result && result.needsRegistration) {
      sessionStorage.setItem(
        PREFILL_KEY,
        JSON.stringify({ email: result.email, fullName: result.fullName })
      );
      return 'register';
    }

    const loginResult = await loginWithGoogle(result as WorkerAuthResponse);
    return loginResult.success ? 'home' : 'failed';
  } catch {
    return 'failed';
  }
}
