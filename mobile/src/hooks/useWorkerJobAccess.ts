import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmitraReviewBlockMessage, isWorkerGccReady } from '../lib/workerPortalAccess';

export function useWorkerJobAccess() {
  const { isAuthenticated, role, user, profileLoading } = useAuth();
  const [canApplyToJobs, setCanApplyToJobs] = useState(false);
  const [reviewBlockMessage, setReviewBlockMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isWorker = isAuthenticated && role === 'worker';

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
        const ready = await isWorkerGccReady(user.id);
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
    reviewBlockMessage,
  };
}
