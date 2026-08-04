# Fix "redirect_uri is not allowed" on Google sign-in

## What is happening

The Lovable OAuth broker (`oauth.lovable.app`) only accepts the app's **origin** as a redirect target. Every Google sign-in call in the app passes a path instead:

```text
redirect_uri = https://safeworkglobal.com/auth   -> rejected (invalid_request)
redirect_uri = https://safeworkglobal.com        -> allowed
```

Confirmed call sites passing `${window.location.origin}/auth`:
- `src/lib/googleAuth.ts` (default value)
- `src/pages/Auth.tsx`
- `src/pages/employer/EmployerLoginPage.tsx`
- `src/pages/employer/QuickEmployerSignup.tsx`
- `src/modules/worker-registration/components/GoogleAuthButton.tsx`

So this is not a Google or provider configuration problem — it is the redirect value the app sends.

## The fix

1. Send only the origin to the broker: `redirect_uri: window.location.origin` in `googleAuth.ts` and in each of the four call sites (drop the `/auth` suffix).
2. Keep the intended destination separately: before starting OAuth, store the same-origin path (`/auth`) in `sessionStorage` alongside the already-stored `pending_oauth_role`.
3. On landing back at `/`, once the session is hydrated, read that stored path, validate it is a relative same-origin path, clear it, and navigate there. The existing `/auth` logic then does role assignment and the role-based dashboard redirect exactly as today.

## Technical notes

- The post-OAuth handoff lives in one small helper (set/consume pending redirect) used by `googleAuth.ts` and the landing route, so no page duplicates the logic.
- Redirect consumption happens only after `supabase.auth.getSession()` / `onAuthStateChange` reports a session, never before, to avoid bouncing an unauthenticated user into a guarded route.
- Email/password login and partner/eMitra flows are untouched.