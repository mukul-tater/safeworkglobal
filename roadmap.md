
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
- [x] Release a user's Firebase phone identity before admin account deletion, with Firebase Admin credentials stored securely and the protected function deployed.

## Signup Email Identity Check
- [x] Restore the existing unique-signup migration, match RPC arguments, reload the schema cache, and verify service-only access and safe signup errors.

## SMS Session Recovery
- [x] Preserve pending SMS confirmation on resend failure, reject redirect-only sends, audit all web callers, and verify recovery behavior with simulated Firebase responses and the worker login page.

## Razorpay Saved Job Service Charge
- [x] Enforce saved job charges plus the configured Razorpay percentage, reject missing amounts, preserve service-only completion, deploy and test pricing and recovery (mocked orders; no real payment charged).

## Find Jobs Catalog
- [x] Remove Filters from Find Jobs on desktop and phones.
- [x] Audit missing Dubai listings and previous category changes; correct confirmed browsing defects and verify all 20 UAE trade choices against live data on phone and desktop (20 UAE records, including 12 Dubai; no records changed).

## Journey Email Trade Labels
- [x] Confirm the reported worker's application/job linkage; unify journey email trade labels, test the Helper regression (2 passing tests), and deploy the correction without replaying old emails.

## Onboarding Emails
- [x] Add and deploy new-account welcome emails and an admin notification per signup, preserving OTP/journey flows; recipient rules passed tests, live preflight returned 200, unauthorized sends returned 401, and helpers remain service-only.
- [ ] Confirm both onboarding emails arrive after a real new signup. Blocked: no new account has registered since activation; inbox receipt cannot be verified without a new signup and recipient confirmation.
