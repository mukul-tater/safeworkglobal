-- UAE employer registration: nested manpower requirements, commercial model, documents.

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS trade_licence_path text,
  ADD COLUMN IF NOT EXISTS company_profile_path text,
  ADD COLUMN IF NOT EXISTS contact_full_name text,
  ADD COLUMN IF NOT EXISTS contact_designation text,
  ADD COLUMN IF NOT EXISTS uae_mobile text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS preferred_communication text,
  ADD COLUMN IF NOT EXISTS additional_contact_number text,
  ADD COLUMN IF NOT EXISTS partnership_model text,
  ADD COLUMN IF NOT EXISTS commercial_notes text,
  ADD COLUMN IF NOT EXISTS declaration_authorized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_accurate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_regulations boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_contact_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requirement_reference_id text,
  ADD COLUMN IF NOT EXISTS requirement_submitted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS employer_profiles_requirement_reference_id_key
  ON public.employer_profiles (requirement_reference_id)
  WHERE requirement_reference_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.employer_manpower_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade text NOT NULL,
  number_of_workers integer NOT NULL CHECK (number_of_workers > 0 AND number_of_workers <= 5000),
  experience text,
  location text NOT NULL DEFAULT 'Dubai, UAE',
  project_name text,
  joining_date date,
  project_duration text,
  gender text NOT NULL DEFAULT 'Any',
  technical_skills text[] NOT NULL DEFAULT '{}',
  additional_requirements text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employer_manpower_requirements_user_idx
  ON public.employer_manpower_requirements (employer_user_id, sort_order);

ALTER TABLE public.employer_manpower_requirements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_manpower_requirements TO authenticated;
GRANT ALL ON public.employer_manpower_requirements TO service_role;

DROP POLICY IF EXISTS "Employers manage own manpower requirements" ON public.employer_manpower_requirements;
CREATE POLICY "Employers manage own manpower requirements"
  ON public.employer_manpower_requirements
  FOR ALL TO authenticated
  USING (
    employer_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    employer_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.generate_employer_requirement_ref()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  n int;
BEGIN
  LOOP
    n := floor(random() * 900000)::int + 100000;
    candidate := 'SWG-EMP-' || n::text;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.employer_profiles WHERE requirement_reference_id = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_employer_requirement_ref(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing text;
  generated text;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT requirement_reference_id INTO existing
  FROM public.employer_profiles
  WHERE user_id = p_user_id;

  IF existing IS NOT NULL AND length(existing) > 0 THEN
    RETURN existing;
  END IF;

  generated := public.generate_employer_requirement_ref();

  UPDATE public.employer_profiles
  SET
    requirement_reference_id = generated,
    requirement_submitted_at = COALESCE(requirement_submitted_at, now()),
    onboarding_completed = true,
    updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'employer profile not found';
  END IF;

  RETURN generated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_employer_requirement_ref(uuid) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employer-documents',
  'employer-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Employers read own employer documents" ON storage.objects;
CREATE POLICY "Employers read own employer documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'employer-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Employers upload own employer documents" ON storage.objects;
CREATE POLICY "Employers upload own employer documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Employers update own employer documents" ON storage.objects;
CREATE POLICY "Employers update own employer documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'employer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Employers delete own employer documents" ON storage.objects;
CREATE POLICY "Employers delete own employer documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'employer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
