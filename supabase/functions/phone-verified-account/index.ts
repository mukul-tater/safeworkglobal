import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifiedMobileFromIdToken } from '../_shared/firebasePhone.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Server is not configured for account creation.' });
  }

  let payload: {
    action?: unknown;
    mobile?: unknown;
    idToken?: unknown;
    email?: unknown;
    password?: unknown;
    fullName?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  const action = String(payload.action || '').trim();
  if (!['create_worker', 'create_partner', 'bind_mobile'].includes(action)) {
    return json(400, { error: 'Unknown action.' });
  }

  try {
    const mobile = await verifiedMobileFromIdToken(String(payload.idToken ?? ''), String(payload.mobile ?? ''));
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === 'bind_mobile') {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) {
        return json(401, { error: 'Not authenticated' });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userErr,
      } = await userClient.auth.getUser();
      if (userErr || !user) return json(401, { error: 'Not authenticated' });

      const { data: taken } = await admin
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .or(`phone.eq.${mobile},phone.eq.+91${mobile},phone.eq.91${mobile}`)
        .limit(1)
        .maybeSingle();
      if (taken?.id) {
        return json(409, { error: 'This mobile number is already registered.' });
      }

      const { error: updErr } = await admin
        .from('profiles')
        .update({ phone: mobile, mobile_verified: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updErr) throw new Error(updErr.message);

      await admin
        .from('partner_profiles')
        .update({ mobile_verified: true })
        .eq('user_id', user.id);

      try {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata || {}),
            phone: mobile,
            mobile_verified: true,
          },
        });
      } catch {
        /* non-fatal */
      }

      return json(200, { user_id: user.id, mobile });
    }

    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const fullName = String(payload.fullName || '').trim();
    const rpcName =
      action === 'create_partner'
        ? 'create_phone_verified_partner_account'
        : 'create_phone_verified_worker_account';

    const { data: userId, error } = await admin.rpc(rpcName, {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_phone: mobile,
    });
    if (error) {
      const msg = error.message || 'Could not create account.';
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json(409, { error: 'already registered' });
      }
      return json(400, { error: msg });
    }
    if (!userId) return json(500, { error: 'Could not create account. Please try again.' });

    return json(200, { user_id: userId, mobile });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not complete verification.';
    const status = /not authenticated/i.test(message) ? 401 : /already registered/i.test(message) ? 409 : 400;
    return json(status, { error: message });
  }
});
