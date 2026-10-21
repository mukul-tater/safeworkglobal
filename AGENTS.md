# Project Architecture Rules

- Admin user deletion must release the target's Firebase phone identity server-side before removing storage or database records, so failed Firebase cleanup cannot leave a partially deleted account.
- Signup identity checks must run through service-role functions with explicit RPC arguments and safe client errors, so browser clients cannot access cross-account uniqueness queries.
- Firebase SMS send failures must clear only the verifier and preserve pending confirmation; redirect-only sends must reject, so callers advance only after an SMS session exists.
- Assessment checkout must price the journey job server-side and persist the charged total; verification and recovery must use that stored total, never recompute from mutable job prices or default charges.
- Find Jobs resolves specific UAE trade keys independently of broad stored SEO/admin categories, so category backfills cannot make active listings unreachable.