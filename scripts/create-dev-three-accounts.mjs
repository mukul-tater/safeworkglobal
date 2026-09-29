#!/usr/bin/env node
/**
 * Dev-only: three separate logins for one handset.
 * Sign in on localhost with mobile 9876543210 and password SwgDev1234.
 *
 *   node scripts/create-dev-three-accounts.mjs
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env to mark mobile verified and approve partners.
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SIGN_IN_MOBILE = '9876543210';
const PASSWORD = 'SwgDev1234';

const ACCOUNTS = [
  {
    portal: 'worker',
    role: 'worker',
    email: 'm9876543210@workers.safeworkglobal.app',
    phone: '9876543210',
    fullName: 'Dev Worker',
  },
  {
    portal: 'emitra',
    role: 'partner',
    email: 'dev.emitra.9876543210@partners.safeworkglobal.app',
    phone: '6876543210',
    fullName: 'Dev E-Mitra',
    centerName: 'Dev E-Mitra Centre',
    emitraId: 'DEV-EMITRA-001',
    typeCode: 'SEN',
  },
  {
    portal: 'ssvn',
    role: 'partner',
    email: 'dev.ssvn.9876543210@partners.safeworkglobal.app',
    phone: '7876543210',
    fullName: 'Dev Trade Test Centre',
    centerName: 'Dev Trade Test Centre',
    typeCode: 'SSVN',
  },
];

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

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function fail(step, error) {
  console.error(`${step}:`, error?.message || error);
  process.exit(1);
}

async function ensureAuthUser(account) {
  if (!admin) {
    const { data, error } = await anon.auth.signUp({
      email: account.email,
      password: PASSWORD,
      options: {
        data: {
          full_name: account.fullName,
          phone: account.phone,
          role: account.role,
          mobile_verified: true,
        },
      },
    });
    if (error && !/already registered|already exists/i.test(error.message)) {
      fail(`Sign up ${account.portal}`, error);
    }
    if (error) console.log(`${account.portal}: auth user already exists`);
    else console.log(`${account.portal}: signed up ${account.email}`);
    return data?.user?.id || null;
  }

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) fail(`List users (${account.portal})`, listError);
  const existing = (listed?.users || []).find((u) => (u.email || '').toLowerCase() === account.email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: account.fullName,
        phone: account.phone,
        role: account.role,
        mobile_verified: true,
      },
    });
    if (error) fail(`Update ${account.portal}`, error);
    console.log(`${account.portal}: updated ${account.email}`);
    return existing.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      phone: account.phone,
      role: account.role,
      mobile_verified: true,
    },
  });
  if (error) fail(`Create ${account.portal}`, error);
  console.log(`${account.portal}: created ${account.email}`);
  return created.user.id;
}

async function finishWithAdmin(account, userId) {
  const { error: roleError } = await admin.from('user_roles').upsert(
    { user_id: userId, role: account.role },
    { onConflict: 'user_id,role' },
  );
  if (roleError) fail(`Role ${account.portal}`, roleError);

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: account.email,
      full_name: account.fullName,
      phone: account.phone,
      mobile_verified: true,
    },
    { onConflict: 'id' },
  );
  if (profileError) fail(`Profile ${account.portal}`, profileError);

  if (account.role === 'worker') {
    const { error } = await admin.from('worker_profiles').upsert(
      { user_id: userId, country: 'India', nationality: 'India' },
      { onConflict: 'user_id' },
    );
    if (error) fail('Worker profile', error);
    return;
  }

  const now = new Date().toISOString();
  if (account.portal === 'emitra') {
    const row = {
      user_id: userId,
      owner_name: account.fullName,
      center_name: account.centerName,
      mobile: account.phone,
      whatsapp: account.phone,
      emitra_id: account.emitraId,
      village_city: 'Jaipur',
      district: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      address: 'Dev centre',
      status: 'approved',
      tier: 'bronze',
      mobile_verified: true,
      accepted_terms: true,
      current_step: 6,
      submitted_at: now,
      approved_at: now,
    };
    const { data: existing } = await admin
      .from('partner_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    const { error } = existing
      ? await admin.from('partner_profiles').update(row).eq('user_id', userId)
      : await admin.from('partner_profiles').insert(row);
    if (error) fail('E-Mitra profile', error);
  }

  const { data: typeRow, error: typeError } = await admin
    .from('partner_types')
    .select('id')
    .eq('code', account.typeCode)
    .maybeSingle();
  if (typeError || !typeRow?.id) fail(`${account.typeCode} type`, typeError || 'missing partner type');

  const { data: existingOrg } = await admin
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .eq('partner_type_id', typeRow.id)
    .maybeSingle();

  let partnerId = existingOrg?.id;
  if (partnerId) {
    const { error } = await admin
      .from('partners')
      .update({
        status: 'approved',
        state: 'Rajasthan',
        district: 'Jaipur',
        city: 'Jaipur',
      })
      .eq('id', partnerId);
    if (error) fail(`Update ${account.portal} org`, error);
  } else {
    const { data: inserted, error } = await admin
      .from('partners')
      .insert({
        user_id: userId,
        partner_type_id: typeRow.id,
        status: 'approved',
        state: 'Rajasthan',
        district: 'Jaipur',
        city: 'Jaipur',
      })
      .select('id')
      .single();
    if (error) fail(`Insert ${account.portal} org`, error);
    partnerId = inserted.id;
  }

  const { error: extError } = await admin.from('partner_profiles_ext').upsert(
    {
      partner_id: partnerId,
      company_name: account.centerName,
      owner_name: account.fullName,
      mobile: account.phone,
    },
    { onConflict: 'partner_id' },
  );
  if (extError) fail(`${account.portal} centre details`, extError);
}

async function verifyLogin(account) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: account.email,
    password: PASSWORD,
  });
  if (error) {
    console.log(`${account.portal}: login check failed — ${error.message}`);
    return false;
  }
  console.log(`${account.portal}: password login works`);
  await client.auth.signOut();
  return true;
}

if (!admin) {
  console.log('No SUPABASE_SERVICE_ROLE_KEY — creating auth users only.');
}

for (const account of ACCOUNTS) {
  const userId = await ensureAuthUser(account);
  if (admin && userId) await finishWithAdmin(account, userId);
  await verifyLogin(account);
}

console.log('\nSign in on localhost with mobile', SIGN_IN_MOBILE);
console.log('Password:', PASSWORD);
console.log('Worker:  http://localhost:8080/worker/login');
console.log('E-Mitra: http://localhost:8080/emitra/login');
console.log('SSVN:    http://localhost:8080/partner/ssvn/login');
if (!admin) {
  console.log('\nAdd SUPABASE_SERVICE_ROLE_KEY to .env and run this again to approve the partners and mark mobiles verified.');
}
