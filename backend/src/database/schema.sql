CREATE TABLE IF NOT EXISTS states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (state_id) REFERENCES states(id),
  UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  aadhaar_number TEXT NOT NULL,
  state_id INTEGER NOT NULL,
  district_id INTEGER NOT NULL,
  primary_skill_id INTEGER NOT NULL,
  experience_level TEXT NOT NULL,
  profile_completion_percentage INTEGER NOT NULL DEFAULT 20,
  mobile_verified INTEGER NOT NULL DEFAULT 0,
  registration_source TEXT NOT NULL DEFAULT 'WEB',
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (state_id) REFERENCES states(id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (primary_skill_id) REFERENCES skills(id)
);

CREATE INDEX IF NOT EXISTS idx_workers_mobile ON workers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);

CREATE TABLE IF NOT EXISTS worker_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL UNIQUE,
  date_of_birth TEXT,
  gender TEXT,
  email TEXT,
  address TEXT,
  pincode TEXT,
  secondary_skill_ids TEXT,
  previous_employer TEXT,
  has_passport INTEGER NOT NULL DEFAULT 0,
  passport_number TEXT,
  ecr_status TEXT,
  preferred_countries TEXT,
  availability TEXT,
  open_to_relocation INTEGER NOT NULL DEFAULT 1,
  expected_salary_min REAL,
  expected_salary_currency TEXT DEFAULT 'INR',
  languages TEXT,
  education_level TEXT,
  preferred_gcc_country TEXT,
  preferred_gcc_city TEXT,
  onboarding_stage TEXT NOT NULL DEFAULT 'REGISTERED',
  current_step INTEGER NOT NULL DEFAULT 1,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_onboarding_worker ON worker_onboarding(worker_id);

CREATE TABLE IF NOT EXISTS worker_skill_proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  experience_years REAL,
  photo_paths TEXT NOT NULL DEFAULT '[]',
  video_paths TEXT NOT NULL DEFAULT '[]',
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (worker_id) REFERENCES workers(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id),
  UNIQUE(worker_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_worker_skill_proofs_worker ON worker_skill_proofs(worker_id);

CREATE TABLE IF NOT EXISTS worker_job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  job_id TEXT NOT NULL,
  employer_id TEXT NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (worker_id) REFERENCES workers(id),
  UNIQUE(worker_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_worker_job_applications_worker ON worker_job_applications(worker_id);
