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

  useEffect(() => {
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
