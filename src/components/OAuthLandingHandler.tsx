import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  consumePendingOAuthRedirect,
  peekPendingOAuthRole,
} from '@/lib/oauthRedirect';

/**
 * Google OAuth always returns to the bare app origin (the broker only allows the
 * origin as redirect target). Depending on the device the browser may land on
 * "/" — or restore whatever route was open before — so the "continue to intended
 * page" logic must be global, not tied to the home page.
 */
export default function OAuthLandingHandler() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || handled.current) return;

    const next = consumePendingOAuthRedirect();
    const pendingRole = peekPendingOAuthRole();
    const target = next ?? (pendingRole ? '/auth' : null);
    if (!target) return;

    handled.current = true;
    if (target !== location.pathname) navigate(target, { replace: true });
  }, [loading, isAuthenticated, navigate, location.pathname]);

  return null;
}
