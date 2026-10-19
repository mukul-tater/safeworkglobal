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

const PAY_RETURN_KEY = 'swg_pay_return';

/** After sign-in, come back to the public payments page. */
export function rememberPaymentsReturn(): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(PAY_RETURN_KEY, '/payments');
}

function takePaymentsReturn(): string | null {
  if (!canUseStorage()) return null;
  const value = sessionStorage.getItem(PAY_RETURN_KEY);
  if (value !== '/payments') return null;
  sessionStorage.removeItem(PAY_RETURN_KEY);
  return value;
}

export function workerPathAfterAuth(gccReady: boolean): string {
  if (getPendingJourneyJob()) return '/worker/journey';
  const payments = takePaymentsReturn();
  if (payments) return payments;
  return gccReady ? '/worker/dashboard' : '/worker/journey';
}
