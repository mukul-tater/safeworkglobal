-- 1. Employer organisation layer
CREATE TABLE public.employer_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employer_organizations TO authenticated;
GRANT ALL ON public.employer_organizations TO service_role;
ALTER TABLE public.employer_organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.employer_org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.employer_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.employer_org_members TO authenticated;
GRANT ALL ON public.employer_org_members TO service_role;
ALTER TABLE public.employer_org_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_employer_org()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.employer_org_members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Admins manage employer orgs" ON public.employer_organizations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members read own org" ON public.employer_organizations
  FOR SELECT TO authenticated USING (id = public.current_employer_org());

CREATE POLICY "Admins manage org members" ON public.employer_org_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members read own membership" ON public.employer_org_members
  FOR SELECT TO authenticated USING (org_id = public.current_employer_org());

-- 2. Worker assignment (explicit + rule based)
CREATE TABLE public.employer_worker_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.employer_organizations(id) ON DELETE CASCADE,
  worker_user_id uuid NOT NULL,
  assigned_by uuid,
  note text,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, worker_user_id)
);
GRANT SELECT ON public.employer_worker_assignments TO authenticated;
GRANT ALL ON public.employer_worker_assignments TO service_role;
ALTER TABLE public.employer_worker_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage worker assignments" ON public.employer_worker_assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members read own assignments" ON public.employer_worker_assignments
  FOR SELECT TO authenticated USING (org_id = public.current_employer_org());
CREATE INDEX idx_ewa_org ON public.employer_worker_assignments(org_id);

CREATE TABLE public.employer_worker_access_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.employer_organizations(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  rule_value text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, rule_type, rule_value),
  CONSTRAINT employer_worker_access_rules_type_check
    CHECK (rule_type IN ('all','trade','state','skill_level','availability'))
);
GRANT SELECT ON public.employer_worker_access_rules TO authenticated;
GRANT ALL ON public.employer_worker_access_rules TO service_role;
ALTER TABLE public.employer_worker_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage access rules" ON public.employer_worker_access_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members read own access rules" ON public.employer_worker_access_rules
  FOR SELECT TO authenticated USING (org_id = public.current_employer_org());

-- 3. Field visibility catalogue + per-org overrides
CREATE TABLE public.employer_visible_field_catalog (
  field_key text PRIMARY KEY,
  label text NOT NULL,
  field_group text NOT NULL,
  sensitive boolean NOT NULL DEFAULT false,
  default_visible boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.employer_visible_field_catalog TO authenticated;
GRANT ALL ON public.employer_visible_field_catalog TO service_role;
ALTER TABLE public.employer_visible_field_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read field catalog" ON public.employer_visible_field_catalog
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage field catalog" ON public.employer_visible_field_catalog
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.employer_visible_field_catalog (field_key,label,field_group,sensitive,default_visible,sort_order) VALUES
  ('full_name','Name','basic',false,true,10),
  ('avatar','Photo','basic',false,true,20),
  ('trade','Trade / Work Type','trade',false,true,30),
  ('skills','Skills','trade',false,true,40),
  ('skill_level','Skill Level','trade',false,true,50),
  ('experience','Experience','trade',false,true,60),
  ('availability','Availability','trade',false,true,70),
  ('location','Location','basic',false,true,80),
  ('nationality','Nationality','basic',false,true,90),
  ('languages','Languages','basic',false,true,100),
  ('open_to_relocation','Open to Relocation','basic',false,true,110),
  ('mobile','Mobile Number','contact',true,false,120),
  ('email','Email','contact',true,false,130),
  ('expected_salary','Expected Salary','salary',true,false,140),
  ('passport','Passport Details','documents',true,false,150),
  ('aadhaar','Aadhaar','documents',true,false,160),
  ('pan','PAN','documents',true,false,170),
  ('kyc_status','KYC Status','documents',false,false,180),
  ('ecr_status','ECR Status','documents',false,false,190),
  ('medical','Medical Information','medical',true,false,200),
  ('family','Family Details','family',true,false,210);

CREATE TABLE public.employer_field_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.employer_organizations(id) ON DELETE CASCADE,
  field_key text NOT NULL REFERENCES public.employer_visible_field_catalog(field_key) ON DELETE CASCADE,
  visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, field_key)
);
GRANT SELECT ON public.employer_field_visibility TO authenticated;
GRANT ALL ON public.employer_field_visibility TO service_role;
ALTER TABLE public.employer_field_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage field visibility" ON public.employer_field_visibility
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members read own field visibility" ON public.employer_field_visibility
  FOR SELECT TO authenticated USING (org_id = public.current_employer_org());

-- updated_at triggers
CREATE TRIGGER trg_employer_organizations_updated BEFORE UPDATE ON public.employer_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employer_org_members_updated BEFORE UPDATE ON public.employer_org_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ewa_updated BEFORE UPDATE ON public.employer_worker_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ewar_updated BEFORE UPDATE ON public.employer_worker_access_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_efv_updated BEFORE UPDATE ON public.employer_field_visibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Backfill orgs for existing employers
INSERT INTO public.employer_organizations (name, owner_user_id)
SELECT COALESCE(NULLIF(ep.company_name,''), COALESCE(p.full_name, p.email, 'Employer')), ep.user_id
FROM public.employer_profiles ep
LEFT JOIN public.profiles p ON p.id = ep.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.employer_org_members m WHERE m.user_id = ep.user_id);

INSERT INTO public.employer_org_members (org_id, user_id, role)
SELECT o.id, o.owner_user_id, 'owner'
FROM public.employer_organizations o
WHERE o.owner_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employer_org_members m WHERE m.user_id = o.owner_user_id);

-- auto-create org when a new employer profile appears
CREATE OR REPLACE FUNCTION public.ensure_employer_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.employer_org_members WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.employer_organizations (name, owner_user_id)
  VALUES (COALESCE(NULLIF(NEW.company_name,''), 'Employer'), NEW.user_id)
  RETURNING id INTO v_org;
  INSERT INTO public.employer_org_members (org_id, user_id, role) VALUES (v_org, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_ensure_employer_org AFTER INSERT ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_employer_org();

-- 5. Access resolution helpers
CREATE OR REPLACE FUNCTION public.employer_visible_worker_ids(p_org uuid)
RETURNS TABLE (worker_user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ids.worker_user_id FROM (
    SELECT a.worker_user_id
    FROM public.employer_worker_assignments a
    WHERE a.org_id = p_org AND a.revoked = false
    UNION
    SELECT wp.user_id
    FROM public.worker_profiles wp
    JOIN public.employer_worker_access_rules r ON r.org_id = p_org
    WHERE (r.rule_type = 'all')
       OR (r.rule_type = 'trade' AND lower(coalesce(wp.primary_work_type, wp.primary_skill, '')) = lower(r.rule_value))
       OR (r.rule_type = 'state' AND lower(coalesce(wp.current_location, '')) = lower(r.rule_value))
       OR (r.rule_type = 'skill_level' AND lower(coalesce(wp.skill_level, '')) = lower(r.rule_value))
       OR (r.rule_type = 'availability' AND lower(coalesce(wp.availability, '')) = lower(r.rule_value))
  ) ids
  WHERE NOT EXISTS (
    SELECT 1 FROM public.employer_worker_assignments a2
    WHERE a2.org_id = p_org AND a2.worker_user_id = ids.worker_user_id AND a2.revoked = true
  );
$$;

CREATE OR REPLACE FUNCTION public.employer_field_map(p_org uuid)
RETURNS TABLE (field_key text, visible boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.field_key, COALESCE(v.visible, c.default_visible)
  FROM public.employer_visible_field_catalog c
  LEFT JOIN public.employer_field_visibility v ON v.field_key = c.field_key AND v.org_id = p_org
$$;

CREATE OR REPLACE FUNCTION public.employer_visible_fields()
RETURNS TABLE (field_key text, label text, field_group text, visible boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.field_key, c.label, c.field_group,
         COALESCE(v.visible, c.default_visible)
  FROM public.employer_visible_field_catalog c
  LEFT JOIN public.employer_field_visibility v
    ON v.field_key = c.field_key AND v.org_id = public.current_employer_org()
  ORDER BY c.sort_order
$$;

-- 6. Employer-facing worker reads
CREATE OR REPLACE FUNCTION public.employer_list_workers(
  p_search text DEFAULT NULL,
  p_trade text DEFAULT NULL,
  p_availability text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  worker_user_id uuid,
  full_name text,
  avatar_url text,
  mobile text,
  email text,
  trade text,
  skill_level text,
  years_of_experience integer,
  skills text[],
  availability text,
  current_location text,
  current_city text,
  nationality text,
  languages text[],
  open_to_relocation boolean,
  expected_salary_min numeric,
  expected_salary_max numeric,
  currency text,
  has_passport boolean,
  passport_number text,
  passport_expiry date,
  aadhaar_last4 text,
  pan_number text,
  kyc_status text,
  ecr_status text,
  medical_status text,
  total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org uuid := public.current_employer_org();
  f jsonb;
BEGIN
  IF v_org IS NULL THEN RETURN; END IF;
  SELECT jsonb_object_agg(m.field_key, m.visible) INTO f FROM public.employer_field_map(v_org) m;

  RETURN QUERY
  WITH allowed AS (SELECT v.worker_user_id AS uid FROM public.employer_visible_worker_ids(v_org) v),
  base AS (
    SELECT wp.*, p.full_name AS p_name, p.email AS p_email, p.phone AS p_phone, p.avatar_url AS p_avatar,
           (SELECT array_agg(ws.skill_name) FROM public.worker_skills ws WHERE ws.worker_id = wp.user_id) AS skill_names,
           (SELECT wv.medical_status FROM public.worker_verification wv WHERE wv.user_id = wp.user_id LIMIT 1) AS med_status
    FROM public.worker_profiles wp
    JOIN allowed a ON a.uid = wp.user_id
    LEFT JOIN public.profiles p ON p.id = wp.user_id
    WHERE (p_trade IS NULL OR p_trade = '' OR lower(coalesce(wp.primary_work_type, wp.primary_skill,'')) = lower(p_trade))
      AND (p_availability IS NULL OR p_availability = '' OR lower(coalesce(wp.availability,'')) = lower(p_availability))
      AND (p_search IS NULL OR p_search = ''
           OR coalesce(p.full_name,'') ILIKE '%'||p_search||'%'
           OR coalesce(wp.primary_work_type, wp.primary_skill,'') ILIKE '%'||p_search||'%'
           OR coalesce(wp.current_location,'') ILIKE '%'||p_search||'%')
  ), counted AS (SELECT count(*) AS c FROM base)
  SELECT
    b.user_id,
    CASE WHEN (f->>'full_name')::boolean THEN b.p_name ELSE 'Worker' END,
    CASE WHEN (f->>'avatar')::boolean THEN b.p_avatar END,
    CASE WHEN (f->>'mobile')::boolean THEN b.p_phone END,
    CASE WHEN (f->>'email')::boolean THEN b.p_email END,
    CASE WHEN (f->>'trade')::boolean THEN coalesce(b.primary_work_type, b.primary_skill) END,
    CASE WHEN (f->>'skill_level')::boolean THEN b.skill_level END,
    CASE WHEN (f->>'experience')::boolean THEN b.years_of_experience END,
    CASE WHEN (f->>'skills')::boolean THEN b.skill_names END,
    CASE WHEN (f->>'availability')::boolean THEN b.availability END,
    CASE WHEN (f->>'location')::boolean THEN b.current_location END,
    CASE WHEN (f->>'location')::boolean THEN b.current_city END,
    CASE WHEN (f->>'nationality')::boolean THEN b.nationality END,
    CASE WHEN (f->>'languages')::boolean THEN b.languages END,
    CASE WHEN (f->>'open_to_relocation')::boolean THEN b.open_to_relocation END,
    CASE WHEN (f->>'expected_salary')::boolean THEN b.expected_salary_min END,
    CASE WHEN (f->>'expected_salary')::boolean THEN b.expected_salary_max END,
    CASE WHEN (f->>'expected_salary')::boolean THEN b.currency END,
    CASE WHEN (f->>'passport')::boolean THEN b.has_passport END,
    CASE WHEN (f->>'passport')::boolean THEN b.passport_number END,
    CASE WHEN (f->>'passport')::boolean THEN b.passport_expiry END,
    CASE WHEN (f->>'aadhaar')::boolean THEN b.aadhaar_last4 END,
    CASE WHEN (f->>'pan')::boolean THEN b.pan_number END,
    CASE WHEN (f->>'kyc_status')::boolean THEN b.kyc_status END,
    CASE WHEN (f->>'ecr_status')::boolean THEN b.ecr_status END,
    CASE WHEN (f->>'medical')::boolean THEN b.med_status END,
    (SELECT c FROM counted)
  FROM base b
  ORDER BY b.updated_at DESC NULLS LAST
  LIMIT GREATEST(coalesce(p_limit,50),1) OFFSET GREATEST(coalesce(p_offset,0),0);
END;
$$;

CREATE OR REPLACE FUNCTION public.employer_get_worker(p_worker_user_id uuid)
RETURNS TABLE (
  worker_user_id uuid,
  full_name text,
  avatar_url text,
  mobile text,
  email text,
  trade text,
  skill_level text,
  years_of_experience integer,
  skills text[],
  availability text,
  current_location text,
  current_city text,
  nationality text,
  languages text[],
  open_to_relocation boolean,
  expected_salary_min numeric,
  expected_salary_max numeric,
  currency text,
  has_passport boolean,
  passport_number text,
  passport_expiry date,
  aadhaar_last4 text,
  pan_number text,
  kyc_status text,
  ecr_status text,
  medical_status text,
  bio text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org uuid := public.current_employer_org();
  f jsonb;
BEGIN
  IF v_org IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.employer_visible_worker_ids(v_org) v WHERE v.worker_user_id = p_worker_user_id) THEN
    RETURN;
  END IF;
  SELECT jsonb_object_agg(m.field_key, m.visible) INTO f FROM public.employer_field_map(v_org) m;

  RETURN QUERY
  SELECT
    wp.user_id,
    CASE WHEN (f->>'full_name')::boolean THEN p.full_name ELSE 'Worker' END,
    CASE WHEN (f->>'avatar')::boolean THEN p.avatar_url END,
    CASE WHEN (f->>'mobile')::boolean THEN p.phone END,
    CASE WHEN (f->>'email')::boolean THEN p.email END,
    CASE WHEN (f->>'trade')::boolean THEN coalesce(wp.primary_work_type, wp.primary_skill) END,
    CASE WHEN (f->>'skill_level')::boolean THEN wp.skill_level END,
    CASE WHEN (f->>'experience')::boolean THEN wp.years_of_experience END,
    CASE WHEN (f->>'skills')::boolean THEN (SELECT array_agg(ws.skill_name) FROM public.worker_skills ws WHERE ws.worker_id = wp.user_id) END,
    CASE WHEN (f->>'availability')::boolean THEN wp.availability END,
    CASE WHEN (f->>'location')::boolean THEN wp.current_location END,
    CASE WHEN (f->>'location')::boolean THEN wp.current_city END,
    CASE WHEN (f->>'nationality')::boolean THEN wp.nationality END,
    CASE WHEN (f->>'languages')::boolean THEN wp.languages END,
    CASE WHEN (f->>'open_to_relocation')::boolean THEN wp.open_to_relocation END,
    CASE WHEN (f->>'expected_salary')::boolean THEN wp.expected_salary_min END,
    CASE WHEN (f->>'expected_salary')::boolean THEN wp.expected_salary_max END,
    CASE WHEN (f->>'expected_salary')::boolean THEN wp.currency END,
    CASE WHEN (f->>'passport')::boolean THEN wp.has_passport END,
    CASE WHEN (f->>'passport')::boolean THEN wp.passport_number END,
    CASE WHEN (f->>'passport')::boolean THEN wp.passport_expiry END,
    CASE WHEN (f->>'aadhaar')::boolean THEN wp.aadhaar_last4 END,
    CASE WHEN (f->>'pan')::boolean THEN wp.pan_number END,
    CASE WHEN (f->>'kyc_status')::boolean THEN wp.kyc_status END,
    CASE WHEN (f->>'ecr_status')::boolean THEN wp.ecr_status END,
    CASE WHEN (f->>'medical')::boolean THEN (SELECT wv.medical_status FROM public.worker_verification wv WHERE wv.user_id = wp.user_id LIMIT 1) END,
    wp.bio
  FROM public.worker_profiles wp
  LEFT JOIN public.profiles p ON p.id = wp.user_id
  WHERE wp.user_id = p_worker_user_id;
END;
$$;

-- 7. Admin helpers
CREATE OR REPLACE FUNCTION public.admin_list_employer_orgs()
RETURNS TABLE (org_id uuid, name text, owner_user_id uuid, owner_email text, assigned_workers bigint, rules bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.owner_user_id, p.email,
    (SELECT count(*) FROM public.employer_worker_assignments a WHERE a.org_id = o.id AND a.revoked = false),
    (SELECT count(*) FROM public.employer_worker_access_rules r WHERE r.org_id = o.id)
  FROM public.employer_organizations o
  LEFT JOIN public.profiles p ON p.id = o.owner_user_id
  WHERE public.has_role(auth.uid(),'admin')
  ORDER BY o.name
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_workers(p_org uuid, p_worker_ids uuid[], p_note text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.employer_worker_assignments (org_id, worker_user_id, assigned_by, note, revoked)
  SELECT p_org, w, auth.uid(), p_note, false FROM unnest(p_worker_ids) w
  ON CONFLICT (org_id, worker_user_id) DO UPDATE SET revoked = false, note = COALESCE(EXCLUDED.note, public.employer_worker_assignments.note), updated_at = now();
  SELECT coalesce(array_length(p_worker_ids,1),0) INTO n;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_worker_assignment(p_org uuid, p_worker_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.employer_worker_assignments (org_id, worker_user_id, assigned_by, revoked)
  VALUES (p_org, p_worker_user_id, auth.uid(), true)
  ON CONFLICT (org_id, worker_user_id) DO UPDATE SET revoked = true, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_field_visibility(p_org uuid, p_field_key text, p_visible boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.employer_field_visibility (org_id, field_key, visible)
  VALUES (p_org, p_field_key, p_visible)
  ON CONFLICT (org_id, field_key) DO UPDATE SET visible = EXCLUDED.visible, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_employer_org_workers(p_org uuid)
RETURNS TABLE (worker_user_id uuid, full_name text, mobile text, trade text, state text, source text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT wp.user_id, p.full_name, p.phone, coalesce(wp.primary_work_type, wp.primary_skill), wp.current_location,
         CASE WHEN EXISTS (SELECT 1 FROM public.employer_worker_assignments a WHERE a.org_id = p_org AND a.worker_user_id = wp.user_id AND a.revoked = false)
              THEN 'assigned' ELSE 'rule' END
  FROM public.worker_profiles wp
  JOIN public.employer_visible_worker_ids(p_org) v ON v.worker_user_id = wp.user_id
  LEFT JOIN public.profiles p ON p.id = wp.user_id
  WHERE public.has_role(auth.uid(),'admin')
  ORDER BY p.full_name
$$;

GRANT EXECUTE ON FUNCTION public.current_employer_org() TO authenticated;
GRANT EXECUTE ON FUNCTION public.employer_visible_fields() TO authenticated;
GRANT EXECUTE ON FUNCTION public.employer_list_workers(text,text,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.employer_get_worker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_employer_orgs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_workers(uuid,uuid[],text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_worker_assignment(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_field_visibility(uuid,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_employer_org_workers(uuid) TO authenticated;