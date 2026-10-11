# Project Architecture Rules

- Admin user deletion must release the target's Firebase phone identity server-side before removing storage or database records, so failed Firebase cleanup cannot leave a partially deleted account.
- Signup identity checks must run through service-role functions with explicit RPC arguments and safe client errors, so browser clients cannot access cross-account uniqueness queries.
- Firebase SMS send failures must clear only the verifier and preserve pending confirmation; redirect-only sends must reject, so callers advance only after an SMS session exists.