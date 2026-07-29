import type { LspSession } from '../types/lsp.types';

const STORAGE_KEY = 'sw_lsp';
const COOKIE_NAME = 'sw_lsp';

function writeCookie(value: string, maxAgeSeconds: number) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setLspSession(session: LspSession): void {
  const json = JSON.stringify(session);
  try {
    sessionStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* ignore */
  }
  const ttl = Math.max(60, session.sessionExp - Math.floor(Date.now() / 1000));
  writeCookie(json, ttl);
}

export function getLspSession(): LspSession | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) {
    const match = document.cookie.match(/(?:^|; )sw_lsp=([^;]*)/);
    if (match?.[1]) {
      try {
        raw = decodeURIComponent(match[1]);
      } catch {
        raw = null;
      }
    }
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LspSession;
    if (!parsed?.lspId || !parsed?.sessionExp) return null;
    if (parsed.sessionExp * 1000 < Date.now()) {
      clearLspSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLspSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearCookie();
}

export function hasValidLspSession(): boolean {
  return getLspSession() !== null;
}
