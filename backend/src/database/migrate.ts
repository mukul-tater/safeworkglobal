import { db } from './db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runMigrations(): void {
  let workerColumns = db.prepare('PRAGMA table_info(workers)').all() as { name: string }[];

  if (workerColumns.length > 0 && !workerColumns.some((c) => c.name === 'email')) {
    db.exec('ALTER TABLE workers ADD COLUMN email TEXT');
    db.exec(
      "UPDATE workers SET email = 'worker' || id || '@workers.safeworkglobal.app' WHERE email IS NULL OR email = ''"
    );
    workerColumns = db.prepare('PRAGMA table_info(workers)').all() as { name: string }[];
  }

  if (workerColumns.some((c) => c.name === 'email')) {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_email ON workers(email)');
  }

  if (workerColumns.length > 0 && !workerColumns.some((c) => c.name === 'mobile_verified')) {
    db.exec('ALTER TABLE workers ADD COLUMN mobile_verified INTEGER NOT NULL DEFAULT 0');
  }

  const onboardingExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='worker_onboarding'")
    .get();

  if (!onboardingExists) {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const onboardingBlock = schema.split('CREATE TABLE IF NOT EXISTS worker_onboarding')[1];
    if (onboardingBlock) {
      const sql =
        'CREATE TABLE IF NOT EXISTS worker_onboarding' +
        onboardingBlock.split('CREATE INDEX IF NOT EXISTS idx_worker_onboarding_worker')[0];
      db.exec(sql);
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_worker_onboarding_worker ON worker_onboarding(worker_id)'
      );
    }
  }

  const onboardingColumns = db.prepare('PRAGMA table_info(worker_onboarding)').all() as { name: string }[];
  const onboardingColNames = new Set(onboardingColumns.map((c) => c.name));
  if (onboardingColumns.length > 0) {
    if (!onboardingColNames.has('education_level')) {
      db.exec('ALTER TABLE worker_onboarding ADD COLUMN education_level TEXT');
    }
    if (!onboardingColNames.has('preferred_gcc_country')) {
      db.exec('ALTER TABLE worker_onboarding ADD COLUMN preferred_gcc_country TEXT');
    }
    if (!onboardingColNames.has('preferred_gcc_city')) {
      db.exec('ALTER TABLE worker_onboarding ADD COLUMN preferred_gcc_city TEXT');
    }
    if (!onboardingColNames.has('onboarding_stage')) {
      db.exec(
        "ALTER TABLE worker_onboarding ADD COLUMN onboarding_stage TEXT NOT NULL DEFAULT 'REGISTERED'"
      );
    }
  }

  const skillProofsExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='worker_skill_proofs'")
    .get();
  if (!skillProofsExists) {
    db.exec(`
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
    `);
  }
}
