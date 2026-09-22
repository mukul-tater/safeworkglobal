
- [x] Replace and deploy `phone-verified-account` exactly as supplied; verify Active with JWT off.
- [x] Replace and deploy `worker-otp-login` exactly as supplied; verify Active with JWT off.
- [x] Fix the worker sign-in service boot failure and verify login requests reach the handler.
- [x] Restore production journey-step emails with a shared webhook secret, locked helpers, and a new-event test.
- [x] Deploy production signup email OTP function and verify signup endpoint; redeploy phone account function.
- [x] Restore the deleted production UAE public job catalog from the approved existing SQL files and verify counts/categories.
- [ ] Confirm inbox receipt and successful ticket verification for signup email OTP. Blocked: the requested Gmail address hard-bounced and is globally suppressed until 2026-10-22; a working recipient must supply the received code.
