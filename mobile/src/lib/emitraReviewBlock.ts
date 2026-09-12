/**
 * eMitra workers created at a kiosk are login-ready after OTP.
 * Only a rejected review blocks the worker portal.
 */
export function emitraReviewBlockMessage(
  sourceType: string | null | undefined,
  reviewStatus: string | null | undefined,
): string | null {
  if (sourceType !== 'emitra') return null;
  if (reviewStatus === 'rejected') {
    return 'Your eMitra registration was not approved. Contact support or your partner centre.';
  }
  return null;
}
