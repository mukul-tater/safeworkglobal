import { useLocation } from 'react-router-dom';
import { useWorkerAuth } from '../context/WorkerAuthContext';

const WORKER_PATHS = ['/', '/worker-start', '/register', '/login', '/home', '/onboarding'];

const EMITRA_PREFIX = '/emitra';
const PARTNER_PREFIX = '/partner';

function isWorkerJobsRoute(pathname: string, isPhase1Worker: boolean): boolean {
  return isPhase1Worker && (pathname === '/jobs' || pathname.startsWith('/jobs/'));
}

/** Routes that use the new worker / E-Mitra shell (no legacy platform chrome). */
export function useIsActiveModuleRoute(): boolean {
  const { pathname } = useLocation();
  const { isAuthenticated: isPhase1Worker } = useWorkerAuth();

  return (
    WORKER_PATHS.includes(pathname) ||
    isWorkerJobsRoute(pathname, isPhase1Worker) ||
    pathname.startsWith(EMITRA_PREFIX) ||
    pathname.startsWith(PARTNER_PREFIX)
  );
}

/** @deprecated Use useIsActiveModuleRoute */
export function useIsWorkerRegistrationRoute(): boolean {
  return useIsActiveModuleRoute();
}
