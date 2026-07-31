import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerAuth } from '../context/WorkerAuthContext';
import { workerApi } from '../services/workerApi';
import {
  getEmitraReviewBlockMessage,
  isWorkerGccReady,
} from '@/lib/workerPortalAccess';

interface WorkerJobAccess {
  loading: boolean;
  isWorker: boolean;
  /** Workers can always browse jobs. */
  canBrowseJobs: boolean;
  /** Apply / show interest requires GCC-ready verification. */
  canApplyToJobs: boolean;
  onboardingPath: string;
  /** Set when eMitra review blocks portal use. */
  reviewBlockMessage: string | null;
}

export function useWorkerJobAccess(): WorkerJobAccess {
  const { isAuthenticated, role, user, profileLoading } = useAuth();
  const { worker, token, isAuthenticated: isPhase1Worker, loading: workerAuthLoading } = useWorkerAuth();
  const [canApplyToJobs, setCanApplyToJobs] = useState(false);
  const [reviewBlockMessage, setReviewBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLegacyWorker = isAuthenticated && role === 'worker';
  const isWorker = isPhase1Worker || isLegacyWorker;
  const onboardingPath = '/worker/journey';

  useEffect(() => {
    if (profileLoading || workerAuthLoading) return;

    if (!isWorker) {
      setCanApplyToJobs(false);
      setReviewBlockMessage(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveAccess = async () => {
      try {
        if (isLegacyWorker && user) {
          const block = await getEmitraReviewBlockMessage(user.id);
          if (!cancelled) setReviewBlockMessage(block);
          if (block) {
            if (!cancelled) setCanApplyToJobs(false);
            return;
          }
          const ready = await isWorkerGccReady(user.id);
          if (!cancelled) setCanApplyToJobs(ready);
          return;
        }

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
        }
      } catch {
        if (!cancelled) {
          setCanApplyToJobs(false);
          setReviewBlockMessage(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    void resolveAccess();

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
    reviewBlockMessage,
  };
}
