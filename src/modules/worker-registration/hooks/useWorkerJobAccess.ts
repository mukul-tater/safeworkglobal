import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerApi } from '../services/workerApi';

interface WorkerJobAccess {
  loading: boolean;
  isWorker: boolean;
  /** Workers can always browse jobs. */
  canBrowseJobs: boolean;
  /** Apply / show interest requires a completed profile. */
  canApplyToJobs: boolean;
  onboardingPath: string;
}

export function useWorkerJobAccess(): WorkerJobAccess {
  const { isAuthenticated, role, user, profileLoading } = useAuth();
  const { worker, token, isAuthenticated: isPhase1Worker, loading: workerAuthLoading } = useWorkerAuth();
  const [canApplyToJobs, setCanApplyToJobs] = useState(false);
  const [loading, setLoading] = useState(true);

  const isLegacyWorker = isAuthenticated && role === 'worker';
  const isWorker = isPhase1Worker || isLegacyWorker;
  const onboardingPath = isPhase1Worker ? '/onboarding' : '/worker/journey';

  useEffect(() => {
    if (profileLoading || workerAuthLoading) return;

    if (!isWorker) {
      setCanApplyToJobs(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveAccess = async () => {
      try {
        if (isPhase1Worker && worker) {
          if (worker.onboardingCompleted) {
            if (!cancelled) setCanApplyToJobs(true);
            return;
          }
          if (token) {
            const onboarding = await workerApi.getOnboarding(token);
            if (!cancelled) setCanApplyToJobs(Boolean(onboarding.canApplyToJobs));
            return;
          }
          if (!cancelled) setCanApplyToJobs(false);
          return;
        }

        if (isLegacyWorker && user) {
          const [{ data: profileRow }, { count: docCount }] = await Promise.all([
            supabase
              .from('worker_profiles')
              .select('onboarding_completed')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('worker_documents')
              .select('id', { count: 'exact', head: true })
              .eq('worker_id', user.id),
          ]);

          const complete =
            Boolean(profileRow?.onboarding_completed) ||
            (Boolean(user.user_metadata?.full_name || user.email) && (docCount ?? 0) > 0);

          if (!cancelled) setCanApplyToJobs(complete);
        }
      } catch {
        if (!cancelled) setCanApplyToJobs(false);
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

  return {
    loading,
    isWorker,
    canBrowseJobs: true,
    canApplyToJobs: isWorker ? canApplyToJobs : false,
    onboardingPath,
  };
}
