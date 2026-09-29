# Project Architecture Rules

- Admin user deletion must release the target's Firebase phone identity server-side before removing storage or database records, so failed Firebase cleanup cannot leave a partially deleted account.