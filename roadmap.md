
- [x] Replace and deploy `phone-verified-account` exactly as supplied; verify Active with JWT off.
- [x] Replace and deploy `worker-otp-login` exactly as supplied; verify Active with JWT off.
- [x] Fix the worker sign-in service boot failure and verify login requests reach the handler.
- [x] Restore production journey-step emails with a shared webhook secret, locked helpers, and a new-event test.
- [x] Deploy production signup email OTP function and verify signup endpoint; redeploy phone account function.
- [x] Restore the deleted production UAE public job catalog from the approved existing SQL files and verify counts/categories.
- [ ] Confirm inbox receipt and successful ticket verification for signup email OTP. Blocked: the requested Gmail address hard-bounced and is globally suppressed until 2026-10-22; a working recipient must supply the received code.
- [x] Fix expired Firebase SMS token reuse after the email OTP step and verify worker account creation reaches validation with a fresh token.

## SEO, Google Jobs & AI Search
- [ ] Technical SEO foundation, stable slugs, redirects, canonical host, and crawler rules.
- [ ] Complete public job pages with accurate structured data, status handling, and related jobs.
- [ ] Database-backed landing pages, public employers, resources, and internal linking.
- [ ] Dynamic sitemap architecture with accurate last-modified values.
- [ ] Admin SEO controls, health reporting, and privacy-conscious conversion analytics.
- [ ] Responsive, metadata, structured-data, route protection, and regression verification.

## Selected Security Findings
- [x] Fix only the six named permissive RLS findings and two named storage owner-binding findings; mark only those findings resolved.

## Admin Firebase Account Cleanup
- [ ] Release a user's Firebase phone identity before admin account deletion. Implementation complete; deployment awaits Firebase Admin credentials.
