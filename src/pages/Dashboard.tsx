import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user, role, isAuthenticated, loading, profileLoading, needsRoleSelection } = useAuth();
  const navigate = useNavigate();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    // Still loading auth — wait
    if (loading) return;

    // Not logged in → go to auth
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    // Authenticated but no role assigned (e.g. fresh Google sign-in) — send
    // them to the auth page to pick a role. Auth.tsx handles role-select for
    // already-authenticated users.
    if (needsRoleSelection) {
      navigate("/auth", { replace: true });
      return;
    }

    // Profile/role still loading — wait.
    if (profileLoading || !role) return;

    let cancelled = false;

    const go = (path: string) => {
      if (!cancelled) navigate(path, { replace: true });
    };

    switch (role) {
      case 'admin':
        go("/admin/dashboard");
        break;
      case 'partner':
        (async () => {
          try {
            const { data } = await supabase
              .from('partner_profiles')
              .select('status,submitted_at')
              .eq('user_id', user?.id || '')
              .maybeSingle();
            const submitted = !!data?.submitted_at;
            go(submitted ? "/emitra/dashboard" : "/emitra/register");
          } catch (err) {
            console.error('Partner status check failed:', err);
            go("/partner/onboarding");
          }
        })();
        break;
      case 'employer':
        (async () => {
          try {
            const { data } = await supabase
              .from('employer_profiles')
              .select('onboarding_completed')
              .eq('user_id', user?.id || '')
              .maybeSingle();
            go(data?.onboarding_completed ? "/employer/dashboard" : "/employer/onboarding");
          } catch (err) {
            console.error('Employer onboarding check failed:', err);
            go("/employer/dashboard");
          }
        })();
        break;
      case 'worker':
        go('/home');
        break;
      default:
        go("/");
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role, loading, profileLoading, needsRoleSelection, navigate, user]);

  // Safety net: if we're stuck on this page for >5s, show a recovery action
  useEffect(() => {
    const t = setTimeout(() => setStuck(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-sm px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">
          {loading ? "Loading..." : "Taking you to your dashboard..."}
        </p>
        {stuck && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Taking longer than expected.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Reload
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="text-sm text-primary hover:underline"
              >
                Go home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
