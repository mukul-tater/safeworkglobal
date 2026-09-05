/**
 * Canonical authentication host.
 *
 * OAuth (Google via the Lovable broker or Supabase) is configured for the apex
 * domain only — `https://safeworkglobal.com`. If a visitor lands on the `www`
 * host we move them to the apex host BEFORE any OAuth flow starts, instead of
 * registering a second redirect URI / second OAuth flow for `www`.
 */
export const CANONICAL_AUTH_HOST = 'safeworkglobal.com';

/** Hosts that must be rewritten to the canonical host before OAuth. */
const HOST_ALIASES: Record<string, string> = {
  'www.safeworkglobal.com': CANONICAL_AUTH_HOST,
};

export function getCanonicalAuthHost(host: string): string | null {
  return HOST_ALIASES[host.toLowerCase()] ?? null;
}

/**
 * Redirects to the canonical auth host when needed.
 * Returns true when a navigation was started (caller must stop its work).
 */
export function redirectToCanonicalAuthHost(): boolean {
  if (typeof window === 'undefined') return false;
  const canonical = getCanonicalAuthHost(window.location.hostname);
  if (!canonical) return false;
  const url = new URL(window.location.href);
  url.hostname = canonical;
  window.location.replace(url.toString());
  return true;
}
