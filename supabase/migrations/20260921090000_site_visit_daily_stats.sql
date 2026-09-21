-- Admin-only site session counts. Public clients may increment a session
-- but cannot read totals.

DROP TABLE IF EXISTS public.site_visitor_stats;

CREATE TABLE IF NOT EXISTS public.site_visits_daily (
  visit_date date PRIMARY KEY,
  visit_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visits_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read daily visits" ON public.site_visits_daily;
CREATE POLICY "Admins read daily visits"
  ON public.site_visits_daily FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.site_visits_daily FROM anon;
GRANT SELECT ON public.site_visits_daily TO authenticated;

DROP FUNCTION IF EXISTS public.record_site_visit();
CREATE FUNCTION public.record_site_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day date := (timezone('Asia/Kolkata', now()))::date;
BEGIN
  INSERT INTO public.site_visits_daily (visit_date, visit_count)
  VALUES (v_day, 1)
  ON CONFLICT (visit_date) DO UPDATE
    SET visit_count = public.site_visits_daily.visit_count + 1,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_site_visit_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('Asia/Kolkata', now()))::date;
  v_stats jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  WITH series AS (
    SELECT (v_today - g.n)::date AS visit_date
    FROM generate_series(6, 0, -1) AS g(n)
  )
  SELECT jsonb_build_object(
    'all_time', COALESCE((SELECT SUM(visit_count) FROM public.site_visits_daily), 0),
    'today', COALESCE((
      SELECT d.visit_count FROM public.site_visits_daily d
      WHERE d.visit_date = v_today
    ), 0),
    'yesterday', COALESCE((
      SELECT d.visit_count FROM public.site_visits_daily d
      WHERE d.visit_date = v_today - 1
    ), 0),
    'last_7', COALESCE((
      SELECT SUM(d.visit_count) FROM public.site_visits_daily d
      WHERE d.visit_date BETWEEN v_today - 6 AND v_today
    ), 0),
    'series', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'date', s.visit_date,
          'count', COALESCE(d.visit_count, 0)
        ) ORDER BY s.visit_date
      ), '[]'::jsonb)
      FROM series s
      LEFT JOIN public.site_visits_daily d ON d.visit_date = s.visit_date
    )
  ) INTO v_stats;

  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.record_site_visit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_site_visit_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_site_visit() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_site_visit_stats() TO authenticated;
