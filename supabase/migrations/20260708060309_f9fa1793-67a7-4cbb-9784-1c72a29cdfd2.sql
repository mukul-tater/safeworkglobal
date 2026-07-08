
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.partner_org_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_verification_status AS ENUM ('unverified','in_review','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assessment_status AS ENUM ('scheduled','checked_in','running','completed','employer_review','approved','rejected','retest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_txn_type AS ENUM ('credit','debit','withdrawal','fee','adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PARTNER TYPES CATALOG ============
CREATE TABLE IF NOT EXISTS public.partner_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_types TO anon, authenticated;
GRANT ALL ON public.partner_types TO service_role;
ALTER TABLE public.partner_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_types public read" ON public.partner_types FOR SELECT USING (true);
CREATE POLICY "partner_types admin manage" ON public.partner_types FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PARTNERS (one per org) ============
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_type_id uuid NOT NULL REFERENCES public.partner_types(id),
  partner_code text UNIQUE,
  status public.partner_org_status NOT NULL DEFAULT 'pending',
  verification_status public.partner_verification_status NOT NULL DEFAULT 'unverified',
  state text,
  district text,
  city text,
  rating numeric(3,2),
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(partner_type_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
GRANT SELECT, INSERT, UPDATE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners self read" ON public.partners FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "partners self insert" ON public.partners FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "partners self update limited" ON public.partners FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "partners admin all" ON public.partners FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PARTNER PROFILES EXT ============
CREATE TABLE IF NOT EXISTS public.partner_profiles_ext (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  owner_name text,
  mobile text,
  email text,
  address text,
  pincode text,
  pan text,
  gst text,
  website text,
  bank jsonb NOT NULL DEFAULT '{}'::jsonb,
  upi text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_profiles_ext TO authenticated;
GRANT ALL ON public.partner_profiles_ext TO service_role;
ALTER TABLE public.partner_profiles_ext ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppe self" ON public.partner_profiles_ext FOR ALL
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "ppe admin" ON public.partner_profiles_ext FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PARTNER DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pdocs_partner ON public.partner_documents(partner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_documents TO authenticated;
GRANT ALL ON public.partner_documents TO service_role;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pdocs self" ON public.partner_documents FOR ALL
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "pdocs admin" ON public.partner_documents FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ WALLETS ============
CREATE TABLE IF NOT EXISTS public.partner_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  available_balance numeric(14,2) NOT NULL DEFAULT 0,
  pending_balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_wallets TO authenticated;
GRANT ALL ON public.partner_wallets TO service_role;
ALTER TABLE public.partner_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet self read" ON public.partner_wallets FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "wallet admin" ON public.partner_wallets FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS public.partner_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  txn_type public.partner_txn_type NOT NULL,
  amount numeric(14,2) NOT NULL,
  reference_type text,
  reference_id uuid,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ptxn_partner ON public.partner_transactions(partner_id);
GRANT SELECT ON public.partner_transactions TO authenticated;
GRANT ALL ON public.partner_transactions TO service_role;
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ptxn self read" ON public.partner_transactions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "ptxn admin" ON public.partner_transactions FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.partner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pnotif_partner ON public.partner_notifications(partner_id);
GRANT SELECT, UPDATE ON public.partner_notifications TO authenticated;
GRANT ALL ON public.partner_notifications TO service_role;
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pnotif self" ON public.partner_notifications FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "pnotif self update" ON public.partner_notifications FOR UPDATE
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "pnotif admin" ON public.partner_notifications FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ ASSIGNMENTS (universal join) ============
CREATE TABLE IF NOT EXISTS public.partner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  assignment_type text NOT NULL, -- worker | employer | assessment | job
  subject_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  assigned_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_passn_partner ON public.partner_assignments(partner_id);
CREATE INDEX IF NOT EXISTS idx_passn_subject ON public.partner_assignments(assignment_type, subject_id);
GRANT SELECT ON public.partner_assignments TO authenticated;
GRANT ALL ON public.partner_assignments TO service_role;
ALTER TABLE public.partner_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passn self" ON public.partner_assignments FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "passn admin" ON public.partner_assignments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PERMISSIONS OVERRIDE ============
CREATE TABLE IF NOT EXISTS public.partner_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_permissions TO authenticated;
GRANT ALL ON public.partner_permissions TO service_role;
ALTER TABLE public.partner_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pperm self" ON public.partner_permissions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "pperm admin" ON public.partner_permissions FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TRADES (SSVN) ============
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trades TO anon, authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trades public read" ON public.trades FOR SELECT USING (true);
CREATE POLICY "trades admin manage" ON public.trades FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ ASSESSMENTS (SSVN) ============
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  employer_id uuid,
  job_id uuid,
  trade_id uuid REFERENCES public.trades(id),
  trade_level text,
  partner_id uuid REFERENCES public.partners(id),
  scheduled_at timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  assessor_name text,
  location text,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score numeric(5,2),
  recommendation text,
  remarks text,
  media jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.assessment_status NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assessments_partner ON public.assessments(partner_id);
CREATE INDEX IF NOT EXISTS idx_assessments_worker ON public.assessments(worker_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
GRANT SELECT, INSERT, UPDATE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assess partner self" ON public.assessments FOR ALL
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "assess worker read" ON public.assessments FOR SELECT
  USING (worker_id = auth.uid());
CREATE POLICY "assess employer read" ON public.assessments FOR SELECT
  USING (employer_id = auth.uid());
CREATE POLICY "assess admin all" ON public.assessments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SEED partner_types ============
INSERT INTO public.partner_types (code, name, description, sort_order) VALUES
  ('SEN','SafeWork E-Mitra Network','Village/city-level worker onboarding partners',10),
  ('SSVN','SafeWork Skill Verification Network','Trade test & skill assessment centres',20),
  ('SRN','SafeWork Recruitment Network','Licensed recruitment agents handling visa & travel',30),
  ('SEN_GLOBAL','SafeWork Employer Network','Partners who bring overseas employers',40)
ON CONFLICT (code) DO NOTHING;

-- ============ SEED trades ============
INSERT INTO public.trades (code, name, sort_order) VALUES
  ('electrician','Electrician',10),
  ('welder','Welder',20),
  ('plumber','Plumber',30),
  ('carpenter','Carpenter',40),
  ('mason','Mason',50),
  ('steel_fixer','Steel Fixer',60),
  ('hvac','HVAC Technician',70),
  ('painter','Painter',80),
  ('helper','Helper',90),
  ('pipe_fitter','Pipe Fitter',100)
ON CONFLICT (code) DO NOTHING;

-- ============ BACKFILL existing E-Mitra partners into partners ============
DO $$
DECLARE
  v_sen_type uuid;
BEGIN
  SELECT id INTO v_sen_type FROM public.partner_types WHERE code='SEN';

  INSERT INTO public.partners (user_id, partner_type_id, partner_code, status, verification_status, state, district, city, created_at)
  SELECT
    pp.user_id, v_sen_type, pp.partner_code,
    CASE pp.status::text
      WHEN 'approved' THEN 'approved'::public.partner_org_status
      WHEN 'rejected' THEN 'rejected'::public.partner_org_status
      WHEN 'suspended' THEN 'suspended'::public.partner_org_status
      ELSE 'pending'::public.partner_org_status
    END,
    CASE WHEN pp.status::text = 'approved' THEN 'verified'::public.partner_verification_status ELSE 'unverified'::public.partner_verification_status END,
    pp.state, NULL, pp.village_city, COALESCE(pp.created_at, now())
  FROM public.partner_profiles pp
  WHERE pp.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.user_id = pp.user_id);

  INSERT INTO public.partner_profiles_ext (partner_id, company_name, owner_name, mobile, email, pan, bank, upi)
  SELECT
    p.id, COALESCE(pp.center_name, 'E-Mitra Center'), pp.owner_name, pp.mobile, pp.email, pp.pan_number,
    jsonb_strip_nulls(jsonb_build_object('holder', pp.account_holder, 'account', pp.account_number, 'ifsc', pp.ifsc)),
    pp.upi_id
  FROM public.partners p
  JOIN public.partner_profiles pp ON pp.user_id = p.user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.partner_profiles_ext e WHERE e.partner_id = p.id);

  INSERT INTO public.partner_wallets (partner_id, available_balance)
  SELECT p.id, 0
  FROM public.partners p
  WHERE NOT EXISTS (SELECT 1 FROM public.partner_wallets w WHERE w.partner_id = p.id);
END $$;

-- ============ updated_at triggers ============
DROP TRIGGER IF EXISTS trg_partners_updated ON public.partners;
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_ppe_updated ON public.partner_profiles_ext;
CREATE TRIGGER trg_ppe_updated BEFORE UPDATE ON public.partner_profiles_ext
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_assess_updated ON public.assessments;
CREATE TRIGGER trg_assess_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RPC: current_partner ============
CREATE OR REPLACE FUNCTION public.current_partner()
RETURNS TABLE (
  id uuid, partner_type_id uuid, partner_type_code text, partner_type_name text,
  partner_code text, status public.partner_org_status,
  verification_status public.partner_verification_status,
  state text, district text, city text, rating numeric,
  company_name text, wallet_available numeric, wallet_pending numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.partner_type_id, pt.code, pt.name,
         p.partner_code, p.status, p.verification_status,
         p.state, p.district, p.city, p.rating,
         ppe.company_name,
         COALESCE(w.available_balance, 0), COALESCE(w.pending_balance, 0)
  FROM public.partners p
  JOIN public.partner_types pt ON pt.id = p.partner_type_id
  LEFT JOIN public.partner_profiles_ext ppe ON ppe.partner_id = p.id
  LEFT JOIN public.partner_wallets w ON w.partner_id = p.id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- ============ RPC: admin_set_partner_status ============
CREATE OR REPLACE FUNCTION public.admin_set_partner_status(
  p_partner_id uuid, p_status public.partner_org_status, p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.partners
     SET status = p_status,
         verification_status = CASE WHEN p_status='approved' THEN 'verified'::public.partner_verification_status ELSE verification_status END,
         approved_at = CASE WHEN p_status='approved' THEN now() ELSE approved_at END,
         approved_by = CASE WHEN p_status='approved' THEN auth.uid() ELSE approved_by END,
         rejection_reason = CASE WHEN p_status='rejected' THEN p_reason ELSE rejection_reason END
   WHERE id = p_partner_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_partner_status(uuid, public.partner_org_status, text) FROM anon;
