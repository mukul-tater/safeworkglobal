#!/usr/bin/env node
/**
 * Create an approved E-Mitra partner auth user (same pattern as create-admin.mjs).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env so the account is email-confirmed,
 * has the partner role, and can sign in at /emitra/login without waiting for review.
 *
 * Usage:
 *   node scripts/create-emitra.mjs
 *   node scripts/create-emitra.mjs --email emitra@safeworkglobal.com --password 'YourPass123!'
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function loadEnv() {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  } catch {
    /* no .env */
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let email = 'emitra@safeworkglobal.com';
  let password = `SwgEmitra!${randomBytes(4).toString('hex')}`;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[++i].toLowerCase();
    if (args[i] === '--password' && args[i + 1]) password = args[++i];
  }
  return { email, password };
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const { email, password } = parseArgs();
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const ownerName = 'Kailash eMitra';
const centerName = 'SafeWork Jaipur eMitra';
const mobile = '9876500123';
const emitraId = 'SWG-EMITRA-KAILASH';

async function fail(step, error) {
  console.error(`${step}:`, error?.message || error);
  process.exit(1);
}

let userId = null;
const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) await fail('List users', listError);

const existing = (listed?.users || []).find((u) => (u.email || '').toLowerCase() === email);

if (existing) {
  userId = existing.id;
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existing.user_metadata || {}),
      full_name: ownerName,
      phone: mobile,
      role: 'partner',
      mobile_verified: true,
    },
  });
  if (updateError) await fail('Update existing user', updateError);
  console.log('Updated existing auth user:', email);
} else {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: ownerName,
      phone: mobile,
      role: 'partner',
      mobile_verified: true,
    },
  });
  if (createError) await fail('Create auth user', createError);
  userId = created.user.id;
  console.log('Created auth user:', email);
}

const { error: roleError } = await admin.from('user_roles').upsert(
  { user_id: userId, role: 'partner' },
  { onConflict: 'user_id,role' },
);
if (roleError) await fail('Assign partner role', roleError);

const { error: profileError } = await admin.from('profiles').upsert(
  {
    id: userId,
    email,
    full_name: ownerName,
    phone: mobile,
    mobile_verified: true,
  },
  { onConflict: 'id' },
);
if (profileError) await fail('Upsert profile', profileError);

const now = new Date().toISOString();
const partnerProfileRow = {
  user_id: userId,
  owner_name: ownerName,
  center_name: centerName,
  mobile,
  whatsapp: mobile,
  email,
  emitra_id: emitraId,
  village_city: 'Jaipur',
  district: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302001',
  address: 'SafeWork eMitra Centre, Jaipur',
  has_computer: true,
  has_scanner: true,
  has_printer: true,
  has_internet: true,
  worker_categories: ['Electrician', 'Plumber', 'Welder', 'Helper'],
  years_in_operation: 3,
  account_holder: ownerName,
  status: 'approved',
  tier: 'bronze',
  mobile_verified: true,
  accepted_terms: true,
  accepted_privacy: true,
  confirmed_accuracy: true,
  no_jobs_promise: true,
  no_unauthorized_fees: true,
  current_step: 6,
  submitted_at: now,
  approved_at: now,
  compliance_acknowledged_at: now,
};

const { data: existingPp, error: ppFetchError } = await admin
  .from('partner_profiles')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle();
if (ppFetchError) await fail('Fetch partner_profiles', ppFetchError);

if (existingPp) {
  const { error } = await admin.from('partner_profiles').update(partnerProfileRow).eq('user_id', userId);
  if (error) await fail('Update partner_profiles', error);
} else {
  const { error } = await admin.from('partner_profiles').insert(partnerProfileRow);
  if (error) await fail('Insert partner_profiles', error);
}

const { data: senType, error: typeError } = await admin
  .from('partner_types')
  .select('id')
  .eq('code', 'SEN')
  .maybeSingle();
if (typeError) await fail('Fetch SEN partner type', typeError);
if (!senType?.id) await fail('SEN partner type', 'partner_types row with code SEN is missing');

const { data: existingOrg, error: orgFetchError } = await admin
  .from('partners')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle();
if (orgFetchError) await fail('Fetch partners org', orgFetchError);

let partnerOrgId = existingOrg?.id || null;
if (partnerOrgId) {
  const { error } = await admin
    .from('partners')
    .update({
      partner_type_id: senType.id,
      status: 'approved',
      verification_status: 'verified',
      state: 'Rajasthan',
      district: 'Jaipur',
      city: 'Jaipur',
      approved_at: now,
    })
    .eq('id', partnerOrgId);
  if (error) await fail('Update partners org', error);
} else {
  const { data: insertedOrg, error } = await admin
    .from('partners')
    .insert({
      user_id: userId,
      partner_type_id: senType.id,
      status: 'approved',
      verification_status: 'verified',
      state: 'Rajasthan',
      district: 'Jaipur',
      city: 'Jaipur',
      approved_at: now,
    })
    .select('id')
    .single();
  if (error) await fail('Insert partners org', error);
  partnerOrgId = insertedOrg.id;
}

const { error: extError } = await admin.from('partner_profiles_ext').upsert(
  {
    partner_id: partnerOrgId,
    company_name: centerName,
    owner_name: ownerName,
    mobile,
    email,
  },
  { onConflict: 'partner_id' },
);
if (extError) await fail('Upsert partner_profiles_ext', extError);

const { data: wallet, error: walletFetchError } = await admin
  .from('partner_wallets')
  .select('id')
  .eq('partner_id', partnerOrgId)
  .maybeSingle();
if (walletFetchError) await fail('Fetch partner_wallets', walletFetchError);
if (!wallet) {
  const { error } = await admin.from('partner_wallets').insert({
    partner_id: partnerOrgId,
    available_balance: 0,
  });
  if (error) await fail('Insert partner_wallets', error);
}

const { error: loginError } = await admin.auth.signInWithPassword({ email, password });
if (loginError) await fail('Verify password login', loginError);

console.log('\n--- E-Mitra credentials ---');
console.log('Email:   ', email);
console.log('Password:', password);
console.log('Login:   ', 'http://localhost:8080/emitra/login');
console.log('Status:  ', 'approved (compliance already acknowledged)');
