import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getEmitraReviewBlockMessage,
  isWorkerReadyToApply,
} from '@/lib/workerPortalAccess';

interface WorkerJobAccess {
  loading: boolean;
  isWorker: boolean;
  /** Workers can always browse jobs. */
  canBrowseJobs: boolean;
  /** Apply after Essentials (Find jobs / Apply journey steps). */
  canApplyToJobs: boolean;
  onboardingPath: string;
  /** Set when eMitra review blocks portal use. */
  reviewBlockMessage: string | null;
}

/**
 * Job access for the Supabase worker portal.
 * Apply unlocks after Essentials so Test 1 can follow the applied job.
 */
export function useWorkerJobAccess(): WorkerJobAccess {
  const { isAuthenticated, role, user, profileLoading } = useAuth();
  const [canApplyToJobs, setCanApplyToJobs] = useState(false);
  const [reviewBlockMessage, setReviewBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isWorker = isAuthenticated && role === 'worker';
  const onboardingPath = '/worker/journey';

  useEffect(() => {
    if (profileLoading) return;

    if (!isWorker || !user) {
      setCanApplyToJobs(false);
      setReviewBlockMessage(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveAccess = async () => {
      try {
        const block = await getEmitraReviewBlockMessage(user.id);
        if (!cancelled) setReviewBlockMessage(block);
        if (block) {
          if (!cancelled) setCanApplyToJobs(false);
          return;
        }
        const ready = await isWorkerReadyToApply(user.id);
        if (!cancelled) setCanApplyToJobs(ready);
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
  }, [profileLoading, isWorker, user]);

  return {
    loading,
    isWorker,
    canBrowseJobs: true,
    canApplyToJobs: isWorker ? canApplyToJobs : false,
    onboardingPath,
    reviewBlockMessage,
  };
}
