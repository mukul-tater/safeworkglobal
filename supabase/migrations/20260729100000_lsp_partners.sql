-- LSP (Rajasthan) → SafeWork trusted entry
-- Secrets never leave the DB except once on create/rotate via SECURITY DEFINER RPCs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.lsp_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'Rajasthan',
  contact_name text,
  contact_mobile text,
  contact_email text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  token_secret text NOT NULL,
  allowed_origins text[] DEFAULT '{}'::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lsp_partners_status_idx ON public.lsp_partners(status);

CREATE TABLE IF NOT EXISTS public.lsp_launch_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lsp_id uuid NOT NULL REFERENCES public.lsp_partners(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lsp_launch_tokens_lsp_id_idx ON public.lsp_launch_tokens(lsp_id);

CREATE TABLE IF NOT EXISTS public.lsp_launch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lsp_id uuid REFERENCES public.lsp_partners(id) ON DELETE SET NULL,
  lsp_code text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lsp_launch_logs_created_at_idx ON public.lsp_launch_logs(created_at DESC);

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS source_lsp_id uuid REFERENCES public.lsp_partners(id),
  ADD COLUMN IF NOT EXISTS lsp_verified_at timestamptz;

ALTER TABLE public.partner_workers
  ADD COLUMN IF NOT EXISTS source_lsp_id uuid REFERENCES public.lsp_partners(id);

CREATE INDEX IF NOT EXISTS partner_profiles_source_lsp_id_idx
  ON public.partner_profiles(source_lsp_id);
CREATE INDEX IF NOT EXISTS partner_workers_source_lsp_id_idx
  ON public.partner_workers(source_lsp_id);

ALTER TABLE public.lsp_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsp_launch_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsp_launch_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lsp_partners" ON public.lsp_partners;
CREATE POLICY "Admins manage lsp_partners"
  ON public.lsp_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage lsp_launch_tokens" ON public.lsp_launch_tokens;
CREATE POLICY "Admins manage lsp_launch_tokens"
  ON public.lsp_launch_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins read lsp_launch_logs" ON public.lsp_launch_logs;
CREATE POLICY "Admins read lsp_launch_logs"
  ON public.lsp_launch_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lsp_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lsp_launch_tokens TO authenticated;
GRANT SELECT ON public.lsp_launch_logs TO authenticated;
GRANT ALL ON public.lsp_partners TO service_role;
GRANT ALL ON public.lsp_launch_tokens TO service_role;
GRANT ALL ON public.lsp_launch_logs TO service_role;

-- Public view without secrets (optional UI)
CREATE OR REPLACE VIEW public.lsp_partners_public AS
SELECT id, code, name, state, status, created_at
FROM public.lsp_partners
WHERE status = 'active';

GRANT SELECT ON public.lsp_partners_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lsp_hmac_hex(p_message text, p_secret text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(hmac(convert_to(p_message, 'UTF8'), convert_to(p_secret, 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.lsp_log_launch(
  p_lsp_id uuid,
  p_lsp_code text,
  p_success boolean,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lsp_launch_logs (lsp_id, lsp_code, success, reason)
  VALUES (p_lsp_id, p_lsp_code, p_success, p_reason);
END;
$$;

-- Verify HMAC launch: payload = lsp|exp|nonce|emitra_id|mobile
CREATE OR REPLACE FUNCTION public.verify_lsp_launch(
  p_lsp text,
  p_exp bigint,
  p_nonce text,
  p_sig text,
  p_emitra_id text DEFAULT '',
  p_mobile text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lsp_partners%ROWTYPE;
  v_payload text;
  v_expected text;
  v_now bigint;
BEGIN
  IF p_lsp IS NULL OR btrim(p_lsp) = '' OR p_sig IS NULL OR p_nonce IS NULL OR p_exp IS NULL THEN
    PERFORM public.lsp_log_launch(NULL, p_lsp, false, 'missing_params');
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_params');
  END IF;

  v_now := floor(extract(epoch FROM now()))::bigint;
  IF p_exp < v_now THEN
    PERFORM public.lsp_log_launch(NULL, p_lsp, false, 'expired');
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  -- Launch tokens must be short-lived (max 15 minutes from now, and not issued > 1h ahead)
  IF p_exp > v_now + 900 THEN
    PERFORM public.lsp_log_launch(NULL, p_lsp, false, 'exp_too_far');
    RETURN jsonb_build_object('ok', false, 'reason', 'exp_too_far');
  END IF;

  SELECT * INTO v_row FROM public.lsp_partners WHERE code = upper(btrim(p_lsp));
  IF NOT FOUND THEN
    PERFORM public.lsp_log_launch(NULL, p_lsp, false, 'unknown_lsp');
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_lsp');
  END IF;

  IF v_row.status <> 'active' THEN
    PERFORM public.lsp_log_launch(v_row.id, v_row.code, false, 'lsp_not_active');
    RETURN jsonb_build_object('ok', false, 'reason', 'lsp_not_active');
  END IF;

  v_payload := v_row.code || '|' || p_exp::text || '|' || p_nonce || '|'
    || coalesce(p_emitra_id, '') || '|' || coalesce(p_mobile, '');
  v_expected := public.lsp_hmac_hex(v_payload, v_row.token_secret);

  IF lower(p_sig) <> lower(v_expected) THEN
    PERFORM public.lsp_log_launch(v_row.id, v_row.code, false, 'bad_signature');
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_signature');
  END IF;

  PERFORM public.lsp_log_launch(v_row.id, v_row.code, true, 'hmac_ok');

  RETURN jsonb_build_object(
    'ok', true,
    'lsp_id', v_row.id,
    'code', v_row.code,
    'name', v_row.name,
    'state', v_row.state,
    'emitra_id', nullif(p_emitra_id, ''),
    'mobile', nullif(p_mobile, ''),
    'session_exp', v_now + 86400
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_lsp_launch(text, bigint, text, text, text, text) TO anon, authenticated;

-- Consume one-time launch token (raw token in URL)
CREATE OR REPLACE FUNCTION public.consume_lsp_launch_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_tok public.lsp_launch_tokens%ROWTYPE;
  v_row public.lsp_partners%ROWTYPE;
  v_now bigint;
BEGIN
  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_token');
  END IF;

  v_hash := encode(digest(convert_to(btrim(p_token), 'UTF8'), 'sha256'), 'hex');

  SELECT * INTO v_tok FROM public.lsp_launch_tokens WHERE token_hash = v_hash FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.lsp_log_launch(NULL, NULL, false, 'unknown_token');
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_token');
  END IF;

  IF v_tok.used_at IS NOT NULL THEN
    PERFORM public.lsp_log_launch(v_tok.lsp_id, NULL, false, 'token_used');
    RETURN jsonb_build_object('ok', false, 'reason', 'token_used');
  END IF;

  IF v_tok.expires_at < now() THEN
    PERFORM public.lsp_log_launch(v_tok.lsp_id, NULL, false, 'expired');
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  SELECT * INTO v_row FROM public.lsp_partners WHERE id = v_tok.lsp_id;
  IF NOT FOUND THEN
    PERFORM public.lsp_log_launch(v_tok.lsp_id, NULL, false, 'lsp_missing');
    RETURN jsonb_build_object('ok', false, 'reason', 'lsp_missing');
  END IF;
  IF v_row.status <> 'active' THEN
    PERFORM public.lsp_log_launch(v_tok.lsp_id, v_row.code, false, 'lsp_not_active');
    RETURN jsonb_build_object('ok', false, 'reason', 'lsp_not_active');
  END IF;

  UPDATE public.lsp_launch_tokens SET used_at = now() WHERE id = v_tok.id;

  v_now := floor(extract(epoch FROM now()))::bigint;
  PERFORM public.lsp_log_launch(v_row.id, v_row.code, true, 'token_ok');

  RETURN jsonb_build_object(
    'ok', true,
    'lsp_id', v_row.id,
    'code', v_row.code,
    'name', v_row.name,
    'state', v_row.state,
    'emitra_id', v_tok.payload->>'emitra_id',
    'mobile', v_tok.payload->>'mobile',
    'session_exp', v_now + 86400
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_lsp_launch_token(text) TO anon, authenticated;

-- Admin: issue signed launch query params (secret stays in DB)
CREATE OR REPLACE FUNCTION public.issue_lsp_launch_params(
  p_lsp_id uuid,
  p_ttl_seconds integer DEFAULT 900,
  p_emitra_id text DEFAULT NULL,
  p_mobile text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lsp_partners%ROWTYPE;
  v_exp bigint;
  v_nonce text;
  v_payload text;
  v_sig text;
  v_ttl integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT * INTO v_row FROM public.lsp_partners WHERE id = p_lsp_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lsp not found';
  END IF;

  v_ttl := LEAST(GREATEST(coalesce(p_ttl_seconds, 900), 60), 900);
  v_exp := floor(extract(epoch FROM now()))::bigint + v_ttl;
  v_nonce := encode(gen_random_bytes(16), 'hex');
  v_payload := v_row.code || '|' || v_exp::text || '|' || v_nonce || '|'
    || coalesce(p_emitra_id, '') || '|' || coalesce(p_mobile, '');
  v_sig := public.lsp_hmac_hex(v_payload, v_row.token_secret);

  RETURN jsonb_build_object(
    'lsp', v_row.code,
    'exp', v_exp,
    'nonce', v_nonce,
    'sig', v_sig,
    'emitra_id', p_emitra_id,
    'mobile', p_mobile,
    'path', '/lsp/entry'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_lsp_launch_params(uuid, integer, text, text) TO authenticated;

-- Admin: issue one-time raw token (returned once)
CREATE OR REPLACE FUNCTION public.issue_lsp_one_time_token(
  p_lsp_id uuid,
  p_ttl_seconds integer DEFAULT 900,
  p_emitra_id text DEFAULT NULL,
  p_mobile text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lsp_partners%ROWTYPE;
  v_raw text;
  v_hash text;
  v_ttl integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT * INTO v_row FROM public.lsp_partners WHERE id = p_lsp_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lsp not found';
  END IF;

  v_ttl := LEAST(GREATEST(coalesce(p_ttl_seconds, 900), 60), 900);
  v_raw := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(convert_to(v_raw, 'UTF8'), 'sha256'), 'hex');

  INSERT INTO public.lsp_launch_tokens (lsp_id, token_hash, expires_at, payload)
  VALUES (
    p_lsp_id,
    v_hash,
    now() + make_interval(secs => v_ttl),
    jsonb_strip_nulls(jsonb_build_object('emitra_id', p_emitra_id, 'mobile', p_mobile))
  );

  RETURN jsonb_build_object(
    'lsp', v_row.code,
    'token', v_raw,
    'expires_in', v_ttl,
    'path', '/lsp/entry'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_lsp_one_time_token(uuid, integer, text, text) TO authenticated;

-- Admin: create LSP; returns secret once
CREATE OR REPLACE FUNCTION public.admin_create_lsp(
  p_code text,
  p_name text,
  p_state text DEFAULT 'Rajasthan',
  p_contact_name text DEFAULT NULL,
  p_contact_mobile text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_status text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_id uuid;
  v_code text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  v_code := upper(btrim(p_code));
  v_secret := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.lsp_partners (
    code, name, state, contact_name, contact_mobile, contact_email, status, token_secret
  ) VALUES (
    v_code, btrim(p_name), coalesce(nullif(btrim(p_state), ''), 'Rajasthan'),
    p_contact_name, p_contact_mobile, p_contact_email,
    coalesce(nullif(p_status, ''), 'active'), v_secret
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id,
    'code', v_code,
    'token_secret', v_secret,
    'note', 'Copy token_secret now — it will not be shown again.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_lsp(text, text, text, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_rotate_lsp_secret(p_lsp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_code text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  v_secret := encode(gen_random_bytes(32), 'hex');
  UPDATE public.lsp_partners
  SET token_secret = v_secret, updated_at = now()
  WHERE id = p_lsp_id
  RETURNING code INTO v_code;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'lsp not found';
  END IF;

  RETURN jsonb_build_object(
    'id', p_lsp_id,
    'code', v_code,
    'token_secret', v_secret,
    'note', 'Copy token_secret now — it will not be shown again.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_rotate_lsp_secret(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_lsp_status(p_lsp_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF p_status NOT IN ('pending', 'active', 'suspended') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.lsp_partners SET status = p_status, updated_at = now() WHERE id = p_lsp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_lsp_status(uuid, text) TO authenticated;

-- Seed two Rajasthan pilot LSPs (active)
INSERT INTO public.lsp_partners (code, name, state, status, token_secret, contact_name)
VALUES
  (
    'RJ-CSC-01',
    'Rajasthan CSC Pilot Network',
    'Rajasthan',
    'active',
    encode(gen_random_bytes(32), 'hex'),
    'Pilot Contact'
  ),
  (
    'RJ-EMITRA-01',
    'Rajasthan e-Mitra Aggregator Pilot',
    'Rajasthan',
    'active',
    encode(gen_random_bytes(32), 'hex'),
    'Pilot Contact'
  )
ON CONFLICT (code) DO NOTHING;

-- Partners bind LSP attribution via RPC (not open UPDATE on all columns)
CREATE OR REPLACE FUNCTION public.bind_partner_to_lsp(
  p_lsp_id uuid,
  p_emitra_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lsp public.lsp_partners%ROWTYPE;
  v_profile public.partner_profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_lsp FROM public.lsp_partners WHERE id = p_lsp_id;
  IF NOT FOUND OR v_lsp.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'lsp_not_active');
  END IF;

  SELECT * INTO v_profile FROM public.partner_profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
  END IF;

  IF v_profile.status NOT IN ('approved', 'active') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'partner_not_approved');
  END IF;

  IF p_emitra_id IS NOT NULL AND btrim(p_emitra_id) <> '' THEN
    IF v_profile.emitra_id IS NOT NULL
       AND lower(btrim(v_profile.emitra_id)) <> lower(btrim(p_emitra_id)) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'emitra_mismatch');
    END IF;
  END IF;

  UPDATE public.partner_profiles
  SET
    source_lsp_id = p_lsp_id,
    lsp_verified_at = now(),
    mobile_verified = true,
    emitra_id = CASE
      WHEN (emitra_id IS NULL OR btrim(emitra_id) = '')
           AND p_emitra_id IS NOT NULL AND btrim(p_emitra_id) <> ''
        THEN btrim(p_emitra_id)
      ELSE emitra_id
    END
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object('ok', true, 'lsp_id', p_lsp_id, 'code', v_lsp.code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bind_partner_to_lsp(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_active_lsp_id(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.lsp_partners
  WHERE code = upper(btrim(p_code)) AND status = 'active';
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_active_lsp_id(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
