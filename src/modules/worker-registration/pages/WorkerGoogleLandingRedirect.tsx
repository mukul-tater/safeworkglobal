import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateVerification } from '@/modules/worker-verification/services/verificationService';

/** Legacy /worker/trust — send workers into GCC journey or dashboard. */
export default function WorkerGoogleLandingRedirect() {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, loading, profileLoading, isMobileVerified } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    (async () => {
      if (isAuthenticated && role === 'worker') {
        if (!isMobileVerified) {
          navigate('/worker/bind-mobile', { replace: true });
          return;
        }
        try {
          if (user?.id) {
            const v = await getOrCreateVerification(user.id);
            if (v.stage !== 'gcc_ready') {
              navigate('/worker/journey', { replace: true });
              return;
            }
          }
        } catch {
          navigate('/worker/journey', { replace: true });
          return;
        }
        navigate('/worker/dashboard', { replace: true });
        return;
      }

      navigate('/worker/login', { replace: true });
    })();
  }, [isAuthenticated, role, loading, profileLoading, isMobileVerified, user?.id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
