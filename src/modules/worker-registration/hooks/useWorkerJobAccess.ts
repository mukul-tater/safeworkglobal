import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerApi } from '../services/workerApi';

interface WorkerJobAccess {
  loading: boolean;
  isWorker: boolean;
  canBrowseJobs: boolean;
  onboardingPath: string;
}

export function useWorkerJobAccess(): WorkerJobAccess {
  const { isAuthenticated, role, user, profileLoading } = useAuth();
  const { worker, token, isAuthenticated: isPhase1Worker, loading: workerAuthLoading } = useWorkerAuth();
  const [canBrowseJobs, setCanBrowseJobs] = useState(true);
  const [loading, setLoading] = useState(true);

  const isLegacyWorker = isAuthenticated && role === 'worker';
  const isWorker = isPhase1Worker || isLegacyWorker;
  const onboardingPath = isPhase1Worker ? '/onboarding' : '/worker/onboarding';

  useEffect(() => {
    if (profileLoading || workerAuthLoading) return;

    if (!isWorker) {
      setCanBrowseJobs(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveAccess = async () => {
      try {
        if (isPhase1Worker && worker) {
          if (worker.onboardingCompleted) {
            if (!cancelled) setCanBrowseJobs(true);
            return;
          }
          if (token) {
            const onboarding = await workerApi.getOnboarding(token);
            if (!cancelled) setCanBrowseJobs(onboarding.canBrowseJobs);
            return;
          }
          if (!cancelled) setCanBrowseJobs(false);
          return;
        }

        if (isLegacyWorker && user) {
          const { data } = await supabase
            .from('worker_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!cancelled) setCanBrowseJobs(Boolean(data?.onboarding_completed));
        }
      } catch {
        if (!cancelled) setCanBrowseJobs(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [
    profileLoading,
    workerAuthLoading,
    isWorker,
    isPhase1Worker,
    isLegacyWorker,
    worker,
    token,
    user,
  ]);

  return { loading, isWorker, canBrowseJobs, onboardingPath };
}
