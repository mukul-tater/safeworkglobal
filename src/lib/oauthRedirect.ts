const KEY = 'pending_oauth_redirect';

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
    sessionStorage.setItem(KEY, path);
  } catch {
    /* ignore */
  }
}

export function clearPendingOAuthRedirect() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Read and clear the stored destination. Call only once a session exists. */
export function consumePendingOAuthRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    if (!path) return null;
    sessionStorage.removeItem(KEY);
    return isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}