-- One reusable tracked link per person per job, plus each recorded open.

CREATE TABLE IF NOT EXISTS public.job_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sharer_role text NOT NULL CHECK (sharer_role IN ('admin', 'worker', 'partner', 'employer')),
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, shared_by)
);

CREATE TABLE IF NOT EXISTS public.job_share_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.job_shares(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_shares_job ON public.job_shares (job_id);
CREATE INDEX IF NOT EXISTS idx_job_share_opens_share ON public.job_share_opens (share_id);

GRANT SELECT ON public.job_shares TO authenticated;
GRANT SELECT ON public.job_share_opens TO authenticated;
GRANT ALL ON public.job_shares TO service_role;
GRANT ALL ON public.job_share_opens TO service_role;

ALTER TABLE public.job_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_share_opens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read job shares" ON public.job_shares;
CREATE POLICY "Admins read job shares"
  ON public.job_shares FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own job shares" ON public.job_shares;
CREATE POLICY "Users read own job shares"
  ON public.job_shares FOR SELECT TO authenticated
  USING (shared_by = auth.uid());

DROP POLICY IF EXISTS "Admins read job share opens" ON public.job_share_opens;
CREATE POLICY "Admins read job share opens"
  ON public.job_share_opens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.create_job_share(p_job_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_partner_id uuid;
  v_code text;
  v_existing text;
  v_status text;
  v_try int := 0;
  i int;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status INTO v_status FROM public.jobs WHERE id = p_job_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  IF v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Only active jobs can be shared';
  END IF;

  SELECT id INTO v_partner_id FROM public.partners WHERE user_id = v_uid LIMIT 1;

  IF public.has_role(v_uid, 'admin'::app_role) THEN
    v_role := 'admin';
  ELSIF v_partner_id IS NOT NULL OR public.has_role(v_uid, 'partner'::app_role) THEN
    v_role := 'partner';
  ELSIF public.has_role(v_uid, 'employer'::app_role) THEN
    v_role := 'employer';
  ELSIF public.has_role(v_uid, 'worker'::app_role) THEN
    v_role := 'worker';
  ELSE
    RAISE EXCEPTION 'Only admins, workers, partners, and employers can share jobs';
  END IF;

  SELECT code INTO v_existing
  FROM public.job_shares
  WHERE job_id = p_job_id AND shared_by = v_uid;

  IF v_existing IS NOT NULL THEN
    UPDATE public.job_shares
    SET partner_id = COALESCE(partner_id, v_partner_id),
        sharer_role = v_role
    WHERE job_id = p_job_id AND shared_by = v_uid;
    RETURN v_existing;
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;

    BEGIN
      INSERT INTO public.job_shares (code, job_id, shared_by, sharer_role, partner_id)
      VALUES (v_code, p_job_id, v_uid, v_role, v_partner_id);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO v_existing
      FROM public.job_shares
      WHERE job_id = p_job_id AND shared_by = v_uid;
      IF v_existing IS NOT NULL THEN
        RETURN v_existing;
      END IF;
      IF v_try >= 5 THEN
        RAISE EXCEPTION 'Could not create a share link';
      END IF;
    END;
  END LOOP;

  RAISE EXCEPTION 'Could not create a share link';
END;
$$;

REVOKE ALL ON FUNCTION public.create_job_share(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_job_share(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_job_share_open(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id uuid;
  v_code text := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF v_code = '' OR length(v_code) > 32 THEN
    RETURN;
  END IF;

  SELECT id INTO v_share_id FROM public.job_shares WHERE code = v_code;
  IF v_share_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.job_share_opens (share_id) VALUES (v_share_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_job_share_open(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_job_share_open(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_job_shares()
RETURNS TABLE (
  share_id uuid,
  job_id uuid,
  sharer_role text,
  sharer_name text,
  partner_code text,
  created_at timestamptz,
  open_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.job_id,
    s.sharer_role,
    COALESCE(NULLIF(btrim(pr.full_name), ''), pr.email, 'Unknown'),
    p.partner_code,
    s.created_at,
    (SELECT count(*) FROM public.job_share_opens o WHERE o.share_id = s.id)
  FROM public.job_shares s
  LEFT JOIN public.profiles pr ON pr.id = s.shared_by
  LEFT JOIN public.partners p ON p.id = s.partner_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY s.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_job_shares() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_job_shares() TO authenticated, service_role;

COMMENT ON TABLE public.job_shares IS 'One tracked share link per user per active job.';
COMMENT ON TABLE public.job_share_opens IS 'One row each time a shared job link is opened in a new browser session.';
