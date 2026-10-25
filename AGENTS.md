# Project Architecture Rules
- Admin job applicant groups share a validated configuration field saved by the existing admin job RPCs; unspecified jobs remain unset and application eligibility is unchanged.
- Search brand metadata is centralized in the SEO constants with matching crawlable homepage WebSite data, so page titles and search site-name signals stay consistent.
- Worker profile forms and exports omit expected-pay fields while preserving historical stored values, so profile edits cannot erase old records.

- Admin user deletion must release the target's Firebase phone identity server-side before removing storage or database records, so failed Firebase cleanup cannot leave a partially deleted account.
- Signup identity checks must run through service-role functions with explicit RPC arguments and safe client errors, so browser clients cannot access cross-account uniqueness queries.
- Firebase SMS send failures must clear only the verifier and preserve pending confirmation; redirect-only sends must reject, so callers advance only after an SMS session exists.
- Assessment checkout must price the journey job server-side and persist the charged total; verification and recovery must use that stored total, never recompute from mutable job prices or default charges.
- Find Jobs resolves specific UAE trade keys independently of broad stored SEO/admin categories, so category backfills cannot make active listings unreachable.
- Journey email trade labels prefer the applied job title over the stored quiz skill bucket, so stage and assessment emails cannot misrepresent the selected job.
- New-account emails are triggered after committed role assignment through a secret-protected feature function with account-based idempotency, so every signup path is covered without altering authentication or replaying existing accounts; never add email queues or email-state tables.