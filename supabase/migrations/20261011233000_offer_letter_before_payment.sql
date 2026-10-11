-- After a passed video interview, payment stays closed until the worker
-- downloads the offer letter and accepts it with an OTP on their registered mobile.

ALTER TABLE public.worker_verification DROP CONSTRAINT IF EXISTS worker_verification_stage_check;
ALTER TABLE public.worker_verification ADD CONSTRAINT worker_verification_stage_check
  CHECK (stage = ANY (ARRAY[
    'essentials','find_jobs','apply_job','quiz','media','identity',
    'awaiting_interview','awaiting_offer','awaiting_payment','trade_test','medical','tests',
    'bond','pdot','deployment','gcc_ready'
  ]));

CREATE TABLE IF NOT EXISTS public.worker_job_offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_role text NOT NULL CHECK (uploaded_role IN ('admin', 'employer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  downloaded_version integer,
  declined_at timestamptz,
  accepted_at timestamptz,
  accepted_phone text,
  accepted_version integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS worker_job_offer_letters_job_idx
  ON public.worker_job_offer_letters (job_id);

GRANT SELECT ON public.worker_job_offer_letters TO authenticated;
GRANT ALL ON public.worker_job_offer_letters TO service_role;

ALTER TABLE public.worker_job_offer_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workers read own offer letters" ON public.worker_job_offer_letters;
CREATE POLICY "Workers read own offer letters"
  ON public.worker_job_offer_letters FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.partner_manages_worker(user_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.employer_id = auth.uid()
        AND COALESCE(j.posted_by_role, 'employer') IS DISTINCT FROM 'admin'
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('offer-letters', 'offer-letters', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Workers read own offer letter files" ON storage.objects;
CREATE POLICY "Workers read own offer letter files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'offer-letters'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.partner_manages_worker(
        CASE
          WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
          THEN ((storage.foldername(name))[1])::uuid
          ELSE NULL
        END
      )
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id::text = (storage.foldername(name))[2]
          AND j.employer_id = auth.uid()
          AND COALESCE(j.posted_by_role, 'employer') IS DISTINCT FROM 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Admins upload offer letter files" ON storage.objects;
CREATE POLICY "Admins upload offer letter files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'offer-letters'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Employers upload offer letter files for own jobs" ON storage.objects;
CREATE POLICY "Employers upload offer letter files for own jobs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'offer-letters'
    AND public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[2]
        AND j.employer_id = auth.uid()
        AND COALESCE(j.posted_by_role, 'employer') IS DISTINCT FROM 'admin'
    )
  );

-- Payment cannot open for an unpaid worker until this job's current file is accepted.
CREATE OR REPLACE FUNCTION public.job_offer_is_accepted(p_user_id uuid, p_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.worker_job_offer_letters l
    WHERE l.user_id = p_user_id
      AND l.job_id = p_job_id
      AND l.status = 'accepted'
      AND l.accepted_version = l.version
  );
$$;

REVOKE ALL ON FUNCTION public.job_offer_is_accepted(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_offer_is_accepted(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_offer_before_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'paid' OR NEW.paid_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.stage = 'awaiting_payment'
     AND NOT public.job_offer_is_accepted(NEW.user_id, NEW.journey_job_id) THEN
    NEW.stage := 'awaiting_offer';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_offer_before_payment ON public.worker_verification;
CREATE TRIGGER trg_enforce_offer_before_payment
  BEFORE UPDATE OF stage ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_offer_before_payment();

CREATE OR REPLACE FUNCTION public.job_offer_letter_payload(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.worker_verification%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_letter public.worker_job_offer_letters%ROWTYPE;
  v_allowed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = p_user_id;
  IF NOT FOUND OR v_row.journey_job_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_allowed := auth.uid() = p_user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.partner_manages_worker(p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = v_row.journey_job_id
        AND j.employer_id = auth.uid()
        AND COALESCE(j.posted_by_role, 'employer') IS DISTINCT FROM 'admin'
    );
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not allowed to read this offer letter';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_row.journey_job_id;
  SELECT * INTO v_letter
    FROM public.worker_job_offer_letters
   WHERE user_id = p_user_id AND job_id = v_row.journey_job_id;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'job_id', v_row.journey_job_id,
    'job_title', v_job.title,
    'stage', v_row.stage,
    'interview_status', v_row.interview_status,
    'payment_taken', (v_row.payment_status = 'paid' OR v_row.paid_at IS NOT NULL),
    'id', v_letter.id,
    'file_name', v_letter.file_name,
    'storage_path', v_letter.storage_path,
    'version', v_letter.version,
    'status', v_letter.status,
    'downloaded_version', v_letter.downloaded_version,
    'accepted_at', v_letter.accepted_at,
    'accepted_phone', v_letter.accepted_phone,
    'declined_at', v_letter.declined_at,
    'uploaded_role', v_letter.uploaded_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.job_offer_letter_payload(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_offer_letter_payload(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.worker_get_job_offer(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  RETURN public.job_offer_letter_payload(v_subject);
END;
$$;

REVOKE ALL ON FUNCTION public.worker_get_job_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.worker_get_job_offer(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_job_offer_letter(
  p_user_id uuid,
  p_path text,
  p_file_name text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.worker_verification%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_is_employer boolean;
  v_role text;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = p_user_id;
  IF NOT FOUND OR v_row.journey_job_id IS NULL THEN
    RAISE EXCEPTION 'This worker has no current job';
  END IF;
  IF v_row.interview_status IS DISTINCT FROM 'approved' AND v_row.stage IS DISTINCT FROM 'awaiting_offer' THEN
    RAISE EXCEPTION 'Offer letter is available after the video interview is approved';
  END IF;
  IF v_row.payment_status = 'paid' OR v_row.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'Payment was already taken. This offer letter cannot be replaced';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_row.journey_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  v_is_employer := public.has_role(auth.uid(), 'employer'::app_role)
    AND v_job.employer_id = auth.uid()
    AND COALESCE(v_job.posted_by_role, 'employer') IS DISTINCT FROM 'admin';
  IF NOT v_is_admin AND NOT v_is_employer THEN
    RAISE EXCEPTION 'You cannot upload an offer letter for this job';
  END IF;

  v_role := CASE WHEN v_is_admin THEN 'admin' ELSE 'employer' END;
  v_name := left(regexp_replace(COALESCE(NULLIF(btrim(p_file_name), ''), 'offer-letter.pdf'), '[^A-Za-z0-9._ -]', '_', 'g'), 180);
  IF p_path !~ ('^' || p_user_id::text || '/' || v_row.journey_job_id::text || '/[A-Za-z0-9._-]+$') THEN
    RAISE EXCEPTION 'Invalid offer letter file';
  END IF;
  IF right(lower(p_path), 4) IS DISTINCT FROM '.pdf' THEN
    RAISE EXCEPTION 'Offer letter must be a PDF';
  END IF;

  INSERT INTO public.worker_job_offer_letters (
    user_id, job_id, storage_path, file_name, version, uploaded_by, uploaded_role, status
  ) VALUES (
    p_user_id, v_row.journey_job_id, p_path, v_name, 1, auth.uid(), v_role, 'pending'
  )
  ON CONFLICT (user_id, job_id) DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    file_name = EXCLUDED.file_name,
    version = public.worker_job_offer_letters.version + 1,
    uploaded_by = EXCLUDED.uploaded_by,
    uploaded_role = EXCLUDED.uploaded_role,
    status = 'pending',
    downloaded_version = NULL,
    declined_at = NULL,
    accepted_at = NULL,
    accepted_phone = NULL,
    accepted_version = NULL,
    updated_at = now();

  IF v_row.stage = 'awaiting_payment' THEN
    PERFORM set_config('app.verification_guard_bypass', '1', true);
    UPDATE public.worker_verification
       SET stage = 'awaiting_offer', updated_at = now()
     WHERE user_id = p_user_id;
  END IF;

  RETURN public.job_offer_letter_payload(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.register_job_offer_letter(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_job_offer_letter(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.worker_mark_offer_downloaded(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject uuid := COALESCE(p_user_id, auth.uid());
  v_job uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_subject IS DISTINCT FROM auth.uid() AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT journey_job_id INTO v_job FROM public.worker_verification WHERE user_id = v_subject;
  UPDATE public.worker_job_offer_letters
     SET downloaded_version = version, updated_at = now()
   WHERE user_id = v_subject AND job_id = v_job;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No offer letter on this job yet';
  END IF;
  RETURN public.job_offer_letter_payload(v_subject);
END;
$$;

REVOKE ALL ON FUNCTION public.worker_mark_offer_downloaded(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.worker_mark_offer_downloaded(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.worker_decline_job_offer(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject uuid := COALESCE(p_user_id, auth.uid());
  v_job uuid;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_subject IS DISTINCT FROM auth.uid() AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT journey_job_id INTO v_job FROM public.worker_verification WHERE user_id = v_subject;
  SELECT status INTO v_status
    FROM public.worker_job_offer_letters
   WHERE user_id = v_subject AND job_id = v_job;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'No offer letter on this job yet';
  END IF;
  IF v_status = 'accepted' THEN
    RAISE EXCEPTION 'This offer letter is already accepted';
  END IF;

  UPDATE public.worker_job_offer_letters
     SET status = 'declined', declined_at = now(), updated_at = now()
   WHERE user_id = v_subject AND job_id = v_job;

  RETURN public.job_offer_letter_payload(v_subject);
END;
$$;

REVOKE ALL ON FUNCTION public.worker_decline_job_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.worker_decline_job_offer(uuid) TO authenticated;

-- Called only after the edge function has verified the SMS OTP.
CREATE OR REPLACE FUNCTION public.worker_accept_job_offer(p_user_id uuid, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.worker_verification%ROWTYPE;
  v_letter public.worker_job_offer_letters%ROWTYPE;
  v_phone text;
  v_profile_phone text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Offer acceptance must be confirmed by SMS OTP';
  END IF;

  v_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF length(v_phone) > 10 THEN
    v_phone := right(v_phone, 10);
  END IF;
  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'A verified mobile number is required';
  END IF;

  SELECT regexp_replace(COALESCE(phone, ''), '\D', '', 'g') INTO v_profile_phone
    FROM public.profiles WHERE id = p_user_id;
  IF length(COALESCE(v_profile_phone, '')) > 10 THEN
    v_profile_phone := right(v_profile_phone, 10);
  END IF;
  IF v_profile_phone IS DISTINCT FROM v_phone THEN
    RAISE EXCEPTION 'OTP must be verified on the mobile already on this account';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = p_user_id;
  IF NOT FOUND OR v_row.journey_job_id IS NULL THEN
    RAISE EXCEPTION 'This worker has no current job';
  END IF;
  IF v_row.payment_status = 'paid' OR v_row.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'Payment was already taken';
  END IF;

  SELECT * INTO v_letter
    FROM public.worker_job_offer_letters
   WHERE user_id = p_user_id AND job_id = v_row.journey_job_id;
  IF v_letter.id IS NULL THEN
    RAISE EXCEPTION 'No offer letter on this job yet';
  END IF;
  IF v_letter.downloaded_version IS DISTINCT FROM v_letter.version THEN
    RAISE EXCEPTION 'Download this offer letter before accepting it';
  END IF;

  UPDATE public.worker_job_offer_letters
     SET status = 'accepted',
         accepted_at = now(),
         accepted_phone = v_phone,
         accepted_version = version,
         declined_at = NULL,
         updated_at = now()
   WHERE id = v_letter.id;

  IF v_row.stage IN ('awaiting_offer', 'awaiting_payment') THEN
    PERFORM set_config('app.verification_guard_bypass', '1', true);
    UPDATE public.worker_verification
       SET stage = 'awaiting_payment', updated_at = now()
     WHERE user_id = p_user_id
     RETURNING * INTO v_row;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.worker_accept_job_offer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.worker_accept_job_offer(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.list_job_offer_queue()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT v_admin AND NOT public.has_role(auth.uid(), 'employer'::app_role) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(q) ORDER BY q.updated_at DESC)
    FROM (
      SELECT
        wv.user_id,
        wv.journey_job_id AS job_id,
        wv.stage,
        p.full_name,
        p.phone,
        j.title AS job_title,
        j.country AS job_country,
        j.posted_by_role,
        l.file_name,
        l.version,
        l.status AS letter_status,
        l.downloaded_version,
        l.accepted_at,
        l.declined_at,
        l.uploaded_role,
        wv.updated_at
      FROM public.worker_verification wv
      JOIN public.jobs j ON j.id = wv.journey_job_id
      JOIN public.profiles p ON p.id = wv.user_id
      LEFT JOIN public.worker_job_offer_letters l
        ON l.user_id = wv.user_id AND l.job_id = wv.journey_job_id
      WHERE wv.interview_status = 'approved'
        AND wv.payment_status IS DISTINCT FROM 'paid'
        AND wv.paid_at IS NULL
        AND wv.stage IN ('awaiting_offer', 'awaiting_payment')
        AND (
          v_admin
          OR (
            j.employer_id = auth.uid()
            AND COALESCE(j.posted_by_role, 'employer') IS DISTINCT FROM 'admin'
          )
        )
    ) q
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.list_job_offer_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_job_offer_queue() TO authenticated;

-- Unpaid workers already sitting on payment move to the offer step.
UPDATE public.worker_verification
   SET stage = 'awaiting_offer', updated_at = now()
 WHERE stage = 'awaiting_payment'
   AND payment_status IS DISTINCT FROM 'paid'
   AND paid_at IS NULL;

-- A passed interview opens the offer step, not payment, until the letter is accepted.
CREATE OR REPLACE FUNCTION public.interviewer_record_decision(
  p_interview_id uuid,
  p_approved boolean,
  p_reason text DEFAULT NULL,
  p_score numeric DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.worker_verification_interviews;
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_stage text;
  v_payment text;
  v_paid_at timestamptz;
  v_trade_status text;
  v_trade_required boolean;
  v_medical_status text;
  v_next_stage text;
BEGIN
  SELECT * INTO v_row FROM public.worker_verification_interviews WHERE id = p_interview_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Interview not found';
  END IF;
  IF NOT v_is_admin AND v_row.interviewer_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not assigned to this interview';
  END IF;

  UPDATE public.worker_verification_interviews
     SET decision = CASE WHEN p_approved THEN 'approved' ELSE 'not_approved' END,
         decision_reason = p_reason,
         decided_at = now(),
         status = 'completed',
         score = COALESCE(p_score, score),
         rated_by = auth.uid(),
         updated_at = now()
   WHERE id = p_interview_id;

  SELECT stage, payment_status, paid_at, trade_test_status, trade_test_required, medical_status
    INTO v_stage, v_payment, v_paid_at, v_trade_status, v_trade_required, v_medical_status
    FROM public.worker_verification
   WHERE user_id = v_row.user_id;

  v_next_stage := COALESCE(v_stage, 'awaiting_interview');

  IF p_approved THEN
    IF v_stage IN ('identity', 'awaiting_interview', 'media', 'quiz', 'awaiting_offer') THEN
      IF v_payment = 'paid' OR v_paid_at IS NOT NULL THEN
        IF COALESCE(v_trade_required, true)
           AND COALESCE(v_trade_status, 'pending') NOT IN ('passed', 'not_required') THEN
          v_next_stage := 'trade_test';
        ELSIF v_medical_status = 'passed' THEN
          v_next_stage := 'bond';
        ELSE
          v_next_stage := 'medical';
        END IF;
      ELSE
        v_next_stage := 'awaiting_offer';
      END IF;
    END IF;
  ELSE
    IF v_stage IN ('identity', 'awaiting_interview', 'awaiting_offer') THEN
      v_next_stage := 'awaiting_interview';
    END IF;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         interview_score = COALESCE(p_score, interview_score),
         interview_notes = COALESCE(p_reason, interview_notes),
         interview_rated_at = now(),
         stage = v_next_stage,
         updated_at = now()
   WHERE user_id = v_row.user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_schedule_worker_interview(
  p_user_id uuid,
  p_scheduled_at timestamptz,
  p_meeting_url text,
  p_interviewer_user_id uuid,
  p_confirm_rewind boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kyc text;
  v_attempt integer;
  v_id uuid;
  v_interviewer_name text;
  v_stage text;
  v_payment text;
  v_paid_at timestamptz;
  v_interview_status text;
  v_trade_status text;
  v_medical_status text;
  v_job uuid;
  v_past boolean;
  v_new_stage text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT kyc_status, interview_attempts, stage, payment_status, paid_at,
         interview_status, trade_test_status, medical_status, journey_job_id
    INTO v_kyc, v_attempt, v_stage, v_payment, v_paid_at,
         v_interview_status, v_trade_status, v_medical_status, v_job
    FROM public.worker_verification WHERE user_id = p_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC must be verified before scheduling the interview';
  END IF;

  v_past := v_stage IN (
              'awaiting_offer', 'awaiting_payment', 'trade_test', 'medical', 'tests',
              'bond', 'pdot', 'deployment', 'gcc_ready'
            )
         OR v_payment = 'paid'
         OR v_paid_at IS NOT NULL
         OR v_interview_status = 'approved'
         OR v_trade_status = 'passed'
         OR v_medical_status = 'passed';

  IF v_past AND NOT COALESCE(p_confirm_rewind, false) THEN
    RAISE EXCEPTION
      'This worker has already progressed past the interview (currently %). Confirm rewind to send them back.',
      COALESCE(v_stage, 'unknown');
  END IF;

  SELECT COALESCE(
           NULLIF(trim(p.full_name), ''),
           NULLIF(split_part(COALESCE(p.email, ''), '@', 1), ''),
           'Interviewer'
         )
    INTO v_interviewer_name
    FROM public.profiles p
   WHERE p.id = p_interviewer_user_id;

  IF v_interviewer_name IS NULL THEN
    v_interviewer_name := 'Interviewer';
  END IF;

  INSERT INTO public.worker_verification_interviews
    (user_id, scheduled_at, meeting_link, meeting_url, interviewer_user_id, status, attempt_no)
  VALUES (p_user_id, p_scheduled_at, p_meeting_url, p_meeting_url, p_interviewer_user_id, 'scheduled', COALESCE(v_attempt, 0) + 1)
  RETURNING id INTO v_id;

  IF v_past AND COALESCE(p_confirm_rewind, false) THEN
    v_new_stage := 'awaiting_interview';
    IF v_payment IS DISTINCT FROM 'paid' AND v_paid_at IS NULL AND v_job IS NOT NULL THEN
      UPDATE public.worker_job_offer_letters
         SET status = 'pending',
             accepted_at = NULL,
             accepted_phone = NULL,
             accepted_version = NULL,
             downloaded_version = NULL,
             declined_at = NULL,
             updated_at = now()
       WHERE user_id = p_user_id AND job_id = v_job;
    END IF;
  ELSE
    v_new_stage := CASE WHEN v_stage IN ('identity','awaiting_interview') THEN 'awaiting_interview' ELSE v_stage END;
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_scheduled_at = p_scheduled_at,
         interview_meeting_url = p_meeting_url,
         interviewer_user_id = p_interviewer_user_id,
         interviewer_name = v_interviewer_name,
         interview_status = 'scheduled',
         interview_attempts = COALESCE(interview_attempts, 0) + 1,
         stage = v_new_stage,
         updated_at = now()
   WHERE user_id = p_user_id;

  RETURN v_id;
END; $$;

-- Notify the offer step between interview and payment.
CREATE OR REPLACE FUNCTION public.notify_worker_journey_stage_cleared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_stage text := OLD.stage;
  new_stage text := NEW.stage;
  old_rank integer;
  new_rank integer;
  cleared_en text;
  cleared_short_en text;
  cleared_short_hi text;
  next_en text;
  next_hi text;
  title_text text;
  message_text text;
  used_pass_verb boolean;
BEGIN
  IF old_stage IS NOT DISTINCT FROM new_stage THEN
    RETURN NEW;
  END IF;

  IF old_stage = 'find_jobs' AND new_stage = 'apply_job' THEN
    RETURN NEW;
  END IF;

  old_rank := CASE old_stage
    WHEN 'essentials' THEN 10
    WHEN 'find_jobs' THEN 20
    WHEN 'apply_job' THEN 30
    WHEN 'quiz' THEN 40
    WHEN 'media' THEN 50
    WHEN 'identity' THEN 60
    WHEN 'awaiting_interview' THEN 70
    WHEN 'awaiting_offer' THEN 75
    WHEN 'awaiting_payment' THEN 80
    WHEN 'trade_test' THEN 90
    WHEN 'tests' THEN 90
    WHEN 'medical' THEN 100
    WHEN 'bond' THEN 110
    WHEN 'pdot' THEN 120
    WHEN 'deployment' THEN 130
    WHEN 'gcc_ready' THEN 140
    ELSE 0
  END;

  new_rank := CASE new_stage
    WHEN 'essentials' THEN 10
    WHEN 'find_jobs' THEN 20
    WHEN 'apply_job' THEN 30
    WHEN 'quiz' THEN 40
    WHEN 'media' THEN 50
    WHEN 'identity' THEN 60
    WHEN 'awaiting_interview' THEN 70
    WHEN 'awaiting_offer' THEN 75
    WHEN 'awaiting_payment' THEN 80
    WHEN 'trade_test' THEN 90
    WHEN 'tests' THEN 90
    WHEN 'medical' THEN 100
    WHEN 'bond' THEN 110
    WHEN 'pdot' THEN 120
    WHEN 'deployment' THEN 130
    WHEN 'gcc_ready' THEN 140
    ELSE 0
  END;

  IF new_rank <= old_rank THEN
    RETURN NEW;
  END IF;

  SELECT x.cleared_en, x.cleared_short_en, x.cleared_short_hi, x.used_pass
  INTO cleared_en, cleared_short_en, cleared_short_hi, used_pass_verb
  FROM (
    SELECT
      CASE old_stage
        WHEN 'essentials' THEN 'Essentials'
        WHEN 'find_jobs' THEN 'Find jobs'
        WHEN 'apply_job' THEN 'Find jobs'
        WHEN 'quiz' THEN 'Test 1 — Basic trade knowledge'
        WHEN 'media' THEN 'Skill proof upload'
        WHEN 'identity' THEN 'Identity (KYC)'
        WHEN 'awaiting_interview' THEN 'Test 2 — Video interview'
        WHEN 'awaiting_offer' THEN 'Offer letter'
        WHEN 'awaiting_payment' THEN 'Payment'
        WHEN 'trade_test' THEN 'Test 3 — Physical trade test'
        WHEN 'tests' THEN 'Test 3 — Physical trade test'
        WHEN 'medical' THEN 'Medical test'
        WHEN 'bond' THEN 'Bond & Security'
        WHEN 'pdot' THEN 'PDOT training'
        WHEN 'deployment' THEN 'Deployment'
        ELSE coalesce(old_stage, 'step')
      END AS cleared_en,
      CASE old_stage
        WHEN 'awaiting_interview' THEN 'Test 2'
        WHEN 'awaiting_offer' THEN 'Offer letter'
        WHEN 'awaiting_payment' THEN 'Payment'
        ELSE CASE old_stage
          WHEN 'essentials' THEN 'Essentials'
          WHEN 'find_jobs' THEN 'Find jobs'
          WHEN 'apply_job' THEN 'Find jobs'
          WHEN 'quiz' THEN 'Test 1'
          WHEN 'media' THEN 'Skill proof'
          WHEN 'identity' THEN 'Identity'
          WHEN 'trade_test' THEN 'Test 3'
          WHEN 'tests' THEN 'Test 3'
          WHEN 'medical' THEN 'Medical test'
          WHEN 'bond' THEN 'Bond & Security'
          WHEN 'pdot' THEN 'PDOT'
          WHEN 'deployment' THEN 'Deployment'
          ELSE 'Step'
        END
      END AS cleared_short_en,
      CASE old_stage
        WHEN 'essentials' THEN 'आवश्यक जानकारी'
        WHEN 'find_jobs' THEN 'नौकरी खोजें'
        WHEN 'apply_job' THEN 'नौकरी खोजें'
        WHEN 'quiz' THEN 'टेस्ट 1'
        WHEN 'media' THEN 'स्किल प्रूफ'
        WHEN 'identity' THEN 'पहचान'
        WHEN 'awaiting_interview' THEN 'टेस्ट 2'
        WHEN 'awaiting_offer' THEN 'ऑफर लेटर'
        WHEN 'awaiting_payment' THEN 'भुगतान'
        WHEN 'trade_test' THEN 'टेस्ट 3'
        WHEN 'tests' THEN 'टेस्ट 3'
        WHEN 'medical' THEN 'मेडिकल टेस्ट'
        WHEN 'bond' THEN 'बॉन्ड'
        WHEN 'pdot' THEN 'PDOT'
        WHEN 'deployment' THEN 'डिप्लॉयमेंट'
        ELSE 'चरण'
      END AS cleared_short_hi,
      (old_stage IN ('quiz', 'awaiting_interview', 'trade_test', 'tests', 'medical')) AS used_pass
  ) x;

  SELECT x.next_en, x.next_hi
  INTO next_en, next_hi
  FROM (
    SELECT
      CASE new_stage
        WHEN 'essentials' THEN 'Essentials'
        WHEN 'find_jobs' THEN 'Find jobs'
        WHEN 'apply_job' THEN 'Find jobs'
        WHEN 'quiz' THEN 'Test 1 — Basic trade knowledge'
        WHEN 'media' THEN 'Skill proof upload'
        WHEN 'identity' THEN 'Identity (KYC)'
        WHEN 'awaiting_interview' THEN 'Test 2 — Video interview'
        WHEN 'awaiting_offer' THEN 'Offer letter'
        WHEN 'awaiting_payment' THEN 'Payment'
        WHEN 'trade_test' THEN 'Test 3 — Physical trade test'
        WHEN 'tests' THEN 'Test 3 — Physical trade test'
        WHEN 'medical' THEN 'Medical test'
        WHEN 'bond' THEN 'Bond & Security'
        WHEN 'pdot' THEN 'PDOT training'
        WHEN 'deployment' THEN 'Deployment'
        WHEN 'gcc_ready' THEN 'GCC ready'
        ELSE coalesce(new_stage, 'the next step')
      END AS next_en,
      CASE new_stage
        WHEN 'essentials' THEN 'आवश्यक जानकारी'
        WHEN 'find_jobs' THEN 'नौकरी खोजें'
        WHEN 'apply_job' THEN 'नौकरी खोजें'
        WHEN 'quiz' THEN 'टेस्ट 1 — बुनियादी ट्रेड ज्ञान'
        WHEN 'media' THEN 'स्किल प्रूफ अपलोड'
        WHEN 'identity' THEN 'पहचान (KYC)'
        WHEN 'awaiting_interview' THEN 'टेस्ट 2 — वीडियो इंटरव्यू'
        WHEN 'awaiting_offer' THEN 'ऑफर लेटर'
        WHEN 'awaiting_payment' THEN 'भुगतान'
        WHEN 'trade_test' THEN 'टेस्ट 3 — फिजिकल ट्रेड टेस्ट'
        WHEN 'tests' THEN 'टेस्ट 3 — फिजिकल ट्रेड टेस्ट'
        WHEN 'medical' THEN 'मेडिकल टेस्ट'
        WHEN 'bond' THEN 'बॉन्ड और सिक्योरिटी'
        WHEN 'pdot' THEN 'PDOT प्रशिक्षण'
        WHEN 'deployment' THEN 'डिप्लॉयमेंट'
        WHEN 'gcc_ready' THEN 'GCC रेडी'
        ELSE coalesce(new_stage, 'अगला कदम')
      END AS next_hi
  ) x;

  title_text := cleared_short_en || ' cleared / ' || cleared_short_hi || ' पूरा';

  IF new_stage IN ('gcc_ready', 'deployment') THEN
    message_text :=
      'You cleared ' || cleared_en || '. You''re GCC ready. / आपने '
      || cleared_short_hi
      || CASE WHEN used_pass_verb THEN ' पास कर लिया है। ' ELSE ' पूरा कर लिया है। ' END
      || 'आप GCC रेडी हैं।';
  ELSE
    message_text :=
      'You cleared ' || cleared_en || '. You can now proceed to ' || next_en || '. / आपने '
      || cleared_short_hi
      || CASE WHEN used_pass_verb THEN ' पास कर लिया है। अब ' ELSE ' पूरा कर लिया है। अब ' END
      || next_hi || ' पर जाएँ।';
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.user_id,
      'journey_step_cleared',
      title_text,
      message_text,
      jsonb_build_object(
        'href', '/worker/journey',
        'cleared_stage', old_stage,
        'next_stage', new_stage
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'journey step notification failed for %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
