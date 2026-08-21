-- Bond & Security submission: state stamp values, worker pack, admin review, PDOT gate.
-- Latest verified files are not hard-deleted; superseded versions are retained with replaced_at.

-- ---------------------------------------------------------------------------
-- 1) Stamp paper configuration (exact configured amounts — do not recalculate)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.state_stamp_paper_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id text NOT NULL UNIQUE,
  state_name text NOT NULL,
  name_hi text,
  state_type text NOT NULL CHECK (state_type IN ('state', 'union_territory')),
  minimum_stamp_value numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  aliases text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_stamp_paper_name
  ON public.state_stamp_paper_values (lower(state_name));

INSERT INTO public.state_stamp_paper_values
  (state_id, state_name, name_hi, state_type, minimum_stamp_value, aliases)
VALUES
  ('andhra-pradesh', 'Andhra Pradesh', 'आंध्र प्रदेश', 'state', 100, ARRAY['Andhra Pradesh']),
  ('arunachal-pradesh', 'Arunachal Pradesh', 'अरुणाचल प्रदेश', 'state', 100, ARRAY['Arunachal Pradesh']),
  ('assam', 'Assam', 'असम', 'state', 100, ARRAY['Assam']),
  ('bihar', 'Bihar', 'बिहार', 'state', 500, ARRAY['Bihar']),
  ('chhattisgarh', 'Chhattisgarh', 'छत्तीसगढ़', 'state', 250, ARRAY['Chhattisgarh']),
  ('goa', 'Goa', 'गोआ', 'state', 100, ARRAY['Goa']),
  ('gujarat', 'Gujarat', 'गुजरात', 'state', 100, ARRAY['Gujarat']),
  ('haryana', 'Haryana', 'हरियाणा', 'state', 100, ARRAY['Haryana']),
  ('himachal-pradesh', 'Himachal Pradesh', 'हिमाचल प्रदेश', 'state', 100, ARRAY['Himachal Pradesh']),
  ('jharkhand', 'Jharkhand', 'झारखंड', 'state', 200, ARRAY['Jharkhand']),
  ('karnataka', 'Karnataka', 'कर्नाटक', 'state', 500, ARRAY['Karnataka']),
  ('kerala', 'Kerala', 'केरल', 'state', 500, ARRAY['Kerala']),
  ('madhya-pradesh', 'Madhya Pradesh', 'मध्य प्रदेश', 'state', 1000, ARRAY['Madhya Pradesh']),
  ('maharashtra', 'Maharashtra', 'महाराष्ट्र', 'state', 500, ARRAY['Maharashtra']),
  ('manipur', 'Manipur', 'मणिपुर', 'state', 100, ARRAY['Manipur']),
  ('meghalaya', 'Meghalaya', 'मेघालय', 'state', 100, ARRAY['Meghalaya']),
  ('mizoram', 'Mizoram', 'मिजोरम', 'state', 100, ARRAY['Mizoram']),
  ('nagaland', 'Nagaland', 'नागालैंड', 'state', 100, ARRAY['Nagaland']),
  ('odisha', 'Odisha', 'ओडिशा', 'state', 100, ARRAY['Odisha']),
  ('punjab', 'Punjab', 'पंजाब', 'state', 100, ARRAY['Punjab']),
  ('rajasthan', 'Rajasthan', 'राजस्थान', 'state', 200, ARRAY['Rajasthan']),
  ('sikkim', 'Sikkim', 'सिक्किम', 'state', 100, ARRAY['Sikkim']),
  ('tamil-nadu', 'Tamil Nadu', 'तमिलनाडु', 'state', 200, ARRAY['Tamil Nadu']),
  ('telangana', 'Telangana', 'तेलंगाना', 'state', 500, ARRAY['Telangana']),
  ('tripura', 'Tripura', 'त्रिपुरा', 'state', 500, ARRAY['Tripura']),
  ('uttar-pradesh', 'Uttar Pradesh', 'उत्तर प्रदेश', 'state', 100, ARRAY['Uttar Pradesh']),
  ('uttarakhand', 'Uttarakhand', 'उत्तराखंड', 'state', 100, ARRAY['Uttarakhand']),
  ('west-bengal', 'West Bengal', 'पश्चिम बंगाल', 'state', 100, ARRAY['West Bengal']),
  ('andaman-nicobar', 'Andaman & Nicobar', 'अंडमान और निकोबार', 'union_territory', 100,
    ARRAY['Andaman & Nicobar','Andaman and Nicobar Islands','Andaman and Nicobar']),
  ('chandigarh', 'Chandigarh', 'चंडीगढ़', 'union_territory', 100, ARRAY['Chandigarh']),
  ('dadra-nagar-haveli', 'Dadra & Nagar Haveli', 'दादरा और नगर हवेली', 'union_territory', 100,
    ARRAY['Dadra & Nagar Haveli','Dadra and Nagar Haveli','Dadra and Nagar Haveli and Daman and Diu']),
  ('daman-diu', 'Daman & Diu', 'दमन और दीव', 'union_territory', 100,
    ARRAY['Daman & Diu','Daman and Diu']),
  ('delhi', 'Delhi', 'दिल्ली', 'union_territory', 100, ARRAY['Delhi','NCT of Delhi']),
  ('jammu-kashmir', 'Jammu & Kashmir', 'जम्मू और कश्मीर', 'union_territory', 500,
    ARRAY['Jammu & Kashmir','Jammu and Kashmir']),
  ('ladakh', 'Ladakh', 'लद्दाख', 'union_territory', 500, ARRAY['Ladakh']),
  ('lakshadweep', 'Lakshadweep', 'लक्षद्वीप', 'union_territory', 500, ARRAY['Lakshadweep']),
  ('puducherry', 'Puducherry', 'पुडुचेरी', 'union_territory', 100, ARRAY['Puducherry','Pondicherry'])
ON CONFLICT (state_id) DO NOTHING;

ALTER TABLE public.state_stamp_paper_values ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.state_stamp_paper_values TO authenticated, anon;
GRANT ALL ON public.state_stamp_paper_values TO service_role;

DROP POLICY IF EXISTS "Anyone can read active stamp values" ON public.state_stamp_paper_values;
CREATE POLICY "Anyone can read active stamp values"
  ON public.state_stamp_paper_values FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage stamp values" ON public.state_stamp_paper_values;
CREATE POLICY "Admins manage stamp values"
  ON public.state_stamp_paper_values FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------------
-- 2) Optional configured cheque amounts on the active bond template
-- ---------------------------------------------------------------------------
ALTER TABLE public.bond_templates
  ADD COLUMN IF NOT EXISTS worker_cheque_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS guarantor_cheque_amount numeric(12,2);

-- ---------------------------------------------------------------------------
-- 3) Worker bond & security pack
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.worker_bond_security (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending','in_progress','submitted','resubmission_required','approved','rejected'
    )),
  rejection_reason text,
  confirmed_state text,
  state_id text,
  applicable_stamp_value numeric(12,2),
  stamp_currency text NOT NULL DEFAULT 'INR',
  state_confirmed boolean NOT NULL DEFAULT false,
  state_confirmed_at timestamptz,
  bond_file_path text,
  bond_file_name text,
  bond_uploaded_at timestamptz,
  bond_doc_status text NOT NULL DEFAULT 'pending'
    CHECK (bond_doc_status IN ('pending','uploaded','verified','rejected')),
  courier_company text,
  tracking_number text,
  courier_date date,
  courier_receipt_path text,
  courier_receipt_name text,
  courier_status text NOT NULL DEFAULT 'pending'
    CHECK (courier_status IN ('pending','couriered','received','verified','rejected')),
  worker_cheque_holder_name text,
  worker_cheque_bank_name text,
  worker_cheque_number text,
  worker_cheque_date date,
  worker_cheque_amount numeric(12,2),
  worker_cheque_path text,
  worker_cheque_name text,
  guarantor_full_name text,
  guarantor_relationship text,
  guarantor_mobile text,
  guarantor_address text,
  guarantor_bank_name text,
  guarantor_cheque_holder_name text,
  guarantor_cheque_number text,
  guarantor_cheque_date date,
  guarantor_cheque_amount numeric(12,2),
  guarantor_cheque_path text,
  guarantor_cheque_name text,
  guarantor_declaration_accepted_at timestamptz,
  guarantor_otp_verified boolean NOT NULL DEFAULT false,
  guarantor_otp_verified_at timestamptz,
  authenticity_declared_at timestamptz,
  no_guarantee_declared_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_bond_security_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.worker_bond_security(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('bond','courier_receipt','worker_cheque','guarantor_cheque')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  replaced_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wbs_user ON public.worker_bond_security(user_id);
CREATE INDEX IF NOT EXISTS idx_wbs_status ON public.worker_bond_security(status);
CREATE INDEX IF NOT EXISTS idx_wbsf_submission ON public.worker_bond_security_files(submission_id, kind);

ALTER TABLE public.worker_bond_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_bond_security_files ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.worker_bond_security TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.worker_bond_security_files TO authenticated;
GRANT ALL ON public.worker_bond_security TO service_role;
GRANT ALL ON public.worker_bond_security_files TO service_role;

DROP POLICY IF EXISTS "Workers read own bond security" ON public.worker_bond_security;
CREATE POLICY "Workers read own bond security"
  ON public.worker_bond_security FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers insert own bond security" ON public.worker_bond_security;
CREATE POLICY "Workers insert own bond security"
  ON public.worker_bond_security FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers update own bond security drafts" ON public.worker_bond_security;
CREATE POLICY "Workers update own bond security drafts"
  ON public.worker_bond_security FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('pending','in_progress','resubmission_required','rejected')
  )
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage bond security" ON public.worker_bond_security;
CREATE POLICY "Admins manage bond security"
  ON public.worker_bond_security FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers read own bond security files" ON public.worker_bond_security_files;
CREATE POLICY "Workers read own bond security files"
  ON public.worker_bond_security_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers insert own bond security files" ON public.worker_bond_security_files;
CREATE POLICY "Workers insert own bond security files"
  ON public.worker_bond_security_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers update own bond security files" ON public.worker_bond_security_files;
CREATE POLICY "Workers update own bond security files"
  ON public.worker_bond_security_files FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage bond security files" ON public.worker_bond_security_files;
CREATE POLICY "Admins manage bond security files"
  ON public.worker_bond_security_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers delete own bond security" ON public.worker_bond_security;
CREATE POLICY "Workers delete own bond security"
  ON public.worker_bond_security FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers delete own bond security files" ON public.worker_bond_security_files;
CREATE POLICY "Workers delete own bond security files"
  ON public.worker_bond_security_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_worker_bond_security_updated_at
  BEFORE UPDATE ON public.worker_bond_security
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4) Widen worker_verification.bond_status
-- ---------------------------------------------------------------------------
ALTER TABLE public.worker_verification
  DROP CONSTRAINT IF EXISTS worker_verification_bond_status_check;

ALTER TABLE public.worker_verification
  ADD CONSTRAINT worker_verification_bond_status_check
  CHECK (bond_status = ANY (ARRAY[
    'pending','in_progress','submitted','resubmission_required','approved','rejected'
  ]));

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS bond_rejection_reason text;

-- Allow workers to persist in_progress via RPCs (bypass). Direct client still cannot
-- set approved / rejected / resubmission_required / bond_received_at.

-- ---------------------------------------------------------------------------
-- 5) Lookup + ensure helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_stamp_paper(p_state text)
RETURNS TABLE (
  state_id text,
  state_name text,
  name_hi text,
  state_type text,
  minimum_stamp_value numeric,
  currency text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.state_id, s.state_name, s.name_hi, s.state_type, s.minimum_stamp_value, s.currency
    FROM public.state_stamp_paper_values s
   WHERE s.active
     AND p_state IS NOT NULL
     AND btrim(p_state) <> ''
     AND (
       lower(s.state_name) = lower(btrim(p_state))
       OR EXISTS (
         SELECT 1 FROM unnest(s.aliases) a
          WHERE lower(a) = lower(btrim(p_state))
       )
     )
   ORDER BY s.state_name
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.worker_on_bond_stage(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.worker_verification
     WHERE user_id = p_user_id AND stage = 'bond'
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_worker_bond_security(p_user_id uuid)
RETURNS public.worker_bond_security
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.worker_bond_security;
BEGIN
  SELECT * INTO rec FROM public.worker_bond_security WHERE user_id = p_user_id;
  IF rec.id IS NOT NULL THEN
    RETURN rec;
  END IF;
  INSERT INTO public.worker_bond_security (user_id)
  VALUES (p_user_id)
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) Worker RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.worker_upsert_bond_security(p_payload jsonb)
RETURNS public.worker_bond_security
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.worker_bond_security;
  wv public.worker_verification;
  stamp_id text;
  stamp_val numeric;
  stamp_cur text;
  locked boolean;
  next_status text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.worker_on_bond_stage(uid) THEN
    RAISE EXCEPTION 'Bond & Security is only available after medical is passed';
  END IF;

  SELECT * INTO wv FROM public.worker_verification WHERE user_id = uid;
  rec := public.ensure_worker_bond_security(uid);
  locked := rec.status IN ('submitted','approved');
  IF locked THEN
    RAISE EXCEPTION 'Documents are under verification and cannot be edited';
  END IF;

  SELECT s.state_id, s.minimum_stamp_value, s.currency
    INTO stamp_id, stamp_val, stamp_cur
    FROM public.lookup_stamp_paper(wv.state) s;

  IF p_payload ? 'guarantor_mobile'
     AND NULLIF(btrim(p_payload->>'guarantor_mobile'), '') IS DISTINCT FROM rec.guarantor_mobile THEN
    rec.guarantor_otp_verified := false;
    rec.guarantor_otp_verified_at := NULL;
  END IF;

  UPDATE public.worker_bond_security SET
    confirmed_state = COALESCE(wv.state, confirmed_state),
    state_id = COALESCE(stamp_id, state_id),
    applicable_stamp_value = COALESCE(stamp_val, applicable_stamp_value),
    stamp_currency = COALESCE(stamp_cur, stamp_currency),
    state_confirmed = CASE
      WHEN COALESCE((p_payload->>'state_confirmed')::boolean, false)
           AND wv.state IS NOT NULL
           AND stamp_id IS NOT NULL
      THEN true ELSE state_confirmed END,
    state_confirmed_at = CASE
      WHEN COALESCE((p_payload->>'state_confirmed')::boolean, false)
           AND wv.state IS NOT NULL
           AND stamp_id IS NOT NULL
           AND NOT state_confirmed
      THEN now() ELSE state_confirmed_at END,
    courier_company = COALESCE(NULLIF(btrim(p_payload->>'courier_company'), ''), courier_company),
    tracking_number = COALESCE(NULLIF(btrim(p_payload->>'tracking_number'), ''), tracking_number),
    courier_date = COALESCE((p_payload->>'courier_date')::date, courier_date),
    courier_status = CASE
      WHEN NULLIF(btrim(p_payload->>'tracking_number'), '') IS NOT NULL
           AND courier_status = 'pending'
      THEN 'couriered' ELSE courier_status END,
    worker_cheque_holder_name = COALESCE(NULLIF(btrim(p_payload->>'worker_cheque_holder_name'), ''), worker_cheque_holder_name),
    worker_cheque_bank_name = COALESCE(NULLIF(btrim(p_payload->>'worker_cheque_bank_name'), ''), worker_cheque_bank_name),
    worker_cheque_number = COALESCE(NULLIF(btrim(p_payload->>'worker_cheque_number'), ''), worker_cheque_number),
    worker_cheque_date = COALESCE((p_payload->>'worker_cheque_date')::date, worker_cheque_date),
    worker_cheque_amount = COALESCE((p_payload->>'worker_cheque_amount')::numeric, worker_cheque_amount),
    guarantor_full_name = COALESCE(NULLIF(btrim(p_payload->>'guarantor_full_name'), ''), guarantor_full_name),
    guarantor_relationship = COALESCE(NULLIF(btrim(p_payload->>'guarantor_relationship'), ''), guarantor_relationship),
    guarantor_mobile = COALESCE(NULLIF(btrim(p_payload->>'guarantor_mobile'), ''), guarantor_mobile),
    guarantor_address = COALESCE(NULLIF(btrim(p_payload->>'guarantor_address'), ''), guarantor_address),
    guarantor_bank_name = COALESCE(NULLIF(btrim(p_payload->>'guarantor_bank_name'), ''), guarantor_bank_name),
    guarantor_cheque_holder_name = COALESCE(NULLIF(btrim(p_payload->>'guarantor_cheque_holder_name'), ''), guarantor_cheque_holder_name),
    guarantor_cheque_number = COALESCE(NULLIF(btrim(p_payload->>'guarantor_cheque_number'), ''), guarantor_cheque_number),
    guarantor_cheque_date = COALESCE((p_payload->>'guarantor_cheque_date')::date, guarantor_cheque_date),
    guarantor_cheque_amount = COALESCE((p_payload->>'guarantor_cheque_amount')::numeric, guarantor_cheque_amount),
    guarantor_declaration_accepted_at = CASE
      WHEN COALESCE((p_payload->>'guarantor_declaration')::boolean, false)
      THEN COALESCE(guarantor_declaration_accepted_at, now())
      ELSE guarantor_declaration_accepted_at END,
    authenticity_declared_at = CASE
      WHEN COALESCE((p_payload->>'authenticity_declared')::boolean, false)
      THEN COALESCE(authenticity_declared_at, now())
      ELSE authenticity_declared_at END,
    no_guarantee_declared_at = CASE
      WHEN COALESCE((p_payload->>'no_guarantee_declared')::boolean, false)
      THEN COALESCE(no_guarantee_declared_at, now())
      ELSE no_guarantee_declared_at END,
    guarantor_otp_verified = rec.guarantor_otp_verified,
    guarantor_otp_verified_at = rec.guarantor_otp_verified_at,
    status = CASE WHEN status IN ('pending','rejected') THEN 'in_progress' ELSE status END,
    updated_at = now()
  WHERE user_id = uid
  RETURNING * INTO rec;

  next_status := rec.status;
  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_status = CASE
           WHEN bond_status IN ('submitted','approved') THEN bond_status
           WHEN next_status = 'resubmission_required' THEN 'resubmission_required'
           ELSE 'in_progress' END,
         bond_courier_tracking = COALESCE(rec.tracking_number, bond_courier_tracking),
         bond_couriered_at = CASE
           WHEN rec.tracking_number IS NOT NULL THEN COALESCE(bond_couriered_at, now())
           ELSE bond_couriered_at END,
         updated_at = now()
   WHERE user_id = uid;

  RETURN rec;
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_attach_bond_security_file(
  p_kind text,
  p_path text,
  p_file_name text,
  p_file_size bigint DEFAULT NULL
) RETURNS public.worker_bond_security
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.worker_bond_security;
  prefix text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.worker_on_bond_stage(uid) THEN
    RAISE EXCEPTION 'Bond & Security is only available after medical is passed';
  END IF;
  IF p_kind NOT IN ('bond','courier_receipt','worker_cheque','guarantor_cheque') THEN
    RAISE EXCEPTION 'Invalid document kind';
  END IF;
  prefix := uid::text || '/bond-security/';
  IF p_path IS NULL OR position(prefix in p_path) <> 1 OR p_path LIKE '%..%' THEN
    RAISE EXCEPTION 'Invalid storage path';
  END IF;

  rec := public.ensure_worker_bond_security(uid);
  IF rec.status IN ('submitted','approved') THEN
    RAISE EXCEPTION 'Documents are under verification and cannot be replaced';
  END IF;

  UPDATE public.worker_bond_security_files
     SET replaced_at = now()
   WHERE submission_id = rec.id
     AND kind = p_kind
     AND replaced_at IS NULL
     AND deleted_at IS NULL;

  INSERT INTO public.worker_bond_security_files
    (submission_id, user_id, kind, storage_path, file_name, file_size)
  VALUES (rec.id, uid, p_kind, p_path, COALESCE(NULLIF(btrim(p_file_name), ''), p_kind), p_file_size);

  UPDATE public.worker_bond_security SET
    bond_file_path = CASE WHEN p_kind = 'bond' THEN p_path ELSE bond_file_path END,
    bond_file_name = CASE WHEN p_kind = 'bond' THEN p_file_name ELSE bond_file_name END,
    bond_uploaded_at = CASE WHEN p_kind = 'bond' THEN now() ELSE bond_uploaded_at END,
    bond_doc_status = CASE WHEN p_kind = 'bond' THEN 'uploaded' ELSE bond_doc_status END,
    courier_receipt_path = CASE WHEN p_kind = 'courier_receipt' THEN p_path ELSE courier_receipt_path END,
    courier_receipt_name = CASE WHEN p_kind = 'courier_receipt' THEN p_file_name ELSE courier_receipt_name END,
    worker_cheque_path = CASE WHEN p_kind = 'worker_cheque' THEN p_path ELSE worker_cheque_path END,
    worker_cheque_name = CASE WHEN p_kind = 'worker_cheque' THEN p_file_name ELSE worker_cheque_name END,
    guarantor_cheque_path = CASE WHEN p_kind = 'guarantor_cheque' THEN p_path ELSE guarantor_cheque_path END,
    guarantor_cheque_name = CASE WHEN p_kind = 'guarantor_cheque' THEN p_file_name ELSE guarantor_cheque_name END,
    status = CASE WHEN status IN ('pending','rejected') THEN 'in_progress' ELSE status END,
    updated_at = now()
  WHERE user_id = uid
  RETURNING * INTO rec;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_status = CASE
           WHEN bond_status IN ('submitted','approved') THEN bond_status
           ELSE 'in_progress' END,
         updated_at = now()
   WHERE user_id = uid;

  RETURN rec;
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_confirm_guarantor_otp(p_mobile text)
RETURNS public.worker_bond_security
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.worker_bond_security;
  worker_phone text;
  mobile text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.worker_on_bond_stage(uid) THEN
    RAISE EXCEPTION 'Bond & Security is only available after medical is passed';
  END IF;

  mobile := regexp_replace(COALESCE(p_mobile, ''), '\D', '', 'g');
  IF length(mobile) > 10 THEN
    mobile := right(mobile, 10);
  END IF;
  IF mobile !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Enter a valid 10-digit Indian mobile number';
  END IF;

  SELECT regexp_replace(COALESCE(phone, ''), '\D', '', 'g') INTO worker_phone
    FROM public.profiles WHERE id = uid;
  IF length(COALESCE(worker_phone, '')) > 10 THEN
    worker_phone := right(worker_phone, 10);
  END IF;
  IF worker_phone IS NOT NULL AND worker_phone = mobile THEN
    RAISE EXCEPTION 'Guarantor mobile cannot be the same as the worker mobile';
  END IF;

  rec := public.ensure_worker_bond_security(uid);
  IF rec.status IN ('submitted','approved') THEN
    RAISE EXCEPTION 'Documents are under verification and cannot be edited';
  END IF;
  IF regexp_replace(COALESCE(rec.guarantor_mobile, ''), '\D', '', 'g') IS DISTINCT FROM mobile
     AND right(regexp_replace(COALESCE(rec.guarantor_mobile, ''), '\D', '', 'g'), 10) IS DISTINCT FROM mobile THEN
    RAISE EXCEPTION 'Verify the same mobile number saved in guarantor details';
  END IF;

  UPDATE public.worker_bond_security
     SET guarantor_mobile = mobile,
         guarantor_otp_verified = true,
         guarantor_otp_verified_at = now(),
         status = CASE WHEN status IN ('pending','rejected') THEN 'in_progress' ELSE status END,
         updated_at = now()
   WHERE user_id = uid
   RETURNING * INTO rec;

  RETURN rec;
END;
$$;

CREATE OR REPLACE FUNCTION public.worker_submit_bond_security()
RETURNS public.worker_bond_security
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.worker_bond_security;
  wv public.worker_verification;
  stamp_id text;
  stamp_val numeric;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.worker_on_bond_stage(uid) THEN
    RAISE EXCEPTION 'Bond & Security is only available after medical is passed';
  END IF;

  SELECT * INTO wv FROM public.worker_verification WHERE user_id = uid;
  rec := public.ensure_worker_bond_security(uid);
  SELECT s.state_id, s.minimum_stamp_value
    INTO stamp_id, stamp_val
    FROM public.lookup_stamp_paper(wv.state) s;

  IF stamp_id IS NULL THEN
    RAISE EXCEPTION 'Update your registered state before submitting';
  END IF;
  IF rec.state_confirmed IS NOT TRUE THEN
    RAISE EXCEPTION 'Confirm your registered state before submitting';
  END IF;
  IF rec.bond_file_path IS NULL THEN
    RAISE EXCEPTION 'Upload the stamp paper / bond first';
  END IF;
  IF rec.tracking_number IS NULL OR rec.courier_company IS NULL OR rec.courier_receipt_path IS NULL THEN
    RAISE EXCEPTION 'Enter courier details and upload the courier receipt';
  END IF;
  IF rec.worker_cheque_path IS NULL OR rec.worker_cheque_holder_name IS NULL OR rec.worker_cheque_bank_name IS NULL OR rec.worker_cheque_number IS NULL THEN
    RAISE EXCEPTION 'Upload the worker security cheque and complete cheque details';
  END IF;
  IF rec.guarantor_full_name IS NULL OR rec.guarantor_relationship IS NULL
     OR rec.guarantor_mobile IS NULL OR rec.guarantor_address IS NULL THEN
    RAISE EXCEPTION 'Complete guarantor details';
  END IF;
  IF rec.guarantor_cheque_path IS NULL OR rec.guarantor_bank_name IS NULL
     OR rec.guarantor_cheque_holder_name IS NULL OR rec.guarantor_cheque_number IS NULL THEN
    RAISE EXCEPTION 'Upload the guarantor security cheque and complete cheque details';
  END IF;
  IF rec.guarantor_declaration_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Guarantor declaration is required';
  END IF;
  IF rec.guarantor_otp_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Guarantor mobile OTP verification is required';
  END IF;
  IF rec.authenticity_declared_at IS NULL OR rec.no_guarantee_declared_at IS NULL THEN
    RAISE EXCEPTION 'Accept both final declarations before submitting';
  END IF;

  UPDATE public.worker_bond_security
     SET status = 'submitted',
         submitted_at = now(),
         rejection_reason = NULL,
         confirmed_state = wv.state,
         state_id = stamp_id,
         applicable_stamp_value = stamp_val,
         updated_at = now()
   WHERE user_id = uid
   RETURNING * INTO rec;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_status = 'submitted',
         bond_rejection_reason = NULL,
         bond_courier_tracking = rec.tracking_number,
         bond_couriered_at = COALESCE(bond_couriered_at, now()),
         updated_at = now()
   WHERE user_id = uid;

  -- Do not advance stage. Stay on bond until admin approve + original received.
  RETURN rec;
END;
$$;

-- Keep existing tracking RPC in sync with the new pack (workers who only enter AWB).
CREATE OR REPLACE FUNCTION public.worker_submit_bond_tracking(p_tracking text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec public.worker_bond_security;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_tracking IS NULL OR length(btrim(p_tracking)) < 4 THEN
    RAISE EXCEPTION 'Enter a valid courier tracking number';
  END IF;
  IF NOT public.worker_on_bond_stage(auth.uid()) THEN
    RAISE EXCEPTION 'Bond & Security is only available after medical is passed';
  END IF;

  rec := public.ensure_worker_bond_security(auth.uid());
  IF rec.status IN ('submitted','approved') THEN
    RAISE EXCEPTION 'Documents are under verification and cannot be edited';
  END IF;

  UPDATE public.worker_bond_security
     SET tracking_number = btrim(p_tracking),
         courier_status = CASE WHEN courier_status = 'pending' THEN 'couriered' ELSE courier_status END,
         status = CASE WHEN status IN ('pending','rejected') THEN 'in_progress' ELSE status END,
         updated_at = now()
   WHERE user_id = auth.uid();

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET bond_courier_tracking = btrim(p_tracking),
         bond_couriered_at = now(),
         bond_status = CASE
           WHEN bond_status IN ('submitted','approved') THEN bond_status
           ELSE 'in_progress' END,
         updated_at = now()
   WHERE user_id = auth.uid();
END; $$;

-- ---------------------------------------------------------------------------
-- 7) Admin RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_review_bond_security(
  p_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.worker_bond_security;
  act text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  act := lower(btrim(p_action));
  IF act NOT IN ('approve','reject','resubmission') THEN
    RAISE EXCEPTION 'Unknown action';
  END IF;
  IF act IN ('reject','resubmission') AND (p_reason IS NULL OR length(btrim(p_reason)) < 4) THEN
    RAISE EXCEPTION 'Reason for rejection is required';
  END IF;

  rec := public.ensure_worker_bond_security(p_user_id);

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  IF act = 'approve' THEN
    IF rec.bond_file_path IS NULL OR rec.worker_cheque_path IS NULL OR rec.guarantor_cheque_path IS NULL THEN
      RAISE EXCEPTION 'Required security documents are missing';
    END IF;
    UPDATE public.worker_bond_security
       SET status = 'approved',
           approved_at = now(),
           approved_by = auth.uid(),
           rejection_reason = NULL,
           bond_doc_status = 'verified',
           updated_at = now()
     WHERE user_id = p_user_id;
    UPDATE public.worker_verification
       SET bond_status = 'approved',
           bond_rejection_reason = NULL,
           updated_at = now()
     WHERE user_id = p_user_id;
    -- Stay on bond until original is marked received.
  ELSE
    UPDATE public.worker_bond_security
       SET status = 'resubmission_required',
           rejection_reason = btrim(p_reason),
           submitted_at = NULL,
           approved_at = NULL,
           approved_by = NULL,
           bond_doc_status = CASE WHEN act = 'reject' THEN 'rejected' ELSE bond_doc_status END,
           updated_at = now()
     WHERE user_id = p_user_id;
    UPDATE public.worker_verification
       SET bond_status = 'resubmission_required',
           bond_rejection_reason = btrim(p_reason),
           updated_at = now()
     WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.admin_actions (admin_id, target_type, target_id, action, reason, metadata)
  VALUES (
    auth.uid(),
    'worker_bond_security',
    rec.id,
    CASE act
      WHEN 'approve' THEN 'bond_security_approve'
      WHEN 'reject' THEN 'bond_security_reject'
      ELSE 'bond_security_resubmission'
    END,
    NULLIF(btrim(COALESCE(p_reason, '')), ''),
    jsonb_build_object('worker_user_id', p_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_bond_received(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec public.worker_bond_security;
  wv public.worker_verification;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO wv FROM public.worker_verification WHERE user_id = p_user_id;
  rec := public.ensure_worker_bond_security(p_user_id);

  IF COALESCE(wv.bond_status, '') <> 'approved' OR rec.status <> 'approved' THEN
    RAISE EXCEPTION 'Approve bond and security documents before marking the original received';
  END IF;
  IF rec.worker_cheque_path IS NULL OR rec.guarantor_cheque_path IS NULL OR rec.bond_file_path IS NULL THEN
    RAISE EXCEPTION 'Required security documents are not verified';
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_bond_security
     SET courier_status = 'received',
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Ready for final deployment processing in this pipeline = PDOT.
  UPDATE public.worker_verification
     SET bond_received_at = now(),
         bond_status = 'approved',
         stage = 'pdot',
         updated_at = now()
   WHERE user_id = p_user_id;

  INSERT INTO public.admin_actions (admin_id, target_type, target_id, action, reason, metadata)
  VALUES (
    auth.uid(),
    'worker_bond_security',
    rec.id,
    'bond_security_original_received',
    NULL,
    jsonb_build_object('worker_user_id', p_user_id)
  );
END; $$;

-- ---------------------------------------------------------------------------
-- 8) Guard: workers may set in_progress via RPC only (bypass). Direct updates
--    still cannot set approved/rejected/resubmission/received.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_worker_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  allowed_worker_stages text[] := ARRAY[
    'essentials', 'quiz', 'media', 'identity', 'awaiting_interview', 'bond'
  ];
  allowed_worker_bond_status text[] := ARRAY['pending', 'in_progress', 'submitted'];
BEGIN
  IF current_setting('app.verification_guard_bypass', true) = '1' THEN
    RETURN NEW;
  END IF;

  is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to update another worker verification row';
  END IF;

  IF NEW.interview_score IS DISTINCT FROM OLD.interview_score
     OR NEW.interview_notes IS DISTINCT FROM OLD.interview_notes
     OR NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.gcc_ready_at IS DISTINCT FROM OLD.gcc_ready_at
     OR NEW.kyc_verified_at IS DISTINCT FROM OLD.kyc_verified_at
     OR (NEW.kyc_status IS DISTINCT FROM OLD.kyc_status AND NEW.kyc_status IS DISTINCT FROM 'submitted')
     OR NEW.interview_scheduled_at IS DISTINCT FROM OLD.interview_scheduled_at
     OR NEW.interview_meeting_url IS DISTINCT FROM OLD.interview_meeting_url
     OR NEW.interviewer_user_id IS DISTINCT FROM OLD.interviewer_user_id
     OR NEW.interview_status IS DISTINCT FROM OLD.interview_status
     OR NEW.interview_attempts IS DISTINCT FROM OLD.interview_attempts
     OR NEW.trade_test_scheduled_at IS DISTINCT FROM OLD.trade_test_scheduled_at
     OR NEW.trade_test_place IS DISTINCT FROM OLD.trade_test_place
     OR NEW.medical_scheduled_at IS DISTINCT FROM OLD.medical_scheduled_at
     OR NEW.medical_place IS DISTINCT FROM OLD.medical_place
     OR NEW.bond_received_at IS DISTINCT FROM OLD.bond_received_at
     OR NEW.pdot_status IS DISTINCT FROM OLD.pdot_status
     OR NEW.pdot_completed_at IS DISTINCT FROM OLD.pdot_completed_at
     OR NEW.deploy_offer_status IS DISTINCT FROM OLD.deploy_offer_status
     OR NEW.deploy_contract_status IS DISTINCT FROM OLD.deploy_contract_status
     OR NEW.deploy_emigration_status IS DISTINCT FROM OLD.deploy_emigration_status
     OR NEW.deploy_visa_status IS DISTINCT FROM OLD.deploy_visa_status
     OR NEW.deploy_insurance_status IS DISTINCT FROM OLD.deploy_insurance_status
     OR NEW.deploy_ticket_status IS DISTINCT FROM OLD.deploy_ticket_status
     OR NEW.deployed_at IS DISTINCT FROM OLD.deployed_at
     OR (NEW.bond_status IS DISTINCT FROM OLD.bond_status
         AND NOT (NEW.bond_status = ANY (allowed_worker_bond_status)))
     OR (NEW.medical_status IS DISTINCT FROM OLD.medical_status AND NEW.medical_status IN ('passed', 'failed'))
     OR (NEW.trade_test_status IS DISTINCT FROM OLD.trade_test_status AND NEW.trade_test_status IN ('passed', 'failed'))
  THEN
    RAISE EXCEPTION 'Not allowed to update privileged verification fields';
  END IF;

  IF NEW.stage IS DISTINCT FROM OLD.stage
     AND NOT (NEW.stage = ANY (allowed_worker_stages))
  THEN
    RAISE EXCEPTION 'Not allowed to advance verification stage to %', NEW.stage;
  END IF;

  IF NEW.stage = 'gcc_ready' AND OLD.stage IS DISTINCT FROM 'gcc_ready' THEN
    RAISE EXCEPTION 'Not allowed to mark GCC ready';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 9) Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.lookup_stamp_paper(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_on_bond_stage(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_worker_bond_security(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_upsert_bond_security(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_attach_bond_security_file(text, text, text, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_confirm_guarantor_otp(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_submit_bond_security() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.worker_submit_bond_tracking(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_bond_security(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_bond_received(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.lookup_stamp_paper(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_upsert_bond_security(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_attach_bond_security_file(text, text, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_confirm_guarantor_otp(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_submit_bond_security() TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_submit_bond_tracking(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_bond_security(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_bond_received(uuid) TO authenticated;
