import { useLocation } from 'react-router-dom';

const EMITRA_PREFIX = '/emitra';
const PARTNER_PREFIX = '/partner';

/** Routes that use the E-Mitra / partner shell (no legacy platform chrome). */
export function useIsActiveModuleRoute(): boolean {
  const { pathname } = useLocation();

  return pathname.startsWith(EMITRA_PREFIX) || pathname.startsWith(PARTNER_PREFIX);
}

/** @deprecated Use useIsActiveModuleRoute */
export function useIsWorkerRegistrationRoute(): boolean {
  return useIsActiveModuleRoute();
}
