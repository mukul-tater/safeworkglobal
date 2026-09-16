-- Production locks: payment is mandatory, one Razorpay capture cannot unlock
-- many accounts, demo-admin factory closed, phone-verified account RPCs are
-- service_role only (OTP checked in the phone-verified-account edge function).

-- ---------------------------------------------------------------------------
-- 1) Workers cannot jump to bond / paid / staff stages
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_worker_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  is_subject boolean;
  allowed_worker_stages text[] := ARRAY[
    'essentials', 'find_jobs', 'apply_job', 'quiz', 'media', 'identity',
    'awaiting_interview'
  ];
  paid_or_staff_stages text[] := ARRAY[
    'awaiting_payment', 'trade_test', 'medical', 'bond', 'pdot',
    'deployment', 'gcc_ready'
  ];
BEGIN
  is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  is_subject := auth.uid() IS NOT DISTINCT FROM OLD.user_id
    OR public.partner_manages_worker(OLD.user_id);

  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT is_subject THEN
    RAISE EXCEPTION 'Not allowed to update another worker verification row';
  END IF;

  IF (NEW.interview_score IS DISTINCT FROM OLD.interview_score AND NEW.interview_score IS NOT NULL)
     OR (NEW.interview_notes IS DISTINCT FROM OLD.interview_notes AND NEW.interview_notes IS NOT NULL)
     OR (NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at AND NEW.interview_rated_at IS NOT NULL)
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.gcc_ready_at IS DISTINCT FROM OLD.gcc_ready_at
     OR (NEW.bond_status IS DISTINCT FROM OLD.bond_status AND NEW.bond_status IS DISTINCT FROM 'submitted')
     OR (NEW.medical_status IS DISTINCT FROM OLD.medical_status AND NEW.medical_status IN ('passed', 'failed'))
     OR (NEW.trade_test_status IS DISTINCT FROM OLD.trade_test_status AND NEW.trade_test_status IN ('passed', 'failed'))
  THEN
    RAISE EXCEPTION 'Not allowed to update privileged verification fields';
  END IF;

  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    IF NEW.stage = ANY (paid_or_staff_stages) THEN
      RAISE EXCEPTION 'Payment is required before this journey step';
    END IF;
    IF NOT (NEW.stage = ANY (allowed_worker_stages)) THEN
      RAISE EXCEPTION 'Not allowed to advance verification stage to %', NEW.stage;
    END IF;
  END IF;

  IF NEW.stage = 'gcc_ready' AND OLD.stage IS DISTINCT FROM 'gcc_ready' THEN
    RAISE EXCEPTION 'Not allowed to mark GCC ready';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_on_bond_stage(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.worker_verification
     WHERE user_id = p_user_id
       AND stage = 'bond'
       AND payment_status = 'paid'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2) One Razorpay payment id cannot be applied to a second worker
-- ---------------------------------------------------------------------------
UPDATE public.worker_verification v
SET razorpay_payment_id = NULL
WHERE v.id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY razorpay_payment_id
             ORDER BY paid_at NULLS LAST, updated_at NULLS LAST, id
           ) AS rn
      FROM public.worker_verification
     WHERE razorpay_payment_id IS NOT NULL
       AND length(trim(razorpay_payment_id)) > 0
  ) d
  WHERE d.rn > 1
);

UPDATE public.worker_assessment_payments p
SET provider_ref = NULL
WHERE p.id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY provider_ref
             ORDER BY paid_at NULLS LAST, created_at NULLS LAST, id
           ) AS rn
      FROM public.worker_assessment_payments
     WHERE provider = 'razorpay'
       AND provider_ref IS NOT NULL
       AND length(trim(provider_ref)) > 0
  ) d
  WHERE d.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS worker_verification_razorpay_payment_id_uidx
  ON public.worker_verification (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL AND length(trim(razorpay_payment_id)) > 0;

CREATE UNIQUE INDEX IF NOT EXISTS worker_assessment_payments_razorpay_ref_uidx
  ON public.worker_assessment_payments (provider_ref)
  WHERE provider = 'razorpay'
    AND provider_ref IS NOT NULL
    AND length(trim(provider_ref)) > 0;

CREATE OR REPLACE FUNCTION public.complete_assessment_payment_razorpay(
  p_user_id uuid,
  p_payment_id text,
  p_order_id text,
  p_amount numeric DEFAULT 35400
)
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.worker_verification;
  trade_required boolean;
  next_stage text;
  pay_id text := trim(coalesce(p_payment_id, ''));
  order_id text := trim(coalesce(p_order_id, ''));
BEGIN
  IF p_user_id IS NULL OR pay_id = '' OR order_id = '' THEN
    RAISE EXCEPTION 'Invalid payment payload';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.worker_verification
     WHERE razorpay_payment_id = pay_id
       AND user_id IS DISTINCT FROM p_user_id
  ) THEN
    RAISE EXCEPTION 'Payment already applied to another account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.worker_assessment_payments
     WHERE provider = 'razorpay'
       AND provider_ref = pay_id
       AND user_id IS DISTINCT FROM p_user_id
  ) THEN
    RAISE EXCEPTION 'Payment already applied to another account';
  END IF;

  SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification row not found';
  END IF;

  IF row.payment_status = 'paid' THEN
    RETURN row;
  END IF;

  IF row.stage IS DISTINCT FROM 'awaiting_payment' THEN
    RAISE EXCEPTION 'Payment stage is not active';
  END IF;

  IF row.razorpay_order_id IS NULL OR length(trim(row.razorpay_order_id)) = 0 THEN
    RAISE EXCEPTION 'No Razorpay order bound to this assessment';
  END IF;

  IF trim(row.razorpay_order_id) IS DISTINCT FROM order_id THEN
    RAISE EXCEPTION 'Order does not match this assessment';
  END IF;

  trade_required := COALESCE(row.trade_test_required, true);
  next_stage := CASE WHEN trade_required THEN 'trade_test' ELSE 'medical' END;

  INSERT INTO public.worker_assessment_payments (user_id, amount, status, provider, provider_ref, paid_at)
  VALUES (
    p_user_id,
    COALESCE(row.payment_amount, p_amount, 35400),
    'paid',
    'razorpay',
    pay_id,
    now()
  );

  UPDATE public.worker_verification
  SET
    payment_status = 'paid',
    payment_amount = COALESCE(row.payment_amount, p_amount, 35400),
    paid_at = now(),
    razorpay_payment_id = pay_id,
    razorpay_order_id = order_id,
    trade_test_required = trade_required,
    trade_test_status = CASE
      WHEN trade_required THEN COALESCE(trade_test_status, 'pending')
      ELSE 'not_required'
    END,
    stage = next_stage,
    updated_at = now()
  WHERE id = row.id
  RETURNING * INTO row;

  RETURN row;
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO row FROM public.worker_verification WHERE user_id = p_user_id;
    IF FOUND AND row.payment_status = 'paid' AND row.razorpay_payment_id = pay_id THEN
      RETURN row;
    END IF;
    RAISE EXCEPTION 'Payment already applied to another account';
END;
$$;

REVOKE ALL ON FUNCTION public.complete_assessment_payment_razorpay(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_assessment_payment_razorpay(uuid, text, text, numeric) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Close demo-admin factory and payment/interview waive shortcuts
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.seed_demo_users(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_users(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.seed_demo_users(p_users jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Demo user seeding is disabled';
END;
$$;

REVOKE ALL ON FUNCTION public.waive_assessment_payment_pilot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.waive_assessment_interview_pilot() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.waive_assessment_payment_pilot()
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Payment cannot be skipped';
END;
$$;

CREATE OR REPLACE FUNCTION public.waive_assessment_interview_pilot()
RETURNS public.worker_verification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Interview cannot be skipped';
END;
$$;

REVOKE ALL ON FUNCTION public.waive_assessment_payment_pilot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.waive_assessment_interview_pilot() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Phone-verified account RPCs: service_role only (OTP verified in edge fn)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  TO service_role;

DROP TRIGGER IF EXISTS confirm_mobile_verified_auth_user ON auth.users;
DROP FUNCTION IF EXISTS public.confirm_mobile_verified_auth_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_phone text;
  v_role text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);
  v_role := NEW.raw_user_meta_data->>'role';

  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, mobile_verified)
  VALUES (NEW.id, NEW.email, v_full_name, v_phone, v_avatar_url, false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  IF v_role IS NOT NULL AND v_role IN ('worker', 'employer', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF v_role = 'employer' THEN
      INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'worker' THEN
      INSERT INTO public.worker_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSIF v_role = 'partner' THEN
      INSERT INTO public.partner_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_phone_verified_worker_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_name text := nullif(trim(coalesce(p_full_name, '')), '');
  v_uid uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Account creation must go through verified OTP';
  END IF;

  IF v_email IS NULL OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF p_password IS NULL
     OR length(p_password) < 6
     OR length(p_password) > 72
     OR p_password !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Use letters and numbers only, at least 6 characters. No spaces or symbols.';
  END IF;

  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'A valid 10-digit mobile is required';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = v_phone
  ) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  v_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', coalesce(v_name, split_part(v_email, '@', 1)),
      'phone', v_phone,
      'role', 'worker',
      'mobile_verified', true
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_uid::text,
    now(),
    now(),
    now()
  );

  UPDATE public.profiles
     SET mobile_verified = true, phone = v_phone, updated_at = now()
   WHERE id = v_uid;

  RETURN v_uid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_phone_verified_partner_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_name text := nullif(trim(coalesce(p_full_name, '')), '');
  v_uid uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Account creation must go through verified OTP';
  END IF;

  IF v_email IS NULL OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF p_password IS NULL
     OR length(p_password) < 6
     OR length(p_password) > 72
     OR p_password !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Use letters and numbers only, at least 6 characters. No spaces or symbols.';
  END IF;

  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'A valid 10-digit mobile is required';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = v_phone
  ) THEN
    RAISE EXCEPTION 'already registered';
  END IF;

  v_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', coalesce(v_name, split_part(v_email, '@', 1)),
      'phone', v_phone,
      'role', 'partner',
      'mobile_verified', true
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_uid::text,
    now(),
    now(),
    now()
  );

  UPDATE public.profiles
     SET mobile_verified = true, phone = v_phone, updated_at = now()
   WHERE id = v_uid;

  UPDATE public.partner_profiles
     SET mobile_verified = true
   WHERE user_id = v_uid;

  RETURN v_uid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already registered';
END;
$$;

REVOKE ALL ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_worker_account(text, text, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verified_partner_account(text, text, text, text)
  TO service_role;

-- Clients cannot tick mobile_verified themselves
CREATE OR REPLACE FUNCTION public.guard_profile_mobile_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mobile_verified IS DISTINCT FROM OLD.mobile_verified
     AND NEW.mobile_verified IS TRUE
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    RAISE EXCEPTION 'Mobile verification must be completed via OTP';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_mobile_verified ON public.profiles;
CREATE TRIGGER trg_guard_profile_mobile_verified
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_mobile_verified();

CREATE OR REPLACE FUNCTION public.assign_initial_role(_role app_role)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role IS DISTINCT FROM 'worker'::app_role
     AND _role IS DISTINCT FROM 'employer'::app_role
     AND _role IS DISTINCT FROM 'partner'::app_role THEN
    RAISE EXCEPTION 'Cannot self-assign this role';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'Role already assigned';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, _role);
  IF _role = 'worker'::app_role THEN
    INSERT INTO public.worker_profiles (user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
  ELSIF _role = 'employer'::app_role THEN
    INSERT INTO public.employer_profiles (user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
  ELSIF _role = 'partner'::app_role THEN
    INSERT INTO public.partner_profiles (user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.partner_profile_self_update_allowed(_new public.partner_profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _old public.partner_profiles%ROWTYPE;
  _editable text[] := ARRAY[
    'agency_name','license_number','regions_covered','bio','updated_at',
    'center_name','owner_name','mobile','whatsapp','email','state','district','address','pincode',
    'aadhaar_number','pan_number','aadhaar_front_url','aadhaar_back_url','pan_card_url','shop_photo_url',
    'years_in_operation','services_offered','monthly_footfall',
    'offers_passport_service','offers_doc_scanning','offers_worker_registration',
    'account_holder','account_number','ifsc','upi_id',
    'accepted_terms','accepted_privacy','confirmed_accuracy','current_step','submitted_at',
    'emitra_id','village_city','has_computer','has_scanner','has_printer','has_internet',
    'worker_categories','emitra_certificate_url','address_proof_url','owner_photo_url',
    'compliance_acknowledged_at','no_jobs_promise','no_unauthorized_fees',
    'date_of_birth','google_maps_url',
    'agree_no_misrepresentation','agree_accurate_info','agree_not_sub_agent'
  ];
BEGIN
  SELECT * INTO _old FROM public.partner_profiles WHERE id = _new.id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN (to_jsonb(_new) - _editable) = (to_jsonb(_old) - _editable);
END;
$function$;
