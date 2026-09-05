import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  consumePendingOAuthRedirect,
  peekPendingOAuthRole,
  resolvePostOAuthPath,
  clearPendingOAuthRole,
  clearPendingOAuthRedirect,
} from '@/lib/oauthRedirect';
import {
  clearOAuthErrorFromUrl,
  describeOAuthError,
  logOAuthError,
  readOAuthErrorFromUrl,
} from '@/lib/oauthError';

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
  const errorShown = useRef(false);

  // Provider error handed back on the callback URL — surface it verbatim
  // instead of leaving the user on a silent, signed-out page.
  useEffect(() => {
    if (errorShown.current) return;
    const details = readOAuthErrorFromUrl();
    if (!details) return;
    errorShown.current = true;
    logOAuthError(details);
    clearPendingOAuthRedirect();
    clearPendingOAuthRole();
    clearOAuthErrorFromUrl();
    toast.error(describeOAuthError(details));
  }, [location.search, location.hash]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(location.search);
    const isRecovery = hash.get('type') === 'recovery' || search.get('type') === 'recovery';
    if (isRecovery && location.pathname !== '/reset-password') {
      navigate(`/reset-password${location.search}${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);


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
