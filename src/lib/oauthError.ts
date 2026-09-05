/**
 * Google / OAuth error surfacing.
 *
 * Previously any broker failure was swallowed and replaced with a generic
 * "Google sign-in failed". That hid the real cause (access_denied,
 * admin_policy_enforced, redirect_uri_mismatch, …). We now keep the provider
 * error, build a human message from it, and log full diagnostics.
 */
export interface OAuthErrorDetails {
  error?: string | null;
  error_description?: string | null;
  error_code?: string | null;
  error_uri?: string | null;
  status?: number | null;
  origin?: string;
  hostname?: string;
  provider: string;
  flow: 'lovable-broker' | 'supabase-redirect' | 'callback';
  raw?: unknown;
}

const FRIENDLY: Record<string, string> = {
  access_denied: 'Google blocked this sign-in. Error: access_denied',
  admin_policy_enforced:
    'Your Google Workspace administrator blocked this sign-in. Error: admin_policy_enforced',
  redirect_uri_mismatch:
    'Google rejected the sign-in address for this site. Error: redirect_uri_mismatch',
  unauthorized_client: 'This Google app is not authorised for sign-in. Error: unauthorized_client',
  invalid_request: 'Google rejected the sign-in request. Error: invalid_request',
  invalid_client: 'The Google sign-in app configuration is invalid. Error: invalid_client',
  server_error: 'Google returned a server error. Error: server_error',
  temporarily_unavailable:
    'Google sign-in is temporarily unavailable. Error: temporarily_unavailable',
};

export function describeOAuthError(details: OAuthErrorDetails): string {
  const code = (details.error_code || details.error || '').trim();
  const friendly = code ? FRIENDLY[code] : undefined;
  if (friendly) {
    return details.error_description ? `${friendly} — ${details.error_description}` : friendly;
  }
  if (code && details.error_description) return `Google sign-in failed (${code}): ${details.error_description}`;
  if (code) return `Google sign-in failed. Error: ${code}`;
  if (details.error_description) return `Google sign-in failed: ${details.error_description}`;
  return 'Google sign-in could not be completed. Please try again.';
}

/** Full diagnostics in the console; never shown raw to the user. */
export function logOAuthError(details: OAuthErrorDetails) {
  // eslint-disable-next-line no-console
  console.error('[oauth] sign-in failure', {
    provider: details.provider,
    flow: details.flow,
    error: details.error ?? null,
    error_code: details.error_code ?? null,
    error_description: details.error_description ?? null,
    error_uri: details.error_uri ?? null,
    status: details.status ?? null,
    origin: details.origin ?? (typeof window !== 'undefined' ? window.location.origin : null),
    hostname: details.hostname ?? (typeof window !== 'undefined' ? window.location.hostname : null),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    raw: details.raw,
  });
}

/** Extract details from an unknown thrown value / SDK error object. */
export function toOAuthErrorDetails(
  err: unknown,
  base: Pick<OAuthErrorDetails, 'provider' | 'flow'>,
): OAuthErrorDetails {
  const e = (err ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof e[k] === 'string' ? (e[k] as string) : undefined);
  return {
    ...base,
    error: pick('error') || pick('code') || pick('name') || undefined,
    error_description: pick('error_description') || pick('message') || undefined,
    error_code: pick('error_code') || pick('code') || undefined,
    error_uri: pick('error_uri') || undefined,
    status: typeof e.status === 'number' ? (e.status as number) : null,
    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
    raw: err,
  };
}

/**
 * Errors handed back by the provider on the callback URL
 * (`?error=...` or `#error=...`). Read once when the app boots.
 */
export function readOAuthErrorFromUrl(): OAuthErrorDetails | null {
  if (typeof window === 'undefined') return null;
  try {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const get = (k: string) => search.get(k) ?? hash.get(k);
    const error = get('error');
    if (!error) return null;
    return {
      provider: 'google',
      flow: 'callback',
      error,
      error_code: get('error_code'),
      error_description: get('error_description'),
      error_uri: get('error_uri'),
      status: null,
      origin: window.location.origin,
      hostname: window.location.hostname,
    };
  } catch {
    return null;
  }
}

/** Remove OAuth error params so the message is not re-shown on navigation. */
export function clearOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    ['error', 'error_code', 'error_description', 'error_uri'].forEach((k) =>
      url.searchParams.delete(k),
    );
    if (/(^|&)error=/.test(url.hash.replace(/^#/, ''))) url.hash = '';
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}
