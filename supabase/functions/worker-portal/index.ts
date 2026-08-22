import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { bcrypt } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOKEN_TTL_MS = 15 * 60 * 1000;

const FIREBASE_OTP_REQUIRED =
  'Phone OTP must use Firebase Phone Auth on the client, then POST /api/workers/otp/verify-firebase. Demo “any 6 digits” OTP is disabled.';

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiError = { success: false; message: string; errors?: Record<string, string[]> };

function json(body: ApiSuccess<unknown> | ApiError, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function phoneRegex(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function isValidEmail(value: string) {
  return /^[^\s@,()]{1,64}@[^\s@,()]{1,190}\.[A-Za-z]{2,}$/.test(value);
}

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const route = url.pathname.replace(/^\/worker-portal\/?/, '').replace(/^\//, '');
    const body = req.method === 'POST' ? await req.json() : {};

    if (route === 'otp/send' || body.action === 'otp/send') {
      return json(
        {
          success: false,
          message: FIREBASE_OTP_REQUIRED,
          errors: { mobileNumber: [FIREBASE_OTP_REQUIRED] },
        },
        410,
      );
    }

    if (route === 'otp/verify' || body.action === 'otp/verify') {
      return json(
        {
          success: false,
          message: FIREBASE_OTP_REQUIRED,
          errors: { otp: [FIREBASE_OTP_REQUIRED] },
        },
        410,
      );
    }

    if (route === 'register' || body.action === 'register') {
      const {
        email,
        mobileNumber,
        password,
        confirmPassword,
        otpToken,
      } = body;

      const mobile = String(mobileNumber ?? '').replace(/\D/g, '');
      if (!otpToken || !phoneRegex(mobile)) {
        return json({ success: false, message: 'Validation failed', errors: { mobileNumber: ['Verification required'] } }, 400);
      }

      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return json({ success: false, message: 'Validation failed', errors: { email: ['Valid email is required'] } }, 400);
      }

      const { data: tokenRow } = await supabase
        .from('worker_portal_tokens')
        .select('*')
        .eq('token', otpToken)
        .eq('mobile_number', mobile)
        .maybeSingle();

      if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
        return json({ success: false, message: 'Validation failed', errors: { mobileNumber: ['Mobile verification expired'] } }, 400);
      }

      if (password !== confirmPassword) {
        return json({ success: false, message: 'Validation failed', errors: { confirmPassword: ['Passwords do not match'] } }, 400);
      }

      const passwordText = String(password ?? '');
      if (passwordText.length < 6) {
        return json({ success: false, message: 'Validation failed', errors: { password: ['Password must be at least 6 characters'] } }, 400);
      }
      if (passwordText.length > 72 || !/^[a-zA-Z0-9]+$/.test(passwordText)) {
        return json({ success: false, message: 'Validation failed', errors: { password: ['Password can only contain letters and numbers'] } }, 400);
      }

      const [{ count: mobileCount }, { count: emailCount }] = await Promise.all([
        supabase
          .from('worker_portal_users')
          .select('*', { count: 'exact', head: true })
          .eq('mobile_number', mobile),
        supabase
          .from('worker_portal_users')
          .select('*', { count: 'exact', head: true })
          .eq('email', normalizedEmail),
      ]);

      if ((mobileCount ?? 0) > 0 || (emailCount ?? 0) > 0) {
        return json({ success: false, message: 'Conflict', errors: { mobileNumber: ['Already registered'] } }, 409);
      }

      const { count: userCount } = await supabase
        .from('worker_portal_users')
        .select('*', { count: 'exact', head: true });

      const workerCode = `WRK-${String((userCount ?? 0) + 1).padStart(6, '0')}`;
      const fullName = normalizedEmail.split('@')[0]?.replace(/[._-]+/g, ' ') || `Worker ${mobile.slice(-4)}`;
      const passwordHash = bcrypt.hashSync(String(password));

      const { data: user, error } = await supabase
        .from('worker_portal_users')
        .insert({
          worker_code: workerCode,
          full_name: fullName,
          email: normalizedEmail,
          mobile_number: mobile,
          password_hash: passwordHash,
          mobile_verified: true,
        })
        .select('*')
        .single();

      if (error || !user) {
        return json({ success: false, message: error?.message ?? 'Registration failed' }, 500);
      }

      await supabase.from('worker_portal_tokens').delete().eq('token', otpToken);

      const token = generateToken();

      return json({
        success: true,
        data: {
          token,
          worker: {
            id: user.id,
            workerCode: user.worker_code,
            fullName: user.full_name,
            email: user.email,
            mobileNumber: user.mobile_number,
            aadhaarNumber: 'PENDING',
            stateId: 0,
            stateName: '',
            districtId: 0,
            districtName: '',
            primarySkillId: 0,
            primarySkillName: '',
            experienceLevel: 'FRESHER',
            profileCompletionPercentage: user.profile_completion_percentage,
            registrationSource: 'WEB',
            status: user.status,
            onboardingCompleted: false,
            createdDate: user.created_at,
            updatedDate: user.updated_at,
          },
        },
        message: 'Registration successful',
      }, 201);
    }

    if (route === 'google-auth' || body.action === 'google-auth') {
      // Never trust a client-supplied email: derive it from a server-verified Supabase Auth JWT.
      const authHeader = req.headers.get('Authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        return json({ success: false, message: 'Unauthorized' }, 401);
      }

      const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      );
      const { data: authData, error: authError } = await authClient.auth.getUser(
        authHeader.slice(7),
      );
      const verifiedEmail = authData?.user?.email?.trim().toLowerCase() ?? '';

      if (authError || !verifiedEmail || !isValidEmail(verifiedEmail)) {
        return json({ success: false, message: 'Unauthorized' }, 401);
      }

      const email = verifiedEmail;
      const metadata = (authData?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = String(metadata.full_name ?? metadata.name ?? '').trim();

      const { data: user } = await supabase
        .from('worker_portal_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (!user) {
        return json({
          success: true,
          data: {
            needsRegistration: true,
            email,
            fullName: fullName || email.split('@')[0],
          },
          message: 'Complete registration',
        });
      }

      const token = generateToken();
      return json({
        success: true,
        data: {
          token,
          worker: {
            id: user.id,
            workerCode: user.worker_code,
            fullName: user.full_name,
            email: user.email,
            mobileNumber: user.mobile_number,
            aadhaarNumber: 'PENDING',
            stateId: 0,
            stateName: '',
            districtId: 0,
            districtName: '',
            primarySkillId: 0,
            primarySkillName: '',
            experienceLevel: 'FRESHER',
            profileCompletionPercentage: user.profile_completion_percentage,
            registrationSource: 'WEB',
            status: user.status,
            onboardingCompleted: false,
            createdDate: user.created_at,
            updatedDate: user.updated_at,
          },
        },
        message: 'Google sign-in successful',
      });
    }

    if (route === 'login' || body.action === 'login') {
      const email = body.email ? String(body.email).trim().toLowerCase() : '';
      const mobileNumber = String(body.mobileNumber ?? '').replace(/\D/g, '');
      const password = String(body.password ?? '');

      if (!password) {
        return json({ success: false, message: 'Validation failed', errors: { password: ['Password is required'] } }, 400);
      }

      let query = supabase.from('worker_portal_users').select('*');
      if (email) {
        query = query.eq('email', email);
      } else if (/^[6-9]\d{9}$/.test(mobileNumber)) {
        query = query.eq('mobile_number', mobileNumber);
      } else {
        return json({ success: false, message: 'Validation failed', errors: { email: ['Email or mobile number is required'] } }, 400);
      }

      const { data: user } = await query.maybeSingle();
      if (!user) {
        return json({ success: false, message: 'Invalid credentials' }, 401);
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return json({ success: false, message: 'Invalid credentials' }, 401);
      }

      const token = generateToken();
      return json({
        success: true,
        data: {
          token,
          worker: {
            id: user.id,
            workerCode: user.worker_code,
            fullName: user.full_name,
            email: user.email,
            mobileNumber: user.mobile_number,
            aadhaarNumber: 'PENDING',
            stateId: 0,
            stateName: '',
            districtId: 0,
            districtName: '',
            primarySkillId: 0,
            primarySkillName: '',
            experienceLevel: 'FRESHER',
            profileCompletionPercentage: user.profile_completion_percentage,
            registrationSource: 'WEB',
            status: user.status,
            onboardingCompleted: false,
            createdDate: user.created_at,
            updatedDate: user.updated_at,
          },
        },
        message: 'Login successful',
      });
    }

    return json({ success: false, message: `Unknown route: ${route}` }, 404);
  } catch (err) {
    console.error('worker-portal error:', err);
    return json({ success: false, message: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
});
