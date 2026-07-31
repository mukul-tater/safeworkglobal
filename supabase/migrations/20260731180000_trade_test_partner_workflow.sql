-- SafeWork Trade Test Partner Workflow
-- Centres, assessment lifecycle, SOP scores, evidence media, quality review.

-- 1) Authorized trade test centres (location names only — no partner brand on public UI)
CREATE TABLE IF NOT EXISTS public.trade_test_centers (
  id text PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  reporting_window text NOT NULL DEFAULT '9:00 AM – 10:00 AM',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_test_centers_state ON public.trade_test_centers(state);
CREATE INDEX IF NOT EXISTS idx_trade_test_centers_partner ON public.trade_test_centers(partner_id);

ALTER TABLE public.trade_test_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ttc public read active" ON public.trade_test_centers;
CREATE POLICY "ttc public read active" ON public.trade_test_centers
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ttc admin manage" ON public.trade_test_centers;
CREATE POLICY "ttc admin manage" ON public.trade_test_centers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.trade_test_centers TO authenticated;
GRANT ALL ON public.trade_test_centers TO service_role;

INSERT INTO public.trade_test_centers (id, name, city, state) VALUES
  ('jaipur', 'Trade Test Center — Jaipur', 'Jaipur', 'Rajasthan'),
  ('delhi', 'Trade Test Center — Delhi', 'Delhi', 'Delhi'),
  ('mumbai', 'Trade Test Center — Mumbai', 'Mumbai', 'Maharashtra'),
  ('hyderabad', 'Trade Test Center — Hyderabad', 'Hyderabad', 'Telangana'),
  ('lucknow', 'Trade Test Center — Lucknow', 'Lucknow', 'Uttar Pradesh'),
  ('kochi', 'Trade Test Center — Kochi', 'Kochi', 'Kerala')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  state = EXCLUDED.state;

-- 2) Enum values are added in 20260731175900_assessment_status_enum_trade_test.sql
--    (must be a separate committed transaction before this file runs).

-- 3) Extend assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS worker_verification_id uuid,
  ADD COLUMN IF NOT EXISTS trade_test_center_id text REFERENCES public.trade_test_centers(id),
  ADD COLUMN IF NOT EXISTS appointment_date date,
  ADD COLUMN IF NOT EXISTS reporting_window text DEFAULT '9:00 AM – 10:00 AM',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS centre_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS aadhaar_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_match_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attendance_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_photo_path text,
  ADD COLUMN IF NOT EXISTS kyc_video_path text,
  ADD COLUMN IF NOT EXISTS kyc_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS docs_experience_ok boolean,
  ADD COLUMN IF NOT EXISTS docs_passport_ok boolean,
  ADD COLUMN IF NOT EXISTS docs_notes text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS quality_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS quality_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quality_notes text;

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_outcome_check;
ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_outcome_check
  CHECK (outcome IS NULL OR outcome IN ('pass', 'conditional_pass', 'fail'));

CREATE INDEX IF NOT EXISTS idx_assessments_center ON public.assessments(trade_test_center_id);
CREATE INDEX IF NOT EXISTS idx_assessments_verification ON public.assessments(worker_verification_id);
CREATE INDEX IF NOT EXISTS idx_assessments_outcome ON public.assessments(outcome);

-- Employers may read completed pass/conditional reports for applicants (not only employer_id FK)
DROP POLICY IF EXISTS "assess employer read" ON public.assessments;
CREATE POLICY "assess employer read" ON public.assessments FOR SELECT TO authenticated
  USING (
    employer_id = auth.uid()
    OR (
      status = 'completed'
      AND outcome IN ('pass', 'conditional_pass')
      AND worker_id IN (
        SELECT ja.worker_id FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE j.employer_id = auth.uid()
      )
    )
  );

-- 4) SOP scorecard
CREATE TABLE IF NOT EXISTS public.assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  assessor_name text NOT NULL,
  safety_ppe numeric(5,2) NOT NULL DEFAULT 0,
  tool_identification numeric(5,2) NOT NULL DEFAULT 0,
  practical_skills numeric(5,2) NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  quality numeric(5,2) NOT NULL DEFAULT 0,
  productivity numeric(5,2) NOT NULL DEFAULT 0,
  time_taken numeric(5,2) NOT NULL DEFAULT 0,
  workplace_behaviour numeric(5,2) NOT NULL DEFAULT 0,
  remarks text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id)
);

ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.assessment_scores TO authenticated;
GRANT ALL ON public.assessment_scores TO service_role;

DROP POLICY IF EXISTS "ascores partner" ON public.assessment_scores;
CREATE POLICY "ascores partner" ON public.assessment_scores FOR ALL TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
        AND status IN ('accepted', 'scheduled', 'checked_in', 'kyc_done', 'running', 'centre_submitted')
    )
  );

DROP POLICY IF EXISTS "ascores worker read" ON public.assessment_scores;
CREATE POLICY "ascores worker read" ON public.assessment_scores FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE worker_id = auth.uid()
        AND status IN ('centre_submitted', 'under_review', 'completed', 'approved')
    )
  );

DROP POLICY IF EXISTS "ascores employer read" ON public.assessment_scores;
CREATE POLICY "ascores employer read" ON public.assessment_scores FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE outcome IN ('pass', 'conditional_pass')
        AND status = 'completed'
        AND (
          employer_id = auth.uid()
          OR worker_id IN (
            SELECT ja.worker_id FROM public.job_applications ja
            JOIN public.jobs j ON j.id = ja.job_id
            WHERE j.employer_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "ascores admin" ON public.assessment_scores;
CREATE POLICY "ascores admin" ON public.assessment_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Evidence media
CREATE TABLE IF NOT EXISTS public.assessment_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN (
    'kyc_photo', 'kyc_video', 'practical_photo', 'practical_video', 'document'
  )),
  storage_path text NOT NULL,
  label text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_media_assessment ON public.assessment_media(assessment_id);

ALTER TABLE public.assessment_media ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.assessment_media TO authenticated;
GRANT ALL ON public.assessment_media TO service_role;

DROP POLICY IF EXISTS "amedia partner" ON public.assessment_media;
CREATE POLICY "amedia partner" ON public.assessment_media FOR ALL TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.assessments
      WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "amedia worker read" ON public.assessment_media;
CREATE POLICY "amedia worker read" ON public.assessment_media FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments WHERE worker_id = auth.uid()
    )
    AND media_type IN ('practical_photo', 'practical_video', 'document')
  );

DROP POLICY IF EXISTS "amedia employer read" ON public.assessment_media;
CREATE POLICY "amedia employer read" ON public.assessment_media FOR SELECT TO authenticated
  USING (
    media_type IN ('practical_photo', 'practical_video')
    AND assessment_id IN (
      SELECT id FROM public.assessments
      WHERE outcome IN ('pass', 'conditional_pass')
        AND status = 'completed'
        AND (
          employer_id = auth.uid()
          OR worker_id IN (
            SELECT ja.worker_id FROM public.job_applications ja
            JOIN public.jobs j ON j.id = ja.job_id
            WHERE j.employer_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "amedia admin" ON public.assessment_media;
CREATE POLICY "amedia admin" ON public.assessment_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) Link worker_verification
ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wv_assessment ON public.worker_verification(assessment_id);

-- 7) Guard: only admin may set outcome / quality fields
CREATE OR REPLACE FUNCTION public.guard_assessment_quality_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.outcome IS DISTINCT FROM OLD.outcome
     OR NEW.quality_reviewed_by IS DISTINCT FROM OLD.quality_reviewed_by
     OR NEW.quality_reviewed_at IS DISTINCT FROM OLD.quality_reviewed_at
     OR NEW.quality_notes IS DISTINCT FROM OLD.quality_notes
     OR (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.outcome IS NOT NULL)
  THEN
    -- Partners may move to centre_submitted / under_review but not set outcome
    IF NEW.outcome IS DISTINCT FROM OLD.outcome
       OR NEW.quality_reviewed_by IS DISTINCT FROM OLD.quality_reviewed_by
       OR NEW.quality_reviewed_at IS DISTINCT FROM OLD.quality_reviewed_at THEN
      RAISE EXCEPTION 'Only SafeWork admin can set assessment outcome / quality review';
    END IF;
  END IF;

  -- Partners cannot allocate or complete with outcome
  IF TG_OP = 'INSERT' AND NEW.status = 'allocated' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only SafeWork admin can allocate assessments';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_assessment_quality ON public.assessments;
CREATE TRIGGER trg_guard_assessment_quality
  BEFORE INSERT OR UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.guard_assessment_quality_fields();

-- 8) Private storage bucket for assessment evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-evidence',
  'assessment-evidence',
  false,
  104857600,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "assessment evidence partner upload" ON storage.objects;
CREATE POLICY "assessment evidence partner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assessment-evidence'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.partners p
        WHERE p.user_id = auth.uid()
          AND (storage.foldername(name))[1] = p.id::text
      )
    )
  );

DROP POLICY IF EXISTS "assessment evidence partner read" ON storage.objects;
CREATE POLICY "assessment evidence partner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assessment-evidence'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.partners p
        WHERE p.user_id = auth.uid()
          AND (storage.foldername(name))[1] = p.id::text
      )
    )
  );

DROP POLICY IF EXISTS "assessment evidence partner update" ON storage.objects;
CREATE POLICY "assessment evidence partner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assessment-evidence'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.partners p
        WHERE p.user_id = auth.uid()
          AND (storage.foldername(name))[1] = p.id::text
      )
    )
  );

-- Admin insert for allocations uses partner folder; workers don't upload to this bucket.
