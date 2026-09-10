import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  consumePendingOAuthRedirect,
  peekPendingOAuthRole,
  resolvePostOAuthPath,
  clearPendingOAuthRole,
} from '@/lib/oauthRedirect';

/**
 * Google OAuth always returns to the bare app origin (the broker only allows the
 * origin as redirect target). Depending on the device the browser may land on
 * "/" — or restore whatever route was open before — so the "continue to intended
 * page" logic must be global, not tied to the home page.
 */
export default function OAuthLandingHandler() {
  const { loading, isAuthenticated, role, profileLoading, needsRoleSelection } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);
  const debugReturnLogged = useRef(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(location.search);
    const isRecovery = hash.get('type') === 'recovery' || search.get('type') === 'recovery';
    if (isRecovery && location.pathname !== '/reset-password') {
      navigate(`/reset-password${location.search}${location.hash}`, { replace: true });
    }

    // #region agent log
    const hasOAuthSignal =
      search.has('code') ||
      search.has('error') ||
      hash.has('error') ||
      hash.has('access_token') ||
      hash.has('refresh_token');
    if (hasOAuthSignal && !debugReturnLogged.current) {
      debugReturnLogged.current = true;
      fetch('http://127.0.0.1:7391/ingest/96bbca4f-9808-43b1-add7-e225ef15496d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '56fe26' },
        body: JSON.stringify({
          sessionId: '56fe26',
          location: 'OAuthLandingHandler.tsx:return',
          message: 'OAuth return URL inspected',
          data: {
            host: window.location.hostname,
            origin: window.location.origin,
            path: location.pathname,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lang: navigator.language,
            hasCode: search.has('code'),
            hasAccessToken: hash.has('access_token'),
            hasRefreshToken: hash.has('refresh_token'),
            error: search.get('error') || hash.get('error'),
            errorDesc: search.get('error_description') || hash.get('error_description'),
            isAuthenticated,
            loading,
          },
          timestamp: Date.now(),
          hypothesisId: 'H2',
        }),
      }).catch(() => {});
    }
    // #endregion
  }, [location.hash, location.pathname, location.search, navigate, isAuthenticated, loading]);

  useEffect(() => {
    if (location.pathname === '/reset-password') return;
    if (loading || !isAuthenticated || handled.current) return;
    // Role may still be fetching — wait so we send new Google users to role
    // select instead of a login form, and existing users to /dashboard.
    if (profileLoading && !role) return;

    const next = consumePendingOAuthRedirect();
    const pendingRole = peekPendingOAuthRole();

    if (needsRoleSelection) {
      handled.current = true;
      if (location.pathname !== '/auth') navigate('/auth', { replace: true });
      return;
    }

    const target = resolvePostOAuthPath(next, pendingRole);
    if (!target) return;

    handled.current = true;
    if (pendingRole && role && pendingRole === role) {
      clearPendingOAuthRole();
    }
    if (target !== location.pathname) navigate(target, { replace: true });
  }, [
    loading,
    isAuthenticated,
    profileLoading,
    role,
    needsRoleSelection,
    navigate,
    location.pathname,
  ]);

  return null;
}
