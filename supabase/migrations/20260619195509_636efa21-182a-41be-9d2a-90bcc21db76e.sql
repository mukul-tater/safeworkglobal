
-- 1. Worker documents: scope employer access to applicants only
DROP POLICY IF EXISTS "Employers can view verified documents" ON public.worker_documents;
CREATE POLICY "Employers can view applicant verified documents"
ON public.worker_documents
FOR SELECT
TO authenticated
USING (
  verification_status = 'verified'
  AND has_role(auth.uid(), 'employer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.worker_id = worker_documents.worker_id
      AND ja.employer_id = auth.uid()
  )
);

-- 2. Partner worker status history: remove unrestricted insert; allow admins explicitly.
-- The handle_partner_worker_status_change trigger runs SECURITY DEFINER so RLS doesn't block it.
DROP POLICY IF EXISTS "System insert worker history" ON public.partner_worker_status_history;
CREATE POLICY "Admins insert worker history"
ON public.partner_worker_status_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Pin search_path on utility functions
CREATE OR REPLACE FUNCTION public.generate_partner_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_seq integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(partner_code FROM 5) AS integer)), 0) + 1
  INTO v_seq
  FROM public.partner_profiles
  WHERE partner_code ~ '^SWP-[0-9]+$';
  RETURN 'SWP-' || LPAD(v_seq::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_partner_tier(p_placements integer)
RETURNS partner_tier
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_placements >= 100 THEN RETURN 'platinum';
  ELSIF p_placements >= 30 THEN RETURN 'gold';
  ELSIF p_placements >= 10 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$;

-- 4. Realtime: scope job_applications / job_formalities / notifications topics to owners
DROP POLICY IF EXISTS "Users can use their own private realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Users can publish to their own private realtime topics" ON realtime.messages;

CREATE POLICY "Users can use their own private realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ANY (ARRAY[
    'user:' || auth.uid()::text,
    'notifications:' || auth.uid()::text,
    'messages:' || auth.uid()::text,
    'job_applications:' || auth.uid()::text,
    'job_formalities:' || auth.uid()::text
  ])
);

CREATE POLICY "Users can publish to their own private realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = ANY (ARRAY[
    'user:' || auth.uid()::text,
    'notifications:' || auth.uid()::text,
    'messages:' || auth.uid()::text,
    'job_applications:' || auth.uid()::text,
    'job_formalities:' || auth.uid()::text
  ])
);
