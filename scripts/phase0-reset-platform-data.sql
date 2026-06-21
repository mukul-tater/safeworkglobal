-- Phase 0: SafeWork Global platform data reset
-- Run in Supabase Dashboard → SQL Editor (requires postgres role).
--
-- Keeps ONLY these admin accounts:
--   gurpreetsinghelectrician@gmail.com
--   kailash@safeworkglobal.com
--   mukul@safeworkglobal.com
--
-- Wipes: jobs, profiles (worker/employer/partner), applications, onboarding,
-- partner data, test submissions, and all other non-admin users.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Transactional / domain data (child tables first)
-- ---------------------------------------------------------------------------

DELETE FROM public.onboarding_audit_logs;
DELETE FROM public.worker_onboarding_languages;
DELETE FROM public.worker_onboarding_preferences;
DELETE FROM public.worker_onboarding_work_history;
DELETE FROM public.worker_onboarding_certifications;
DELETE FROM public.worker_onboarding_skills;
DELETE FROM public.worker_onboarding_documents;
DELETE FROM public.worker_onboarding_profile;
DELETE FROM public.worker_onboarding;

DELETE FROM public.partner_worker_status_history;
DELETE FROM public.partner_worker_skill_tests;
DELETE FROM public.partner_incentives;
DELETE FROM public.partner_activities;
DELETE FROM public.partner_worker_drafts;
DELETE FROM public.partner_workers;
DELETE FROM public.partner_profiles;

DELETE FROM public.contract_versions;
DELETE FROM public.application_status_history;
DELETE FROM public.job_formalities;
DELETE FROM public.interviews;
DELETE FROM public.offers;
DELETE FROM public.saved_jobs;
DELETE FROM public.shortlisted_workers;
DELETE FROM public.saved_searches;
DELETE FROM public.job_applications;
DELETE FROM public.job_skills;
DELETE FROM public.jobs;

DELETE FROM public.worker_training_enrollments;
DELETE FROM public.training_courses;
DELETE FROM public.worker_videos;
DELETE FROM public.worker_documents;
DELETE FROM public.worker_skills;
DELETE FROM public.worker_certifications;
DELETE FROM public.work_experience;
DELETE FROM public.worker_profile_employer_info;
DELETE FROM public.worker_profiles;

DELETE FROM public.employer_company_info;
DELETE FROM public.employer_profiles;

DELETE FROM public.background_verifications;
DELETE FROM public.payments;
DELETE FROM public.disputes;
DELETE FROM public.messages;
DELETE FROM public.user_moderation;
DELETE FROM public.content_flags;
DELETE FROM public.compliance_checks;
DELETE FROM public.notifications;
DELETE FROM public.push_subscriptions;
DELETE FROM public.contact_submissions;
DELETE FROM public.admin_actions;

DELETE FROM public.worker_portal_tokens;
DELETE FROM public.worker_portal_otp;
DELETE FROM public.worker_portal_users;

-- Legacy tables (no-op if already dropped)
DO $legacy$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.documents';
  END IF;
  IF to_regclass('public.contracts') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.contracts';
  END IF;
  IF to_regclass('public.job_postings') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.job_postings';
  END IF;
END
$legacy$;

-- ---------------------------------------------------------------------------
-- 2) Remove all auth users except the three whitelisted admins
--    (cascades profiles + most user-linked rows)
-- ---------------------------------------------------------------------------

DELETE FROM auth.users
WHERE lower(email) NOT IN (
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com'
);

-- ---------------------------------------------------------------------------
-- 3) Ensure kept accounts are admins only
-- ---------------------------------------------------------------------------

DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN (
    'gurpreetsinghelectrician@gmail.com',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com'
  )
);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN (
  'gurpreetsinghelectrician@gmail.com',
  'kailash@safeworkglobal.com',
  'mukul@safeworkglobal.com'
);

-- Strip any role-specific profile rows that may remain on admin accounts
DELETE FROM public.worker_profiles
WHERE user_id IN (SELECT id FROM auth.users);

DELETE FROM public.employer_profiles
WHERE user_id IN (SELECT id FROM auth.users);

DELETE FROM public.partner_profiles
WHERE user_id IN (SELECT id FROM auth.users);

-- ---------------------------------------------------------------------------
-- 4) Reset partner reward defaults (admin-configurable, not test data)
-- ---------------------------------------------------------------------------

INSERT INTO public.partner_reward_config (id, placement_reward_amount, worker_fee_amount, updated_at)
VALUES (true, 1000, 35400, now())
ON CONFLICT (id) DO UPDATE SET
  placement_reward_amount = EXCLUDED.placement_reward_amount,
  worker_fee_amount = EXCLUDED.worker_fee_amount,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5) Update admin auto-promotion whitelist for new sign-ups
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN (
    'gurpreetsinghelectrician@gmail.com',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();

CREATE OR REPLACE FUNCTION public.ensure_whitelisted_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(email) INTO v_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_email IS NULL OR v_email NOT IN (
    'gurpreetsinghelectrician@gmail.com',
    'kailash@safeworkglobal.com',
    'mukul@safeworkglobal.com'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_whitelisted_admin() TO authenticated;

COMMIT;

-- Verification (run separately if desired):
-- SELECT email FROM auth.users ORDER BY email;
-- SELECT COUNT(*) AS jobs FROM public.jobs;
-- SELECT COUNT(*) AS worker_profiles FROM public.worker_profiles;
-- SELECT COUNT(*) AS applications FROM public.job_applications;
