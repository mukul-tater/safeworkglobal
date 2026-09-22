# Restore Production Signup Verification

## Changes
- Confirm whether the existing signup email OTP migration is already active; apply it only if missing.
- Deploy the existing `signup-email-otp` function without changing its code or frontend behavior.
- Redeploy the existing `phone-verified-account` function unchanged.
- Verify the signup function answers preflight with 200 and POST requests no longer return `NOT_FOUND`.

## Guardrails
- No signup UI, copy, Firebase SMS, frontend request headers, or environment configuration changes.
- Keep JWT verification disabled as already configured.
