import type { JobPostAutoSaveData } from '@/lib/autoSaveJobs';

export interface PostJobDraftCache {
  jobId: string | null;
  data: JobPostAutoSaveData;
  updatedAt: number;
}

const STORAGE_PREFIX = 'safework:post-job-draft:';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readPostJobDraftCache(userId: string): PostJobDraftCache | null {
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as PostJobDraftCache;
  } catch {
    return null;
  }
}

export function writePostJobDraftCache(userId: string, cache: PostJobDraftCache) {
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(cache));
  } catch {
    // sessionStorage may be unavailable or full — server draft still applies
  }
}

export function clearPostJobDraftCache(userId: string) {
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
