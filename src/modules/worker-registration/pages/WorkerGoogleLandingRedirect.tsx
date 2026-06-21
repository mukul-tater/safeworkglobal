import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import {
  completeWorkerGoogleBridge,
  workerPathAfterGoogleBridge,
} from '../lib/completeWorkerGoogleBridge';

/** Legacy /worker/trust URL — bridge Google/Supabase worker auth into Phase-1 and open /home. */
export default function WorkerGoogleLandingRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();
  const { loginWithGoogle, isAuthenticated: isPhase1Worker } = useWorkerAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (isPhase1Worker) {
      navigate('/home', { replace: true });
      return;
    }

    if (!isAuthenticated || role !== 'worker') {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const bridgeResult = await completeWorkerGoogleBridge(loginWithGoogle);
      if (cancelled) return;
      navigate(workerPathAfterGoogleBridge(bridgeResult), { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    role,
    loading,
    profileLoading,
    isPhase1Worker,
    loginWithGoogle,
    navigate,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
