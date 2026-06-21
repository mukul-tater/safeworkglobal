/** Public marketing site — all roles land here after sign-out. */
export const PUBLIC_HOME_URL = 'https://safeworkglobal.com';

export function redirectToPublicHome(): void {
  window.location.replace(PUBLIC_HOME_URL);
}
