const KEY = 'pending_oauth_redirect';
const ROLE_KEY = 'pending_oauth_role';
const TTL_MS = 15 * 60 * 1000;

/**
 * OAuth can come back in a DIFFERENT browsing context than it started in
 * (in-app browsers such as WhatsApp/Instagram hand off to Safari/Chrome, iOS
 * may restore a new tab, popups can be blocked and fall back to a redirect).
 * `sessionStorage` is per-tab, so it silently disappears on those devices and
 * the user lands signed-in on "/" with no role — the "works on some devices"
 * symptom. Persist in `localStorage` (with a TTL) and mirror to
 * `sessionStorage` for private-mode fallbacks.
 */
function writeBoth(key: string, value: string) {
  const payload = JSON.stringify({ value, ts: Date.now() });
  try {
    localStorage.setItem(key, payload);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(key, payload);
  } catch {
    /* ignore */
  }
}

function readBoth(key: string): string | null {
  for (const store of [localStorage, sessionStorage]) {
    let raw: string | null = null;
    try {
      raw = store.getItem(key);
    } catch {
      continue;
    }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { value?: string; ts?: number };
      if (typeof parsed?.value !== 'string') continue;
      if (parsed.ts && Date.now() - parsed.ts > TTL_MS) continue;
      return parsed.value;
    } catch {
      // legacy plain-string value
      return raw;
    }
  }
  return null;
}

function removeBoth(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Only same-origin relative paths are allowed as post-OAuth destinations. */
function isSafePath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

/** Remember where the user should land once the OAuth session is available. */
export function setPendingOAuthRedirect(pathOrUrl: string) {
  try {
    let path = pathOrUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) {
      const url = new URL(pathOrUrl);
      if (url.origin !== window.location.origin) return;
      path = `${url.pathname}${url.search}${url.hash}`;
    }
    if (!isSafePath(path) || path === '/') return;
    writeBoth(KEY, path);
  } catch {
    /* ignore */
  }
}

export function clearPendingOAuthRedirect() {
  removeBoth(KEY);
}

/** Read and clear the stored destination. Call only once a session exists. */
export function consumePendingOAuthRedirect(): string | null {
  const path = readBoth(KEY);
  removeBoth(KEY);
  if (!path) return null;
  return isSafePath(path) ? path : null;
}

/** Role the user picked before starting OAuth (survives context switches). */
export function setPendingOAuthRole(role: string) {
  writeBoth(ROLE_KEY, role);
}

export function peekPendingOAuthRole(): string | null {
  return readBoth(ROLE_KEY);
}

export function clearPendingOAuthRole() {
  removeBoth(ROLE_KEY);
}