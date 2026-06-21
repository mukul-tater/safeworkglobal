#!/usr/bin/env node
/**
 * Create a whitelisted admin auth user and assign the admin role.
 *
 * Without SUPABASE_SERVICE_ROLE_KEY: signs up via anon API and prints SQL
 * to grant admin (run in Supabase SQL Editor).
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *   node scripts/create-admin.mjs --email admin@safeworkglobal.demo --password 'YourPass123!'
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const ALLOWED = new Set([
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com',
]);

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
  let email = 'kailash@safeworkglobal.com';
  let password = `SwgAdmin!${randomBytes(4).toString('hex')}`;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[++i].toLowerCase();
    if (args[i] === '--password' && args[i + 1]) password = args[++i];
  }
  return { email, password };
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
if (!ALLOWED.has(email)) {
  console.error(`Email not whitelisted: ${email}`);
  console.error([...ALLOWED].join(', '));
  process.exit(1);
}

const anon = createClient(url, anonKey);
const admin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

const { data: signUpData, error: signUpError } = await anon.auth.signUp({
  email,
  password,
  options: { data: { full_name: 'SafeWork Global Admin' } },
});

if (signUpError && !/already registered/i.test(signUpError.message)) {
  console.error('Sign up failed:', signUpError.message);
  process.exit(1);
}

if (signUpError) {
  console.log('Auth user already exists for', email);
} else {
  console.log('Created auth user:', email);
}

let userId = signUpData?.user?.id;

if (!userId) {
  const { data: loginData, error: loginError } = await anon.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.error('Account exists but password did not match. Reset in Supabase Dashboard → Authentication.');
    process.exit(1);
  }
  userId = loginData.user.id;
}

if (admin) {
  const { error: roleError } = await admin.from('user_roles').upsert(
    { user_id: userId, role: 'admin' },
    { onConflict: 'user_id,role' },
  );
  if (roleError) {
    console.error('Failed to assign admin role:', roleError.message);
    process.exit(1);
  }
  console.log('Admin role assigned.');
} else {
  console.log('\nAdd SUPABASE_SERVICE_ROLE_KEY to .env to auto-assign admin, or run in Supabase SQL Editor:\n');
  console.log(`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(email) = '${email}'
ON CONFLICT (user_id, role) DO NOTHING;\n`);
}

console.log('\n--- Admin credentials ---');
console.log('Email:   ', email);
console.log('Password:', password);
console.log('Login:   ', `${process.env.ADMIN_LOGIN_URL || 'http://localhost:5173/admin/login'}`);
