import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { bcrypt } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_FIREBASE_API_KEY = 'AIzaSyB27N7cODGEhPFJdJm-CFAoedTeW2OeJh0';

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

function rawJson(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeIndianMobile(value: string): string | null {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

async function verifiedMobileFromIdToken(idToken: string, expectedMobile: string): Promise<string> {
  const mobile = normalizeIndianMobile(expectedMobile);
  if (!mobile) throw new Error('Enter a valid 10-digit Indian mobile number.');
  const token = String(idToken || '').trim();
  if (!token) throw new Error('Verification is required.');
  if (token.startsWith('dev-otp:')) {
    const url = Deno.env.get('SUPABASE_URL') || '';
    if (!/localhost|127\.0\.0\.1/i.test(url)) {
      throw new Error('Invalid or expired verification. Request a new OTP.');
    }
    return mobile;
  }
  const apiKey = (
    Deno.env.get('FIREBASE_API_KEY') ||
    Deno.env.get('VITE_FIREBASE_API_KEY') ||
    DEFAULT_FIREBASE_API_KEY
  ).trim();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );
  const lookup = (await response.json()) as {
    users?: { phoneNumber?: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(lookup.error?.message || 'Invalid or expired verification. Request a new OTP.');
  }
  const tokenPhone = normalizeIndianMobile(lookup.users?.[0]?.phoneNumber || '');
  if (!tokenPhone || tokenPhone !== mobile) {
    throw new Error('Verified phone does not match the number you entered.');
  }
  return mobile;
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
    const action = String(body.action || route || '').trim();

    // Hosted here because Lovable only publishes functions already in the dashboard.
    if (action === 'bind_mobile' || action === 'create_worker' || action === 'create_partner') {
      try {
        const mobile = await verifiedMobileFromIdToken(String(body.idToken ?? ''), String(body.mobile ?? ''));

        if (action === 'bind_mobile') {
          const authHeader = req.headers.get('Authorization') || '';
          const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
          if (!token) return rawJson(401, { error: 'Not authenticated' });
          const {
            data: { user },
            error: userErr,
          } = await supabase.auth.getUser(token);
          if (userErr || !user) return rawJson(401, { error: 'Not authenticated' });

          const { data: taken } = await supabase
            .from('profiles')
            .select('id')
            .neq('id', user.id)
            .or(`phone.eq.${mobile},phone.eq.+91${mobile},phone.eq.91${mobile}`)
            .limit(1)
            .maybeSingle();
          if (taken?.id) {
            return rawJson(409, { error: 'This mobile number is already registered.' });
          }

          const { error: updErr } = await supabase
            .from('profiles')
            .update({ phone: mobile, mobile_verified: true, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          if (updErr) throw new Error(updErr.message);

          await supabase.from('partner_profiles').update({ mobile_verified: true }).eq('user_id', user.id);
          try {
            await supabase.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...(user.user_metadata || {}),
                phone: mobile,
                mobile_verified: true,
              },
            });
          } catch {
            /* non-fatal */
          }
          return rawJson(200, { user_id: user.id, mobile });
        }

        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const fullName = String(body.fullName || '').trim();
        const rpcName =
          action === 'create_partner'
            ? 'create_phone_verified_partner_account'
            : 'create_phone_verified_worker_account';
        const { data: userId, error } = await supabase.rpc(rpcName, {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
          p_phone: mobile,
        });
        if (error) {
          const msg = error.message || 'Could not create account.';
          if (/already registered|already exists|duplicate/i.test(msg)) {
            return rawJson(409, { error: 'already registered' });
          }
          return rawJson(400, { error: msg });
        }
        if (!userId) return rawJson(500, { error: 'Could not create account. Please try again.' });
        return rawJson(200, { user_id: userId, mobile });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not complete verification.';
        const status = /not authenticated/i.test(message) ? 401 : /already registered/i.test(message) ? 409 : 400;
        return rawJson(status, { error: message });
      }
    }

    if (action === 'otp_login') {
      try {
        const mobile = await verifiedMobileFromIdToken(String(body.idToken ?? ''), String(body.mobile ?? ''));
        const phoneVariants = [mobile, `+91${mobile}`, `91${mobile}`];
        const { data: profileRows, error: profileErr } = await supabase
          .from('profiles')
          .select('id, phone, email')
          .in('phone', phoneVariants);
        if (profileErr) return rawJson(500, { error: 'Could not look up this mobile number.' });

        const profileIds = [...new Set((profileRows ?? []).map((row) => row.id).filter(Boolean))];
        if (profileIds.length === 0) {
          return rawJson(404, { error: 'No worker account found for this mobile number.' });
        }

        const { data: roleRows } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profileIds);
        const workerId = (roleRows ?? []).find((row) => row.role === 'worker')?.user_id;
        if (!workerId) {
          const other = (roleRows ?? []).find((row) => row.role && row.role !== 'worker');
          if (other?.role) {
            return rawJson(403, {
              error: `This account is registered as a ${other.role}. Please continue from the correct portal.`,
            });
          }
          return rawJson(404, { error: 'No worker account found for this mobile number.' });
        }

        const { data: authUser, error: userErr } = await supabase.auth.admin.getUserById(workerId);
        const email = authUser.user?.email?.trim();
        if (userErr || !authUser.user || !email) {
          return rawJson(404, { error: 'No worker account found for this mobile number.' });
        }
        if (!authUser.user.email_confirmed_at) {
          await supabase.auth.admin.updateUserById(workerId, { email_confirm: true });
        }

        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });
        if (linkErr || !linkData?.properties?.hashed_token) {
          return rawJson(500, { error: linkErr?.message || 'Could not start a session. Please try again.' });
        }

        const hashedToken = linkData.properties.hashed_token;
        const emailOtp = linkData.properties.email_otp;
        let accessToken = '';
        let refreshToken = '';
        for (const type of ['magiclink', 'email'] as const) {
          const { data, error } = await supabase.auth.verifyOtp({ token_hash: hashedToken, type });
          if (!error && data.session?.access_token && data.session.refresh_token) {
            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
            break;
          }
        }
        if (!accessToken && emailOtp) {
          for (const type of ['magiclink', 'email'] as const) {
            const { data, error } = await supabase.auth.verifyOtp({ email, token: emailOtp, type });
            if (!error && data.session?.access_token && data.session.refresh_token) {
              accessToken = data.session.access_token;
              refreshToken = data.session.refresh_token;
              break;
            }
          }
        }
        if (!accessToken || !refreshToken) {
          return rawJson(500, { error: 'Could not start a session. Please try again.' });
        }

        await supabase.from('profiles').update({ phone: mobile, mobile_verified: true }).eq('id', workerId);
        try {
          await supabase.auth.admin.updateUserById(workerId, {
            user_metadata: {
              ...(authUser.user.user_metadata || {}),
              phone: mobile,
              mobile_verified: true,
            },
          });
        } catch {
          /* non-fatal */
        }
        return rawJson(200, { access_token: accessToken, refresh_token: refreshToken });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not sign in with OTP.';
        return rawJson(401, { error: message });
      }
    }

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
