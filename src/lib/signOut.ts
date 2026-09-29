/** Public marketing site — all roles land here after sign-out. */
export const PUBLIC_HOME_URL = 'https://safeworkglobal.com';

let signingOut = false;

/** True from the moment Logout is pressed until the public home loads. */
export function isSigningOut(): boolean {
  return signingOut;
}

export function markSigningOut(): void {
  signingOut = true;
}

export function redirectToPublicHome(): void {
  window.location.replace(PUBLIC_HOME_URL);
}
