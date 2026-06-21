CREATE TABLE public.worker_skill_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.worker_skills(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_worker_skill_media_skill_id ON public.worker_skill_media(skill_id);
CREATE INDEX idx_worker_skill_media_worker_id ON public.worker_skill_media(worker_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_skill_media TO authenticated;
GRANT ALL ON public.worker_skill_media TO service_role;

ALTER TABLE public.worker_skill_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own skill media"
  ON public.worker_skill_media FOR ALL TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Admins view all skill media"
  ON public.worker_skill_media FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employers view applicant skill media"
  ON public.worker_skill_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.worker_id = worker_skill_media.worker_id
      AND ja.employer_id = auth.uid()
  ));

CREATE POLICY "Employers view shortlisted worker skill media"
  ON public.worker_skill_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shortlisted_workers sw
    WHERE sw.worker_id = worker_skill_media.worker_id
      AND sw.employer_id = auth.uid()
  ));