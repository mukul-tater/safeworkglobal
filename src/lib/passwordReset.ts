import { supabase } from '@/integrations/supabase/client';
import { isSyntheticAuthEmail } from '@/lib/workerAuthEmail';

export const RESET_PASSWORD_PATH = '/reset-password';
export const PASSWORD_RESET_NEXT_STORAGE_KEY = 'swg_password_reset_next';

const DEFAULT_LOGIN_PATH = '/worker/login';

const ALLOWED_LOGIN_PATHS = new Set([
  '/auth',
  '/worker/login',
  '/employer/login',
  '/partner/login',
  '/emitra/login',
  '/partner/ssvn/login',
  '/partner/iti/login',
  '/partner/srn/login',
  '/partner/consultant/login',
  '/admin/login',
  '/interviewer/login',
]);

export function isSafeResetNextPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  const bare = path.split('?')[0];
  return ALLOWED_LOGIN_PATHS.has(bare);
}

export function rememberResetLoginPath(loginPath: string): void {
  const next = isSafeResetNextPath(loginPath) ? loginPath : DEFAULT_LOGIN_PATH;
  try {
    sessionStorage.setItem(PASSWORD_RESET_NEXT_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
  try {
    localStorage.setItem(PASSWORD_RESET_NEXT_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

export function readResetLoginPath(searchNext?: string | null): string {
  if (isSafeResetNextPath(searchNext)) return searchNext;
  for (const store of [sessionStorage, localStorage]) {
    try {
      const stored = store.getItem(PASSWORD_RESET_NEXT_STORAGE_KEY);
      if (isSafeResetNextPath(stored)) return stored;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_LOGIN_PATH;
}

export function clearResetLoginPath(): void {
  try {
    sessionStorage.removeItem(PASSWORD_RESET_NEXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(PASSWORD_RESET_NEXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function passwordResetRedirectTo(loginPath: string): string {
  const next = isSafeResetNextPath(loginPath) ? loginPath : DEFAULT_LOGIN_PATH;
  rememberResetLoginPath(next);
  return `${window.location.origin}${RESET_PASSWORD_PATH}?next=${encodeURIComponent(next)}`;
}

export const GENERIC_RESET_SENT_MESSAGE =
  'If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.';

export const SYNTHETIC_ACCOUNT_RESET_MESSAGE =
  'This account was created with mobile only and has no email inbox. Use the email from signup, or contact SafeWork support.';

export type PasswordResetResult = { ok: true } | { ok: false; error: string };

/**
 * Send a Supabase recovery email. Synthetic mobile-login addresses are rejected
 * because they are not real inboxes.
 */
export async function requestPasswordReset(
  identifier: string,
  options: {
    loginPath: string;
    resolveAuthEmail?: (raw: string) => Promise<string | null>;
  },
): Promise<PasswordResetResult> {
  const raw = identifier.trim();
  if (!raw) {
    return { ok: false, error: 'Enter the email you use to sign in.' };
  }

  let resolved: string | null;
  try {
    resolved = options.resolveAuthEmail
      ? await options.resolveAuthEmail(raw)
      : raw.includes('@')
        ? raw.toLowerCase()
        : null;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send a reset email.',
    };
  }

  if (!resolved) {
    return {
      ok: false,
      error: 'Enter the email you use to sign in. Password reset is sent by email, not SMS.',
    };
  }

  if (isSyntheticAuthEmail(resolved) || !resolved.includes('@')) {
    return { ok: false, error: SYNTHETIC_ACCOUNT_RESET_MESSAGE };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(resolved, {
    redirectTo: passwordResetRedirectTo(options.loginPath),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
