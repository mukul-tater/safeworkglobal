-- Test 1 answers belong to the job that was active when they were submitted.
-- A new job starts Test 1 clean. Returning to an earlier job keeps that job's answers.

ALTER TABLE public.worker_skill_quiz_responses
  ADD COLUMN IF NOT EXISTS journey_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

ALTER TABLE public.worker_skill_quiz_responses
  DROP CONSTRAINT IF EXISTS worker_skill_quiz_responses_user_id_quiz_item_id_key;

ALTER TABLE public.worker_skill_quiz_responses
  DROP CONSTRAINT IF EXISTS worker_skill_quiz_responses_user_job_item_key;

ALTER TABLE public.worker_skill_quiz_responses
  ADD CONSTRAINT worker_skill_quiz_responses_user_job_item_key
  UNIQUE NULLS NOT DISTINCT (user_id, quiz_item_id, journey_job_id);

-- Answers taken before this change stay on the worker's current job.
UPDATE public.worker_skill_quiz_responses r
SET journey_job_id = wv.journey_job_id
FROM public.worker_verification wv
WHERE r.user_id = wv.user_id
  AND r.journey_job_id IS NULL
  AND wv.journey_job_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.tag_quiz_responses_on_job_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.journey_job_id IS NOT NULL
     AND NEW.journey_job_id IS DISTINCT FROM OLD.journey_job_id THEN
    UPDATE public.worker_skill_quiz_responses
    SET journey_job_id = OLD.journey_job_id
    WHERE user_id = OLD.user_id
      AND journey_job_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tag_quiz_responses_on_job_change ON public.worker_verification;
CREATE TRIGGER trg_tag_quiz_responses_on_job_change
  BEFORE UPDATE OF journey_job_id ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.tag_quiz_responses_on_job_change();

CREATE OR REPLACE FUNCTION public.submit_worker_quiz(p_answers jsonb, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (score numeric, correct_count integer, total_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_job uuid;
  v_total integer := 0;
  v_correct integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
    RAISE EXCEPTION 'Invalid answers payload';
  END IF;

  v_subject := COALESCE(p_user_id, v_uid);
  IF v_subject IS DISTINCT FROM v_uid AND NOT public.partner_manages_worker(v_subject) THEN
    RAISE EXCEPTION 'Not allowed to submit a quiz for this worker';
  END IF;

  SELECT journey_job_id INTO v_job
  FROM public.worker_verification
  WHERE user_id = v_subject;

  INSERT INTO public.worker_skill_quiz_responses (
    user_id, quiz_item_id, journey_job_id, answer, selected_option, is_correct
  )
  SELECT v_subject,
         public.resolve_worker_quiz_item_id(a->>'quiz_item_id'),
         v_job,
         CASE
           WHEN jsonb_typeof(a->'answer') = 'boolean' THEN (a->>'answer')::boolean
           WHEN lower(COALESCE(a->>'answer', '')) IN ('true', 'false') THEN (a->>'answer')::boolean
           ELSE false
         END,
         CASE
           WHEN jsonb_typeof(a->'answer') = 'boolean' THEN NULL
           WHEN lower(COALESCE(a->>'answer', '')) IN ('true', 'false') THEN NULL
           ELSE NULLIF(trim(a->>'answer'), '')
         END,
         false
  FROM jsonb_array_elements(p_answers) a
  WHERE public.resolve_worker_quiz_item_id(a->>'quiz_item_id') IS NOT NULL
  ON CONFLICT (user_id, quiz_item_id, journey_job_id) DO UPDATE
    SET answer = EXCLUDED.answer,
        selected_option = EXCLUDED.selected_option;

  SELECT count(*)::int,
         count(*) FILTER (WHERE r.is_correct)::int
    INTO v_total, v_correct
  FROM public.worker_skill_quiz_responses r
  WHERE r.user_id = v_subject
    AND r.journey_job_id IS NOT DISTINCT FROM v_job
    AND r.quiz_item_id IN (
      SELECT public.resolve_worker_quiz_item_id(a->>'quiz_item_id')
      FROM jsonb_array_elements(p_answers) a
      WHERE public.resolve_worker_quiz_item_id(a->>'quiz_item_id') IS NOT NULL
    );

  RETURN QUERY
  SELECT CASE WHEN v_total > 0
              THEN round((v_correct::numeric / v_total) * 1000) / 10
              ELSE 0 END,
         v_correct,
         v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_worker_quiz(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_worker_quiz(jsonb, uuid) TO authenticated;
