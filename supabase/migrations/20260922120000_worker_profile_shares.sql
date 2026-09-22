-- Admin can share a worker's full dossier (profile, ID docs, skill videos,
-- trade-test evidence) with a specific employer org or MEA Licensed RA.

CREATE TABLE IF NOT EXISTS public.worker_profile_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('employer', 'ra')),
  recipient_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS worker_profile_shares_active_uniq
  ON public.worker_profile_shares (worker_id, recipient_type, recipient_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_worker_profile_shares_worker
  ON public.worker_profile_shares (worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_profile_shares_recipient
  ON public.worker_profile_shares (recipient_type, recipient_id)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_worker_profile_shares_token
  ON public.worker_profile_shares (share_token);

GRANT SELECT ON public.worker_profile_shares TO authenticated;
GRANT ALL ON public.worker_profile_shares TO service_role;
ALTER TABLE public.worker_profile_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage worker profile shares"
  ON public.worker_profile_shares FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recipients read own worker profile shares"
  ON public.worker_profile_shares FOR SELECT TO authenticated
  USING (
    revoked_at IS NULL
    AND (
      (recipient_type = 'employer' AND recipient_id = public.current_employer_org())
      OR (
        recipient_type = 'ra'
        AND recipient_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
      )
    )
  );

-- True when the signed-in employer org or RA has an active share for this worker.
CREATE OR REPLACE FUNCTION public.has_shared_worker_access(p_worker_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.worker_profile_shares s
    WHERE s.worker_id = p_worker_id
      AND s.revoked_at IS NULL
      AND (
        (s.recipient_type = 'employer' AND s.recipient_id = public.current_employer_org())
        OR (
          s.recipient_type = 'ra'
          AND s.recipient_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_shared_worker_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_shared_worker_access(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: share recipients can read the full dossier
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Share recipients view worker profiles" ON public.worker_profiles;
CREATE POLICY "Share recipients view worker profiles"
  ON public.worker_profiles FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(user_id));

DROP POLICY IF EXISTS "Share recipients view user profiles" ON public.profiles;
CREATE POLICY "Share recipients view user profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(id));

DROP POLICY IF EXISTS "Share recipients view worker documents" ON public.worker_documents;
CREATE POLICY "Share recipients view worker documents"
  ON public.worker_documents FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DROP POLICY IF EXISTS "Share recipients view worker skills" ON public.worker_skills;
CREATE POLICY "Share recipients view worker skills"
  ON public.worker_skills FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DROP POLICY IF EXISTS "Share recipients view worker skill media" ON public.worker_skill_media;
CREATE POLICY "Share recipients view worker skill media"
  ON public.worker_skill_media FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DROP POLICY IF EXISTS "Share recipients view work experience" ON public.work_experience;
CREATE POLICY "Share recipients view work experience"
  ON public.work_experience FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DROP POLICY IF EXISTS "Share recipients view worker certifications" ON public.worker_certifications;
CREATE POLICY "Share recipients view worker certifications"
  ON public.worker_certifications FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DO $$
BEGIN
  IF to_regclass('public.worker_videos') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Share recipients view worker videos" ON public.worker_videos';
    EXECUTE $p$
      CREATE POLICY "Share recipients view worker videos"
        ON public.worker_videos FOR SELECT TO authenticated
        USING (public.has_shared_worker_access(worker_id))
    $p$;
  END IF;
END $$;

DROP POLICY IF EXISTS "Share recipients view worker verification" ON public.worker_verification;
CREATE POLICY "Share recipients view worker verification"
  ON public.worker_verification FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(user_id));

DROP POLICY IF EXISTS "Share recipients view assessments" ON public.assessments;
CREATE POLICY "Share recipients view assessments"
  ON public.assessments FOR SELECT TO authenticated
  USING (public.has_shared_worker_access(worker_id));

DROP POLICY IF EXISTS "Share recipients view assessment scores" ON public.assessment_scores;
CREATE POLICY "Share recipients view assessment scores"
  ON public.assessment_scores FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments a
      WHERE public.has_shared_worker_access(a.worker_id)
    )
  );

DROP POLICY IF EXISTS "Share recipients view assessment media" ON public.assessment_media;
CREATE POLICY "Share recipients view assessment media"
  ON public.assessment_media FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments a
      WHERE public.has_shared_worker_access(a.worker_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: signed URLs for ID docs, skill videos, trade-test evidence
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Share recipients read worker documents" ON storage.objects;
CREATE POLICY "Share recipients read worker documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND EXISTS (
      SELECT 1
      FROM public.worker_profile_shares s
      WHERE s.revoked_at IS NULL
        AND s.worker_id::text = (storage.foldername(name))[1]
        AND (
          (s.recipient_type = 'employer' AND s.recipient_id = public.current_employer_org())
          OR (
            s.recipient_type = 'ra'
            AND s.recipient_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
          )
        )
    )
  );

DROP POLICY IF EXISTS "Share recipients read worker videos" ON storage.objects;
CREATE POLICY "Share recipients read worker videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-videos'
    AND EXISTS (
      SELECT 1
      FROM public.worker_profile_shares s
      WHERE s.revoked_at IS NULL
        AND s.worker_id::text = (storage.foldername(name))[1]
        AND (
          (s.recipient_type = 'employer' AND s.recipient_id = public.current_employer_org())
          OR (
            s.recipient_type = 'ra'
            AND s.recipient_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
          )
        )
    )
  );

DROP POLICY IF EXISTS "Share recipients read assessment evidence" ON storage.objects;
CREATE POLICY "Share recipients read assessment evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assessment-evidence'
    AND (
      EXISTS (
        SELECT 1
        FROM public.assessment_media am
        JOIN public.assessments a ON a.id = am.assessment_id
        WHERE am.storage_path = name
          AND public.has_shared_worker_access(a.worker_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.assessments a
        WHERE public.has_shared_worker_access(a.worker_id)
          AND (
            a.kyc_photo_path = name
            OR a.kyc_video_path = name
            OR a.arrival_photo_path = name
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Admin + recipient RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_share_recipients(p_query text DEFAULT '')
RETURNS TABLE (
  recipient_type text,
  recipient_id uuid,
  name text,
  detail text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := lower(trim(coalesce(p_query, '')));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    SELECT
      'employer'::text AS recipient_type,
      o.id AS recipient_id,
      COALESCE(NULLIF(o.name, ''), p.full_name, p.email, 'Employer') AS name,
      COALESCE(p.email, p.phone, '') AS detail
    FROM public.employer_organizations o
    LEFT JOIN public.profiles p ON p.id = o.owner_user_id

    UNION ALL

    SELECT
      'ra'::text,
      pt.id,
      COALESCE(NULLIF(ppe.company_name, ''), pt.partner_code, 'MEA Licensed RA'),
      COALESCE(ppe.email, ppe.mobile, pt.partner_code, '')
    FROM public.partners pt
    JOIN public.partner_types t ON t.id = pt.partner_type_id AND t.code = 'SRN'
    LEFT JOIN public.partner_profiles_ext ppe ON ppe.partner_id = pt.id
  ) r
  WHERE q = ''
     OR lower(r.name) LIKE '%' || q || '%'
     OR lower(r.detail) LIKE '%' || q || '%'
  ORDER BY r.recipient_type, r.name
  LIMIT 80;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_worker_share(
  p_worker_id uuid,
  p_recipient_type text,
  p_recipient_id uuid
)
RETURNS TABLE (
  share_id uuid,
  share_token text,
  recipient_type text,
  recipient_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text := lower(trim(p_recipient_type));
  v_row public.worker_profile_shares;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_type NOT IN ('employer', 'ra') THEN
    RAISE EXCEPTION 'Recipient must be an employer or RA';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_worker_id AND ur.role = 'worker'
  ) THEN
    RAISE EXCEPTION 'Worker not found';
  END IF;

  IF v_type = 'employer' THEN
    IF NOT EXISTS (SELECT 1 FROM public.employer_organizations o WHERE o.id = p_recipient_id) THEN
      RAISE EXCEPTION 'Employer not found';
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.partners p
      JOIN public.partner_types t ON t.id = p.partner_type_id
      WHERE p.id = p_recipient_id AND t.code = 'SRN'
    ) THEN
      RAISE EXCEPTION 'MEA Licensed RA not found';
    END IF;
  END IF;

  SELECT * INTO v_row
  FROM public.worker_profile_shares s
  WHERE s.worker_id = p_worker_id
    AND s.recipient_type = v_type
    AND s.recipient_id = p_recipient_id
    AND s.revoked_at IS NULL
  LIMIT 1;

  IF v_row.id IS NULL THEN
    INSERT INTO public.worker_profile_shares (
      worker_id, recipient_type, recipient_id, created_by
    ) VALUES (
      p_worker_id, v_type, p_recipient_id, auth.uid()
    )
    RETURNING * INTO v_row;
  END IF;

  share_id := v_row.id;
  share_token := v_row.share_token;
  recipient_type := v_row.recipient_type;
  recipient_id := v_row.recipient_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_worker_shares(p_worker_id uuid)
RETURNS TABLE (
  share_id uuid,
  recipient_type text,
  recipient_id uuid,
  recipient_name text,
  recipient_detail text,
  share_token text,
  created_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.recipient_type,
    s.recipient_id,
    CASE
      WHEN s.recipient_type = 'employer' THEN COALESCE(NULLIF(o.name, ''), ep.full_name, ep.email, 'Employer')
      ELSE COALESCE(NULLIF(ppe.company_name, ''), p.partner_code, 'MEA Licensed RA')
    END,
    CASE
      WHEN s.recipient_type = 'employer' THEN COALESCE(ep.email, ep.phone, '')
      ELSE COALESCE(ppe.email, ppe.mobile, p.partner_code, '')
    END,
    s.share_token,
    s.created_at,
    s.revoked_at
  FROM public.worker_profile_shares s
  LEFT JOIN public.employer_organizations o
    ON s.recipient_type = 'employer' AND o.id = s.recipient_id
  LEFT JOIN public.profiles ep
    ON ep.id = o.owner_user_id
  LEFT JOIN public.partners p
    ON s.recipient_type = 'ra' AND p.id = s.recipient_id
  LEFT JOIN public.partner_profiles_ext ppe
    ON ppe.partner_id = p.id
  WHERE s.worker_id = p_worker_id
  ORDER BY s.revoked_at NULLS FIRST, s.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_worker_share(p_share_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.worker_profile_shares
     SET revoked_at = now()
   WHERE id = p_share_id
     AND revoked_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_worker_share_by_token(p_token text)
RETURNS TABLE (
  share_id uuid,
  worker_id uuid,
  worker_name text,
  recipient_type text,
  recipient_id uuid,
  recipient_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := lower(trim(coalesce(p_token, '')));
  v_share public.worker_profile_shares;
  v_ok boolean := false;
  v_recipient_name text;
BEGIN
  IF v_token = '' THEN
    RAISE EXCEPTION 'Share link is invalid';
  END IF;

  SELECT * INTO v_share
  FROM public.worker_profile_shares s
  WHERE s.share_token = v_token
  LIMIT 1;

  IF v_share.id IS NULL THEN
    RAISE EXCEPTION 'Share link is invalid';
  END IF;
  IF v_share.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'This share link is no longer active';
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    v_ok := true;
  ELSIF v_share.recipient_type = 'employer' AND v_share.recipient_id = public.current_employer_org() THEN
    v_ok := true;
  ELSIF v_share.recipient_type = 'ra' AND EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = v_share.recipient_id AND p.user_id = auth.uid()
  ) THEN
    v_ok := true;
  END IF;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'This worker profile was shared with a different employer or RA account';
  END IF;

  IF v_share.recipient_type = 'employer' THEN
    SELECT COALESCE(NULLIF(o.name, ''), pr.full_name, pr.email, 'Employer')
      INTO v_recipient_name
    FROM public.employer_organizations o
    LEFT JOIN public.profiles pr ON pr.id = o.owner_user_id
    WHERE o.id = v_share.recipient_id;
  ELSE
    SELECT COALESCE(NULLIF(ppe.company_name, ''), p.partner_code, 'MEA Licensed RA')
      INTO v_recipient_name
    FROM public.partners p
    LEFT JOIN public.partner_profiles_ext ppe ON ppe.partner_id = p.id
    WHERE p.id = v_share.recipient_id;
  END IF;

  share_id := v_share.id;
  worker_id := v_share.worker_id;
  SELECT COALESCE(pr.full_name, pr.phone, 'Worker') INTO worker_name
  FROM public.profiles pr WHERE pr.id = v_share.worker_id;
  recipient_type := v_share.recipient_type;
  recipient_id := v_share.recipient_id;
  recipient_name := COALESCE(v_recipient_name, 'Recipient');
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_shared_workers()
RETURNS TABLE (
  share_id uuid,
  worker_id uuid,
  share_token text,
  created_at timestamptz,
  full_name text,
  phone text,
  primary_work_type text,
  current_location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.worker_id,
    s.share_token,
    s.created_at,
    pr.full_name,
    pr.phone,
    wp.primary_work_type,
    COALESCE(wp.current_location, wp.current_city, wp.country)
  FROM public.worker_profile_shares s
  LEFT JOIN public.profiles pr ON pr.id = s.worker_id
  LEFT JOIN public.worker_profiles wp ON wp.user_id = s.worker_id
  WHERE s.revoked_at IS NULL
    AND (
      (s.recipient_type = 'employer' AND s.recipient_id = public.current_employer_org())
      OR (
        s.recipient_type = 'ra'
        AND s.recipient_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
      )
    )
  ORDER BY s.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_share_recipients(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_create_worker_share(uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_worker_shares(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revoke_worker_share(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_worker_share_by_token(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_my_shared_workers() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_list_share_recipients(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_worker_share(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_worker_shares(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_worker_share(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_worker_share_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_shared_workers() TO authenticated;
