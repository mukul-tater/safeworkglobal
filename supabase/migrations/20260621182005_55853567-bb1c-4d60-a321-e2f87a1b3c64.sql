
-- 1) Wipe operational data (children → parents)
TRUNCATE TABLE
  public.application_status_history,
  public.job_formalities,
  public.contract_versions,
  public.offers,
  public.interviews,
  public.payments,
  public.disputes,
  public.compliance_checks,
  public.background_verifications,
  public.shortlisted_workers,
  public.saved_jobs,
  public.saved_searches,
  public.job_applications,
  public.job_skills,
  public.jobs,
  public.partner_worker_skill_tests,
  public.partner_worker_status_history,
  public.partner_workers,
  public.partner_worker_drafts,
  public.partner_activities,
  public.partner_incentives,
  public.worker_videos,
  public.worker_documents,
  public.worker_certifications,
  public.worker_training_enrollments,
  public.worker_skills,
  public.work_experience,
  public.worker_profile_employer_info,
  public.worker_profiles,
  public.employer_company_info,
  public.employer_profiles,
  public.partner_profiles,
  public.notifications,
  public.messages,
  public.content_flags,
  public.user_moderation,
  public.admin_actions
RESTART IDENTITY CASCADE;

-- 2) Delete every non-whitelisted auth user (cascades to profiles/user_roles)
DELETE FROM auth.users
WHERE lower(email) NOT IN (
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com'
);

-- 3) Security: stop blanket employer access to worker profiles
DROP POLICY IF EXISTS "Employers can view worker profiles for discovery" ON public.profiles;

-- 4) Security: restrict worker_videos visibility
DROP POLICY IF EXISTS "Authenticated users can view videos" ON public.worker_videos;

CREATE POLICY "Admins can view all worker videos"
  ON public.worker_videos FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employers can view videos of their applicants"
  ON public.worker_videos FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.worker_id = worker_videos.worker_id
        AND ja.employer_id = auth.uid()
    )
  );
