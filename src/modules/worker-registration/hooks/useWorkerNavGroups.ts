import { useMemo } from 'react';
import { Lock, User } from 'lucide-react';
import type { NavGroup } from '@/components/layout/DashboardSidebar';
import { workerNavGroups } from '@/config/workerNav';
import { useWorkerJobAccess } from './useWorkerJobAccess';

const JOB_PATH_PREFIXES = ['/jobs', '/worker/saved-jobs', '/worker/saved-searches'];

function isJobNavPath(path: string): boolean {
  return JOB_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function useWorkerNavGroups(): { navGroups: NavGroup[]; loading: boolean } {
  const { loading, isWorker, canBrowseJobs, onboardingPath } = useWorkerJobAccess();

  const navGroups = useMemo(() => {
    if (!isWorker || canBrowseJobs) return workerNavGroups;

    return workerNavGroups
      .map((group) => {
        const hasJobItems = group.items.some((item) => isJobNavPath(item.path));
        if (!hasJobItems) return group;

        const nonJobItems = group.items.filter((item) => !isJobNavPath(item.path));
        return {
          ...group,
          items: [
            {
              path: onboardingPath,
              icon: Lock,
              label: 'Unlock job search',
            },
            ...nonJobItems,
          ],
        };
      })
      .filter((group) => group.items.length > 0);
  }, [isWorker, canBrowseJobs, onboardingPath]);

  return { navGroups, loading };
}

export function usePhase1WorkerNavItems(
  baseItems: NavGroup['items'],
  profileLabel: string,
): NavGroup['items'] {
  const { isWorker, canBrowseJobs, onboardingPath } = useWorkerJobAccess();

  return useMemo(() => {
    if (!isWorker || canBrowseJobs) return baseItems;

    return baseItems.map((item) => {
      if (item.path !== '/jobs') return item;
      return {
        path: onboardingPath,
        icon: User,
        label: profileLabel,
      };
    });
  }, [baseItems, isWorker, canBrowseJobs, onboardingPath, profileLabel]);
}
