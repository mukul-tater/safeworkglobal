# Project Architecture Rules

- Admin user deletion must release the target's Firebase phone identity server-side before removing storage or database records, so failed Firebase cleanup cannot leave a partially deleted account.
- Signup identity checks must run through service-role functions with explicit RPC arguments and safe client errors, so browser clients cannot access cross-account uniqueness queries.