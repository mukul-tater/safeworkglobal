import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Public web API key — same default as the Vite Firebase config. */
const DEFAULT_FIREBASE_API_KEY = 'AIzaSyB27N7cODGEhPFJdJm-CFAoedTeW2OeJh0';

function json(status: number, body: Record<string, unknown>) {
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

function allowDevOtpBypass(): boolean {
  const flag = (Deno.env.get('OTP_DEV_BYPASS') || '').toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  const url = Deno.env.get('SUPABASE_URL') || '';
  return /localhost|127\.0\.0\.1/i.test(url);
}

async function phoneFromFirebaseIdToken(idToken: string): Promise<string> {
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
      body: JSON.stringify({ idToken }),
    },
  );
  const body = (await response.json()) as {
    users?: { phoneNumber?: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || 'Invalid or expired verification. Request a new OTP.');
  }
  const phoneNumber = body.users?.[0]?.phoneNumber;
  if (!phoneNumber) {
    throw new Error('Phone number was not verified. Request a new OTP.');
  }
  return phoneNumber;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Server is not configured for OTP login.' });
  }

  let payload: { mobile?: unknown; idToken?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  const mobile = normalizeIndianMobile(String(payload.mobile ?? ''));
  const idToken = String(payload.idToken ?? '').trim();
  if (!mobile) {
    return json(400, { error: 'Enter a valid 10-digit Indian mobile number.' });
  }
  if (!idToken) {
    return json(400, { error: 'Verification is required.' });
  }

  try {
    if (idToken.startsWith('dev-otp:')) {
      if (!allowDevOtpBypass()) {
        return json(401, { error: 'Invalid or expired verification. Request a new OTP.' });
      }
    } else {
      const tokenPhone = normalizeIndianMobile(await phoneFromFirebaseIdToken(idToken));
      if (!tokenPhone || tokenPhone !== mobile) {
        return json(401, { error: 'Verified phone does not match the number you entered.' });
      }
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const phoneVariants = [mobile, `+91${mobile}`, `91${mobile}`];
    const { data: profileRows, error: profileErr } = await admin
      .from('profiles')
      .select('id, phone, email')
      .in('phone', phoneVariants);

    if (profileErr) {
      return json(500, { error: 'Could not look up this mobile number.' });
    }

    const profileIds = [...new Set((profileRows ?? []).map((row) => row.id).filter(Boolean))];
    if (profileIds.length === 0) {
      return json(404, { error: 'No worker account found for this mobile number.' });
    }

    const { data: roleRows } = await admin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profileIds);

    const workerId = (roleRows ?? []).find((row) => row.role === 'worker')?.user_id;
    if (!workerId) {
      const other = (roleRows ?? []).find((row) => row.role && row.role !== 'worker');
      if (other?.role) {
        return json(403, {
          error: `This account is registered as a ${other.role}. Please continue from the correct portal.`,
        });
      }
      return json(404, { error: 'No worker account found for this mobile number.' });
    }

    const { data: authUser, error: userErr } = await admin.auth.admin.getUserById(workerId);
    const email = authUser.user?.email?.trim();
    if (userErr || !authUser.user || !email) {
      return json(404, { error: 'No worker account found for this mobile number.' });
    }

    if (!authUser.user.email_confirmed_at) {
      await admin.auth.admin.updateUserById(workerId, { email_confirm: true });
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      return json(500, { error: linkErr?.message || 'Could not start a session. Please try again.' });
    }

    const hashedToken = linkData.properties.hashed_token;
    const emailOtp = linkData.properties.email_otp;
    let accessToken = '';
    let refreshToken = '';

    for (const type of ['magiclink', 'email'] as const) {
      const { data, error } = await admin.auth.verifyOtp({
        token_hash: hashedToken,
        type,
      });
      if (!error && data.session?.access_token && data.session.refresh_token) {
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
        break;
      }
    }

    if (!accessToken && emailOtp) {
      for (const type of ['magiclink', 'email'] as const) {
        const { data, error } = await admin.auth.verifyOtp({
          email,
          token: emailOtp,
          type,
        });
        if (!error && data.session?.access_token && data.session.refresh_token) {
          accessToken = data.session.access_token;
          refreshToken = data.session.refresh_token;
          break;
        }
      }
    }

    if (!accessToken || !refreshToken) {
      return json(500, { error: 'Could not start a session. Please try again.' });
    }

    await admin
      .from('profiles')
      .update({ phone: mobile, mobile_verified: true })
      .eq('id', workerId);
    try {
      await admin.auth.admin.updateUserById(workerId, {
        user_metadata: {
          ...(authUser.user.user_metadata || {}),
          phone: mobile,
          mobile_verified: true,
        },
      });
    } catch {
      /* non-fatal */
    }

    return json(200, {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not sign in with OTP.';
    return json(401, { error: message });
  }
});
