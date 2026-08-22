-- Partner kiosk grades Test 1 as auth.uid() (the partner), not the worker.
-- Store and score responses against the worker when the caller manages them.

DROP FUNCTION IF EXISTS public.submit_worker_quiz(jsonb);

CREATE FUNCTION public.submit_worker_quiz(p_answers jsonb, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (score numeric, correct_count integer, total_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_subject uuid;
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

  INSERT INTO public.worker_skill_quiz_responses (user_id, quiz_item_id, answer, is_correct)
  SELECT v_subject,
         (a->>'quiz_item_id')::uuid,
         COALESCE((a->>'answer')::boolean, false),
         false
  FROM jsonb_array_elements(p_answers) a
  WHERE (a->>'quiz_item_id') IS NOT NULL
  ON CONFLICT (user_id, quiz_item_id) DO UPDATE
    SET answer = EXCLUDED.answer;

  SELECT count(*)::int,
         count(*) FILTER (WHERE r.is_correct)::int
    INTO v_total, v_correct
  FROM public.worker_skill_quiz_responses r
  WHERE r.user_id = v_subject
    AND r.quiz_item_id IN (
      SELECT (a->>'quiz_item_id')::uuid FROM jsonb_array_elements(p_answers) a
      WHERE (a->>'quiz_item_id') IS NOT NULL
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
