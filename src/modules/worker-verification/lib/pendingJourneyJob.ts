const STORAGE_KEY = 'swg_pending_journey_job';

export type PendingJourneyJob = {
  jobId: string;
  slug: string;
  title: string;
};

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined';
}

export function setPendingJourneyJob(job: PendingJourneyJob): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
}

export function getPendingJourneyJob(): PendingJourneyJob | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingJourneyJob;
    if (!parsed?.jobId || !parsed?.slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingJourneyJob(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function workerPathAfterAuth(gccReady: boolean): string {
  if (getPendingJourneyJob()) return '/worker/journey';
  return gccReady ? '/worker/dashboard' : '/worker/journey';
}
