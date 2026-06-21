#!/usr/bin/env node
/**
 * Phase 0 — wipe Phase-1 worker API data (SQLite) while keeping reference data
 * (states, districts, skills catalog).
 *
 * Usage:
 *   node scripts/phase0-reset-backend-workers.mjs
 *   node scripts/phase0-reset-backend-workers.mjs --dry-run
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../backend');
const dbPath = path.join(backendRoot, 'data/workers.db');

let Database;
try {
  Database = require(path.join(backendRoot, 'node_modules/better-sqlite3'));
} catch {
  console.error('Install backend dependencies first: npm install --prefix backend');
  process.exit(1);
}

const WORKER_TABLES = [
  'worker_job_applications',
  'worker_skill_proofs',
  'worker_onboarding',
  'workers',
];

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
}

function main() {
  const { dryRun } = parseArgs();

  if (!fs.existsSync(dbPath)) {
    console.log(`No worker DB at ${dbPath} — nothing to reset.`);
    return;
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  console.log(dryRun ? 'DRY RUN — backend worker reset\n' : 'Resetting backend worker data…\n');

  for (const table of WORKER_TABLES) {
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    if (!exists) {
      console.log(`  skip ${table} (missing)`);
      continue;
    }

    const { count } = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
    if (dryRun) {
      console.log(`  ${table}: would delete ${count} row(s)`);
      continue;
    }

    db.prepare(`DELETE FROM ${table}`).run();
    console.log(`  ${table}: deleted ${count} row(s)`);
  }

  if (!dryRun) {
    db.exec('VACUUM');
  }

  db.close();
  console.log('\nDone. Reference data (states, districts, skills) preserved.');
}

main();
