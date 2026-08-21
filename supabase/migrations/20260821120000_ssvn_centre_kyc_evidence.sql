-- SSVN trade-test centre: share worker identity docs, arrival physical check,
-- live photo + operator, timed video KYC, test-day evidence (3 photos / 3 videos),
-- and deferred scorecard upload.

-- ---------------------------------------------------------------------------
-- 1) Assessments: arrival identity + video KYC audit fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS pan_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_same_person boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS docs_pre_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS docs_pre_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS arrival_photo_path text,
  ADD COLUMN IF NOT EXISTS arrival_photo_taken_by uuid,
  ADD COLUMN IF NOT EXISTS arrival_photo_taken_by_name text,
  ADD COLUMN IF NOT EXISTS arrival_photo_taken_at timestamptz,
  ADD COLUMN IF NOT EXISTS video_kyc_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_kyc_operator_id uuid,
  ADD COLUMN IF NOT EXISTS video_kyc_operator_name text,
  ADD COLUMN IF NOT EXISTS test_evidence_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scorecard_uploaded_at timestamptz;

COMMENT ON COLUMN public.assessments.identity_same_person IS
  'Assessor physically confirmed the person who arrived matches Aadhaar / PAN / passport photos.';
COMMENT ON COLUMN public.assessments.video_kyc_log IS
  'Timed liveness challenges: blink, turn left, turn right (started_at, completed_at, storage_path).';
COMMENT ON COLUMN public.assessments.test_evidence_completed_at IS
  'When the centre finished test-day photos/videos. Scorecard may be uploaded later.';

-- ---------------------------------------------------------------------------
-- 2) Assessment media: capture metadata + extra types
-- ---------------------------------------------------------------------------
ALTER TABLE public.assessment_media
  ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS captured_by uuid,
  ADD COLUMN IF NOT EXISTS captured_by_name text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(8,2),
  ADD COLUMN IF NOT EXISTS angle text,
  ADD COLUMN IF NOT EXISTS face_visible boolean,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.assessment_media
  DROP CONSTRAINT IF EXISTS assessment_media_media_type_check;
ALTER TABLE public.assessment_media
  ADD CONSTRAINT assessment_media_media_type_check
  CHECK (media_type IN (
    'kyc_photo',
    'kyc_video',
    'arrival_photo',
    'video_kyc_blink',
    'video_kyc_turn_left',
    'video_kyc_turn_right',
    'practical_photo',
    'practical_video',
    'document',
    'scorecard'
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_media TO authenticated;

-- Partners may save SOP scores after the test day (status stays kyc_done until scored).
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
        AND status IN (
          'accepted', 'scheduled', 'checked_in', 'kyc_done', 'running', 'centre_submitted'
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 3) SSVN may read identity docs + profile of allocated candidates
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ssvn view allocated worker identity docs" ON public.worker_documents;
CREATE POLICY "ssvn view allocated worker identity docs"
  ON public.worker_documents FOR SELECT TO authenticated
  USING (
    document_type IN (
      'pan', 'aadhaar', 'aadhaar_front', 'aadhaar_back',
      'passport', 'passport_front', 'passport_last', 'id_proof'
    )
    AND EXISTS (
      SELECT 1
      FROM public.assessments a
      JOIN public.partners p ON p.id = a.partner_id
      WHERE a.worker_id = worker_documents.worker_id
        AND p.user_id = auth.uid()
        AND a.status IS DISTINCT FROM 'centre_rejected'
    )
  );

DROP POLICY IF EXISTS "ssvn view allocated worker profile" ON public.worker_profiles;
CREATE POLICY "ssvn view allocated worker profile"
  ON public.worker_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assessments a
      JOIN public.partners p ON p.id = a.partner_id
      WHERE a.worker_id = worker_profiles.user_id
        AND p.user_id = auth.uid()
        AND a.status IS DISTINCT FROM 'centre_rejected'
    )
  );

DROP POLICY IF EXISTS "ssvn view allocated worker documents storage" ON storage.objects;
CREATE POLICY "ssvn view allocated worker documents storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND EXISTS (
      SELECT 1
      FROM public.assessments a
      JOIN public.partners p ON p.id = a.partner_id
      WHERE p.user_id = auth.uid()
        AND a.status IS DISTINCT FROM 'centre_rejected'
        AND a.worker_id::text = (storage.foldername(objects.name))[1]
    )
  );

-- Larger practical videos (30s+ from multiple angles)
UPDATE storage.buckets
SET file_size_limit = 209715200
WHERE id = 'assessment-evidence';
