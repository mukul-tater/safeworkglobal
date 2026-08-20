DROP POLICY IF EXISTS "Anyone authenticated reads quiz items" ON public.worker_skill_quiz_items;

CREATE OR REPLACE FUNCTION public.get_worker_quiz_items(p_skill text)
RETURNS TABLE (
  id uuid,
  skill_code text,
  question text,
  question_hi text,
  youtube_url text,
  image_url text,
  options jsonb,
  region text,
  sort_order integer,
  active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.skill_code, i.question, i.question_hi, i.youtube_url, i.image_url,
         i.options, i.region, i.sort_order, i.active, i.created_at
  FROM public.worker_skill_quiz_items i
  WHERE i.active = true
    AND i.skill_code = p_skill
    AND auth.uid() IS NOT NULL
  ORDER BY i.sort_order ASC;
$$;

REVOKE ALL ON FUNCTION public.get_worker_quiz_items(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_worker_quiz_items(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_worker_quiz_items(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_worker_quiz(p_answers jsonb)
RETURNS TABLE (score numeric, correct_count integer, total_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total integer := 0;
  v_correct integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
    RAISE EXCEPTION 'Invalid answers payload';
  END IF;

  INSERT INTO public.worker_skill_quiz_responses (user_id, quiz_item_id, answer, is_correct)
  SELECT v_uid,
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
  WHERE r.user_id = v_uid
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

REVOKE ALL ON FUNCTION public.submit_worker_quiz(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_worker_quiz(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_worker_quiz(jsonb) TO authenticated;
