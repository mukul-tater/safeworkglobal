import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import AccessDenied from '@/pages/AccessDenied';
import { getEmitraReviewBlockMessage } from '@/lib/workerPortalAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  loginPath?: string;
  /** Workers must complete one-time mobile OTP before portal access (Google bind). */
  requireMobileVerified?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = '/auth',
  requireMobileVerified = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, role, loading, profileLoading, needsRoleSelection, isMobileVerified } =
    useAuth();
  const [emitraBlock, setEmitraBlock] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || role !== 'worker' || !user?.id) {
      setEmitraBlock(null);
      return;
    }
    setEmitraBlock(undefined);
    void getEmitraReviewBlockMessage(user.id).then((msg) => {
      if (!cancelled) setEmitraBlock(msg);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role, user?.id]);

  // Initial auth only. Do not unmount the app on later profile refreshes (tab focus).
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  // First load after sign-in: wait for role without flashing empty shells.
  if (profileLoading && !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated but no role yet (e.g. fresh Google sign-in) — send to
  // /auth so the role-select step can run before any dashboard renders.
  if (needsRoleSelection) {
    return <Navigate to="/auth" replace />;
  }

  // Strict role enforcement — wrong role gets a clear Access Denied page
  // with a button back to their own dashboard. Prevents Workers from
  // landing on Employer pages and vice versa.
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <AccessDenied />;
  }

  // Google (and any) workers without mobile_verified must bind + OTP once.
  if (
    requireMobileVerified &&
    role === 'worker' &&
    !profileLoading &&
    !isMobileVerified
  ) {
    return <Navigate to="/worker/bind-mobile" replace />;
  }

  if (role === 'worker' && emitraBlock === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (role === 'worker' && emitraBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4 text-center">
            <h1 className="text-lg font-semibold">Account under review</h1>
            <p className="text-sm text-muted-foreground">{emitraBlock}</p>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/worker/login';
              }}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
