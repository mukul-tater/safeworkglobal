-- Live Test 1 still submits bundled ids like "mason-1". Those are not UUIDs, so
-- submit_worker_quiz crashed with: invalid input syntax for type uuid: "mason-1".
-- Resolve slug ids onto the matching worker_skill_quiz_items row and ignore
-- anything that cannot be mapped.

CREATE OR REPLACE FUNCTION public.resolve_worker_quiz_item_id(p_raw text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw text := lower(trim(COALESCE(p_raw, '')));
  v_slug text;
  v_n integer;
  v_id uuid;
BEGIN
  IF v_raw = '' THEN
    RETURN NULL;
  END IF;

  IF v_raw ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_raw::uuid;
  END IF;

  IF v_raw !~ '^[a-z0-9]+(-[a-z0-9]+)*-[0-9]+$' THEN
    RETURN NULL;
  END IF;

  v_n := (regexp_match(v_raw, '-([0-9]+)$'))[1]::integer;
  v_slug := regexp_replace(v_raw, '-[0-9]+$', '');

  -- Old Yes/No JSON packs (mason-1) map onto coarse skill rows, even if inactive.
  SELECT i.id
    INTO v_id
  FROM public.worker_skill_quiz_items i
  WHERE i.sort_order = v_n
    AND lower(regexp_replace(regexp_replace(i.skill_code, '[^[:alnum:]]+', '-', 'g'), '^-+|-+$', '', 'g')) = v_slug
    AND (i.options IS NULL OR jsonb_typeof(i.options) <> 'array' OR jsonb_array_length(i.options) < 2)
  ORDER BY i.active DESC NULLS LAST, i.updated_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Bundled MCQ fallback ids such as mason-tiles-marble-1.
  SELECT i.id
    INTO v_id
  FROM public.worker_skill_quiz_items i
  WHERE i.sort_order = v_n
    AND lower(regexp_replace(regexp_replace(i.skill_code, '[^[:alnum:]]+', '-', 'g'), '^-+|-+$', '', 'g')) = v_slug
  ORDER BY i.active DESC NULLS LAST, i.updated_at DESC
  LIMIT 1;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_worker_quiz_item_id(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_worker_quiz(p_answers jsonb, p_user_id uuid DEFAULT NULL)
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

  INSERT INTO public.worker_skill_quiz_responses (user_id, quiz_item_id, answer, selected_option, is_correct)
  SELECT v_subject,
         public.resolve_worker_quiz_item_id(a->>'quiz_item_id'),
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
  ON CONFLICT (user_id, quiz_item_id) DO UPDATE
    SET answer = EXCLUDED.answer,
        selected_option = EXCLUDED.selected_option;

  SELECT count(*)::int,
         count(*) FILTER (WHERE r.is_correct)::int
    INTO v_total, v_correct
  FROM public.worker_skill_quiz_responses r
  WHERE r.user_id = v_subject
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
