#!/usr/bin/env node
/**
 * Phase 0 — reset Supabase platform data via service role + Admin API.
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/phase0-reset-platform-data.mjs
 *   node scripts/phase0-reset-platform-data.mjs --dry-run
 *   node scripts/phase0-reset-platform-data.mjs --sql-only
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const KEEP_ADMIN_EMAILS = new Set([
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com',
]);

/** Tables cleared in dependency order (children before parents). */
const TABLES_TO_CLEAR = [
  'onboarding_audit_logs',
  'worker_onboarding_languages',
  'worker_onboarding_preferences',
  'worker_onboarding_work_history',
  'worker_onboarding_certifications',
  'worker_onboarding_skills',
  'worker_onboarding_documents',
  'worker_onboarding_profile',
  'worker_onboarding',
  'partner_worker_status_history',
  'partner_worker_skill_tests',
  'partner_incentives',
  'partner_activities',
  'partner_worker_drafts',
  'partner_workers',
  'partner_profiles',
  'contract_versions',
  'application_status_history',
  'job_formalities',
  'interviews',
  'offers',
  'saved_jobs',
  'shortlisted_workers',
  'saved_searches',
  'job_applications',
  'job_skills',
  'jobs',
  'worker_training_enrollments',
  'training_courses',
  'worker_videos',
  'worker_documents',
  'worker_skills',
  'worker_certifications',
  'work_experience',
  'worker_profile_employer_info',
  'worker_profiles',
  'employer_company_info',
  'employer_profiles',
  'background_verifications',
  'payments',
  'disputes',
  'messages',
  'user_moderation',
  'content_flags',
  'compliance_checks',
  'notifications',
  'push_subscriptions',
  'contact_submissions',
  'admin_actions',
  'worker_portal_tokens',
  'worker_portal_otp',
  'worker_portal_users',
];

function loadEnv() {
  for (const file of ['.env', 'backend/.env']) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  }
}

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    sqlOnly: process.argv.includes('--sql-only'),
  };
}

async function deleteAllRows(supabase, table, dryRun) {
  const probe = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (probe.error) {
    if (/could not find|does not exist|schema cache/i.test(probe.error.message)) {
      console.log(`  skip ${table} (not in schema)`);
      return;
    }
    throw new Error(`${table}: ${probe.error.message}`);
  }

  const count = probe.count ?? 0;
  if (count === 0) {
    console.log(`  ${table}: already empty`);
    return;
  }

  if (dryRun) {
    console.log(`  ${table}: would delete ${count} row(s)`);
    return;
  }

  const attempts = [
    () => supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    () => supabase.from(table).delete().gte('id', 0),
    () => supabase.from(table).delete().gte('created_at', '1970-01-01T00:00:00Z'),
    () => supabase.from(table).delete().neq('mobile_number', '__phase0_impossible__'),
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const { error } = await attempt();
    if (!error) {
      console.log(`  ${table}: cleared ${count} row(s)`);
      return;
    }
    lastError = error;
  }

  throw new Error(`${table}: ${lastError?.message || 'delete failed'}`);
}

async function listAllAuthUsers(adminClient) {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }
  return users;
}

async function main() {
  loadEnv();
  const { dryRun, sqlOnly } = parseArgs();

  if (sqlOnly) {
    console.log(readFileSync('scripts/phase0-reset-platform-data.sql', 'utf8'));
    return;
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('Run the SQL manually: scripts/phase0-reset-platform-data.sql');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log(dryRun ? 'DRY RUN — no writes\n' : 'Phase 0 Supabase reset\n');
  console.log('Keeping admins:', [...KEEP_ADMIN_EMAILS].join(', '));
  console.log('\n1) Clearing domain tables…');

  for (const table of TABLES_TO_CLEAR) {
    await deleteAllRows(supabase, table, dryRun);
  }

  console.log('\n2) Removing non-admin auth users…');
  const users = await listAllAuthUsers(supabase);
  const toDelete = users.filter((u) => !KEEP_ADMIN_EMAILS.has((u.email || '').toLowerCase()));
  const kept = users.filter((u) => KEEP_ADMIN_EMAILS.has((u.email || '').toLowerCase()));

  console.log(`  Found ${users.length} user(s); keeping ${kept.length}, deleting ${toDelete.length}`);

  for (const user of toDelete) {
    if (dryRun) {
      console.log(`  would delete ${user.email}`);
      continue;
    }
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`delete ${user.email}: ${error.message}`);
    console.log(`  deleted ${user.email}`);
  }

  console.log('\n3) Ensuring admin roles on kept accounts…');
  for (const email of KEEP_ADMIN_EMAILS) {
    const match = kept.find((u) => (u.email || '').toLowerCase() === email);
    if (!match) {
      console.warn(`  WARN: ${email} not found — create the account in Supabase Auth first`);
      continue;
    }
    if (dryRun) {
      console.log(`  would assign admin → ${email}`);
      continue;
    }
    await supabase.from('user_roles').delete().eq('user_id', match.id);
    const { error } = await supabase.from('user_roles').insert({ user_id: match.id, role: 'admin' });
    if (error) throw new Error(`role ${email}: ${error.message}`);
    console.log(`  admin role → ${email}`);
  }

  if (!dryRun) {
    console.log('\n4) Resetting partner_reward_config defaults…');
    const { error } = await supabase.from('partner_reward_config').upsert({
      id: true,
      placement_reward_amount: 1000,
      worker_fee_amount: 35400,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn(`  partner_reward_config: ${error.message}`);
  }

  console.log('\nDone.');
  console.log('Also run admin whitelist SQL if triggers were not updated:');
  console.log('  scripts/phase0-reset-platform-data.sql (sections 5+) or scripts/fix-admin-login.sql');
  console.log('Then reset local worker API DB: npm run reset:phase0:backend');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
