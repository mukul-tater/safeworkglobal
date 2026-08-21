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
  const stores: Storage[] = [];
  try {
    stores.push(localStorage);
  } catch {
    /* blocked by private mode / embedded browser */
  }
  try {
    stores.push(sessionStorage);
  } catch {
    /* blocked by private mode / embedded browser */
  }

  for (const store of stores) {
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

/**
 * True while Supabase is still exchanging the OAuth `code` / hash tokens.
 * Auth must stay in "loading" during this window — otherwise ProtectedRoute
 * and login pages think the user is signed out and flash the login form.
 */
export function hasOAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const search = new URLSearchParams(window.location.search);
    if (search.has('error')) return false;
    if (search.has('code')) return true;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return false;
    const hp = new URLSearchParams(hash);
    if (hp.has('error')) return false;
    return hp.has('access_token') || hp.has('refresh_token');
  } catch {
    return false;
  }
}

/** Login-form routes that must never be used as a post-OAuth hop. */
function isLoginFormPath(path: string): boolean {
  const pathname = path.split('?')[0];
  return (
    pathname === '/auth' ||
    pathname === '/login' ||
    pathname === '/worker/login' ||
    pathname === '/employer/login' ||
    pathname === '/partner/login' ||
    pathname === '/admin/login' ||
    pathname === '/emitra/login'
  );
}

/**
 * After Google returns, send the user to a spinner router — never a login form.
 * `/dashboard` waits for role and then forwards to the right portal.
 */
export function resolvePostOAuthPath(path: string | null, pendingRole?: string | null): string | null {
  if (path && isSafePath(path) && !isLoginFormPath(path) && path !== '/') return path;
  if (path || pendingRole) return '/dashboard';
  return null;
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
    writeBoth(KEY, resolvePostOAuthPath(path, null) || path);
  } catch {
    /* ignore */
  }
}

export function clearPendingOAuthRedirect() {
  removeBoth(KEY);
}

/** Peek without clearing — used to hide the homepage while OAuth is finishing. */
export function peekPendingOAuthRedirect(): string | null {
  const path = readBoth(KEY);
  if (!path) return null;
  return isSafePath(path) ? path : null;
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