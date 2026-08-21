#!/usr/bin/env node
/**
 * Create an approved E-Mitra partner auth user (same pattern as create-admin.mjs).
 *
 * With SUPABASE_SERVICE_ROLE_KEY: email-confirmed, partner role, approved profile.
 * Without it: signs up via the anon key, then prints SQL for remaining approval steps.
 *
 * Usage:
 *   node scripts/create-emitra.mjs
 *   node scripts/create-emitra.mjs --email emitra@safeworkglobal.com --password 'YourPass123!'
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_EMAIL = 'emitra@safeworkglobal.com';
const DEFAULT_PASSWORD = 'SwgPartner!2026';
const ownerName = 'Kailash eMitra';
const centerName = 'SafeWork Jaipur eMitra';
const mobile = '9876500123';
const emitraId = 'SWG-EMITRA-KAILASH';

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
  let email = DEFAULT_EMAIL;
  let password = DEFAULT_PASSWORD;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[++i].toLowerCase();
    if (args[i] === '--password' && args[i + 1]) password = args[++i];
  }
  return { email, password };
}

function printSql(email, userId) {
  const uidClause = userId
    ? `v_uid uuid := '${userId}'::uuid;`
    : `v_uid uuid;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = '${email}';
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth user not found. Sign up first, then re-run this SQL.';
  END IF;`;

  console.log('\nRun this in Supabase SQL Editor to approve the partner:\n');
  console.log(`DO $$
DECLARE
  ${uidClause}
  v_sen uuid;
  v_org uuid;
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('full_name', '${ownerName}', 'role', 'partner', 'mobile_verified', true)
  WHERE id = v_uid;

  INSERT INTO public.profiles (id, email, full_name, phone, mobile_verified)
  VALUES (v_uid, '${email}', '${ownerName}', '${mobile}', true)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    mobile_verified = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'partner')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.partner_profiles (
    user_id, owner_name, center_name, mobile, whatsapp, email, emitra_id,
    village_city, district, state, pincode, address,
    has_computer, has_scanner, has_printer, has_internet,
    status, tier, mobile_verified, accepted_terms, accepted_privacy, confirmed_accuracy,
    no_jobs_promise, no_unauthorized_fees, current_step,
    submitted_at, approved_at, compliance_acknowledged_at
  ) VALUES (
    v_uid, '${ownerName}', '${centerName}', '${mobile}', '${mobile}', '${email}', '${emitraId}',
    'Jaipur', 'Jaipur', 'Rajasthan', '302001', 'SafeWork eMitra Centre, Jaipur',
    true, true, true, true,
    'approved', 'bronze', true, true, true, true,
    true, true, 6,
    now(), now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    center_name = EXCLUDED.center_name,
    mobile = EXCLUDED.mobile,
    email = EXCLUDED.email,
    emitra_id = EXCLUDED.emitra_id,
    status = 'approved',
    mobile_verified = true,
    compliance_acknowledged_at = COALESCE(public.partner_profiles.compliance_acknowledged_at, now()),
    approved_at = COALESCE(public.partner_profiles.approved_at, now());

  SELECT id INTO v_sen FROM public.partner_types WHERE code = 'SEN';
  IF v_sen IS NOT NULL THEN
    INSERT INTO public.partners (
      user_id, partner_type_id, status, verification_status, state, district, city, approved_at
    ) VALUES (
      v_uid, v_sen, 'approved', 'verified', 'Rajasthan', 'Jaipur', 'Jaipur', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      partner_type_id = EXCLUDED.partner_type_id,
      status = 'approved',
      verification_status = 'verified',
      approved_at = COALESCE(public.partners.approved_at, now())
    RETURNING id INTO v_org;

    INSERT INTO public.partner_profiles_ext (partner_id, company_name, owner_name, mobile, email)
    VALUES (v_org, '${centerName}', '${ownerName}', '${mobile}', '${email}')
    ON CONFLICT (partner_id) DO NOTHING;

    INSERT INTO public.partner_wallets (partner_id, available_balance)
    VALUES (v_org, 0)
    ON CONFLICT (partner_id) DO NOTHING;
  END IF;
END $$;
`);
}

function printCreds(email, password) {
  console.log('\n--- E-Mitra credentials ---');
  console.log('Email:   ', email);
  console.log('Password:', password);
  console.log('Login:   ', 'http://localhost:8080/emitra/login');
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

const { email, password } = parseArgs();
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

async function fail(step, error) {
  console.error(`${step}:`, error?.message || error);
  process.exit(1);
}

if (admin) {
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
    { id: userId, email, full_name: ownerName, phone: mobile, mobile_verified: true },
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

  const { error: loginError } = await anon.auth.signInWithPassword({ email, password });
  if (loginError) await fail('Verify password login', loginError);

  printCreds(email, password);
  console.log('Status:  ', 'approved (compliance already acknowledged)');
  process.exit(0);
}

console.log('No SUPABASE_SERVICE_ROLE_KEY — creating via public signup.');

const { data: signUpData, error: signUpError } = await anon.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: ownerName,
      phone: mobile,
      role: 'partner',
      mobile_verified: true,
    },
  },
});

if (signUpError && !/already registered/i.test(signUpError.message)) {
  await fail('Sign up', signUpError);
}

if (signUpError) {
  console.log('Auth user already exists for', email);
} else {
  console.log('Created auth user:', email);
}

const { data: loginData, error: loginError } = await anon.auth.signInWithPassword({ email, password });
if (loginError) {
  console.error('Could not sign in:', loginError.message);
  if (/email not confirmed/i.test(loginError.message) || /invalid login credentials/i.test(loginError.message)) {
    printSql(email, signUpData?.user?.id || null);
  }
  printCreds(email, password);
  process.exit(1);
}

const userId = loginData.user.id;
const authed = createClient(url, anonKey, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${loginData.session.access_token}` } },
});

const { error: roleError } = await authed.rpc('assign_initial_role', { _role: 'partner' });
if (roleError && !/already assigned/i.test(roleError.message)) {
  console.warn('assign_initial_role:', roleError.message);
} else {
  console.log('Partner role ready.');
}

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

const { data: existingPp, error: ppFetchError } = await authed
  .from('partner_profiles')
  .select('id, status')
  .eq('user_id', userId)
  .maybeSingle();
if (ppFetchError) console.warn('Fetch partner_profiles:', ppFetchError.message);

let needsSql = false;
if (!existingPp) {
  const { error } = await authed.from('partner_profiles').insert(partnerProfileRow);
  if (error) {
    console.warn('Insert approved partner_profiles:', error.message);
    needsSql = true;
  } else {
    console.log('Approved partner_profiles created.');
  }
} else if (existingPp.status === 'approved' || existingPp.status === 'active') {
  console.log('partner_profiles already', existingPp.status);
} else {
  const { error } = await authed
    .from('partner_profiles')
    .update(partnerProfileRow)
    .eq('user_id', userId);
  if (error) {
    console.warn('Could not self-approve partner_profiles:', error.message);
    needsSql = true;
  } else {
    console.log('partner_profiles updated.');
  }
}

const { data: senType } = await authed.from('partner_types').select('id').eq('code', 'SEN').maybeSingle();
if (senType?.id) {
  const { data: existingOrg } = await authed.from('partners').select('id, status').eq('user_id', userId).maybeSingle();
  if (!existingOrg) {
    const { error } = await authed.from('partners').insert({
      user_id: userId,
      partner_type_id: senType.id,
      status: 'pending',
      verification_status: 'unverified',
      state: 'Rajasthan',
      district: 'Jaipur',
      city: 'Jaipur',
    });
    if (error) console.warn('Insert partners org:', error.message);
    needsSql = true;
  } else if (existingOrg.status !== 'approved') {
    needsSql = true;
  }
}

if (needsSql) {
  printSql(email, userId);
  printCreds(email, password);
  console.log('\nAccount exists, but admin SQL is still required to mark it approved.');
  process.exit(0);
}

printCreds(email, password);
console.log('Status:  ', 'approved');
