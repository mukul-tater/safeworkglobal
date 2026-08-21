-- E-Mitra / partner kiosk: fill a worker's GCC journey while remaining
-- signed in as the partner (no session switch to the worker).

CREATE OR REPLACE FUNCTION public.partner_manages_worker(_worker_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _worker_user_id IS NOT NULL
    AND public.has_role(auth.uid(), 'partner'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.worker_profiles wp
      WHERE wp.user_id = _worker_user_id
        AND (
          (
            wp.source_partner_id IS NOT NULL
            AND wp.source_partner_id IN (
              SELECT pp.id FROM public.partner_profiles pp WHERE pp.user_id = auth.uid()
            )
          )
          OR (
            wp.added_by_org_id IS NOT NULL
            AND wp.added_by_org_id IN (
              SELECT p.id FROM public.partners p WHERE p.user_id = auth.uid()
            )
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.partner_manages_worker(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_manages_worker(uuid) TO authenticated;

-- Guard: partners may update the same early-journey fields workers can.
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
    'essentials', 'quiz', 'media', 'identity', 'awaiting_interview', 'bond'
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

  IF NEW.interview_score IS DISTINCT FROM OLD.interview_score
     OR NEW.interview_notes IS DISTINCT FROM OLD.interview_notes
     OR NEW.interview_rated_at IS DISTINCT FROM OLD.interview_rated_at
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

-- worker_verification
DROP POLICY IF EXISTS "Partners manage attributed worker verification" ON public.worker_verification;
CREATE POLICY "Partners manage attributed worker verification"
  ON public.worker_verification FOR ALL TO authenticated
  USING (public.partner_manages_worker(user_id))
  WITH CHECK (public.partner_manages_worker(user_id));

-- quiz
DROP POLICY IF EXISTS "Partners read attributed quiz responses" ON public.worker_skill_quiz_responses;
CREATE POLICY "Partners read attributed quiz responses"
  ON public.worker_skill_quiz_responses FOR SELECT TO authenticated
  USING (public.partner_manages_worker(user_id));

DROP POLICY IF EXISTS "Partners insert attributed quiz responses" ON public.worker_skill_quiz_responses;
CREATE POLICY "Partners insert attributed quiz responses"
  ON public.worker_skill_quiz_responses FOR INSERT TO authenticated
  WITH CHECK (public.partner_manages_worker(user_id));

-- documents
DROP POLICY IF EXISTS "Partners manage attributed worker documents" ON public.worker_documents;
CREATE POLICY "Partners manage attributed worker documents"
  ON public.worker_documents FOR ALL TO authenticated
  USING (public.partner_manages_worker(worker_id))
  WITH CHECK (public.partner_manages_worker(worker_id));

-- skills
DROP POLICY IF EXISTS "Partners manage attributed worker skills" ON public.worker_skills;
CREATE POLICY "Partners manage attributed worker skills"
  ON public.worker_skills FOR ALL TO authenticated
  USING (public.partner_manages_worker(worker_id))
  WITH CHECK (public.partner_manages_worker(worker_id));

-- worker_profiles update (city, skill, etc. — privileged fields still blocked by trigger)
DROP POLICY IF EXISTS "Partners update attributed worker profiles" ON public.worker_profiles;
CREATE POLICY "Partners update attributed worker profiles"
  ON public.worker_profiles FOR UPDATE TO authenticated
  USING (public.partner_manages_worker(user_id))
  WITH CHECK (public.partner_manages_worker(user_id));

DROP POLICY IF EXISTS "Partners insert attributed worker profiles" ON public.worker_profiles;
CREATE POLICY "Partners insert attributed worker profiles"
  ON public.worker_profiles FOR INSERT TO authenticated
  WITH CHECK (public.partner_manages_worker(user_id));

-- profiles (email/name shown on the kiosk form)
DROP POLICY IF EXISTS "Partners update attributed profiles" ON public.profiles;
CREATE POLICY "Partners update attributed profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.partner_manages_worker(id))
  WITH CHECK (public.partner_manages_worker(id));

DROP POLICY IF EXISTS "Partners read attributed profiles" ON public.profiles;
CREATE POLICY "Partners read attributed profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.partner_manages_worker(id));

-- Optional tables: skip if this database has not received later migrations.
CREATE TABLE IF NOT EXISTS public.worker_pre_journey_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  medical jsonb NOT NULL DEFAULT '{}'::jsonb,
  overseas jsonb NOT NULL DEFAULT '{}'::jsonb,
  recruitment jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledgements jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS worker_pre_journey_declarations_user_idx
  ON public.worker_pre_journey_declarations(user_id);
ALTER TABLE public.worker_pre_journey_declarations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workers manage own declarations" ON public.worker_pre_journey_declarations;
CREATE POLICY "Workers manage own declarations"
  ON public.worker_pre_journey_declarations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all declarations" ON public.worker_pre_journey_declarations;
CREATE POLICY "Admins read all declarations"
  ON public.worker_pre_journey_declarations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Partners manage attributed declarations" ON public.worker_pre_journey_declarations;
CREATE POLICY "Partners manage attributed declarations"
  ON public.worker_pre_journey_declarations FOR ALL TO authenticated
  USING (public.partner_manages_worker(user_id))
  WITH CHECK (public.partner_manages_worker(user_id));

DO $$
BEGIN
  IF to_regclass('public.worker_assessment_payments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Partners read attributed assessment payments" ON public.worker_assessment_payments';
    EXECUTE $p$
      CREATE POLICY "Partners read attributed assessment payments"
        ON public.worker_assessment_payments FOR SELECT TO authenticated
        USING (public.partner_manages_worker(user_id))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "Partners insert attributed pending payments" ON public.worker_assessment_payments';
    EXECUTE $p$
      CREATE POLICY "Partners insert attributed pending payments"
        ON public.worker_assessment_payments FOR INSERT TO authenticated
        WITH CHECK (public.partner_manages_worker(user_id) AND status = 'pending')
    $p$;
  END IF;

  IF to_regclass('public.worker_skill_media') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Partners manage attributed skill media" ON public.worker_skill_media';
    EXECUTE $p$
      CREATE POLICY "Partners manage attributed skill media"
        ON public.worker_skill_media FOR ALL TO authenticated
        USING (public.partner_manages_worker(worker_id))
        WITH CHECK (public.partner_manages_worker(worker_id))
    $p$;
  END IF;

  IF to_regclass('public.worker_bond_security') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Partners manage attributed bond security" ON public.worker_bond_security';
    EXECUTE $p$
      CREATE POLICY "Partners manage attributed bond security"
        ON public.worker_bond_security FOR ALL TO authenticated
        USING (public.partner_manages_worker(user_id))
        WITH CHECK (public.partner_manages_worker(user_id))
    $p$;
  END IF;

  IF to_regclass('public.worker_bond_security_files') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Partners manage attributed bond security files" ON public.worker_bond_security_files';
    EXECUTE $p$
      CREATE POLICY "Partners manage attributed bond security files"
        ON public.worker_bond_security_files FOR ALL TO authenticated
        USING (public.partner_manages_worker(user_id))
        WITH CHECK (public.partner_manages_worker(user_id))
    $p$;
  END IF;
END $$;

DROP POLICY IF EXISTS "Partners upload attributed worker documents" ON storage.objects;
CREATE POLICY "Partners upload attributed worker documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('worker-documents', 'worker-videos')
    AND public.partner_manages_worker(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Partners read attributed worker documents" ON storage.objects;
CREATE POLICY "Partners read attributed worker documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('worker-documents', 'worker-videos')
    AND public.partner_manages_worker(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Partners update attributed worker documents" ON storage.objects;
CREATE POLICY "Partners update attributed worker documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('worker-documents', 'worker-videos')
    AND public.partner_manages_worker(((storage.foldername(name))[1])::uuid)
  );
