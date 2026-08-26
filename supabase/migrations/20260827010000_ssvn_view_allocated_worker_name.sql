-- SSVN centres need the allocated worker's name. Identity docs are already
-- readable via worker_profiles; names live on public.profiles.

DROP POLICY IF EXISTS "ssvn view allocated worker user profile" ON public.profiles;
CREATE POLICY "ssvn view allocated worker user profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.assessments a
      JOIN public.partners p ON p.id = a.partner_id
      WHERE a.worker_id = profiles.id
        AND p.user_id = auth.uid()
        AND a.status IS DISTINCT FROM 'centre_rejected'
    )
  );
