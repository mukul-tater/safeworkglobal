
-- 1) Wipe demo job & application data
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

-- 2) Add gating columns on worker_profiles (idempotent)
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS tenth_pass_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_skill text;

-- 3) partner_reward_config (single-row config)
CREATE TABLE IF NOT EXISTS public.partner_reward_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  placement_reward_amount numeric(12,2) NOT NULL DEFAULT 1000,
  worker_fee_amount numeric(12,2) NOT NULL DEFAULT 35400,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.partner_reward_config TO authenticated;
GRANT ALL ON public.partner_reward_config TO service_role;

ALTER TABLE public.partner_reward_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read reward config" ON public.partner_reward_config;
CREATE POLICY "Authenticated can read reward config"
  ON public.partner_reward_config FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage reward config" ON public.partner_reward_config;
CREATE POLICY "Admins manage reward config"
  ON public.partner_reward_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.partner_reward_config (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- 4) partner_worker_skill_tests
DO $$ BEGIN
  CREATE TYPE public.partner_skill_test_stage AS ENUM ('partner','phone','physical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_skill_test_status AS ENUM ('pending','passed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.partner_worker_skill_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_worker_id uuid NOT NULL REFERENCES public.partner_workers(id) ON DELETE CASCADE,
  partner_profile_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  stage public.partner_skill_test_stage NOT NULL,
  status public.partner_skill_test_status NOT NULL DEFAULT 'pending',
  notes text,
  fee_received boolean NOT NULL DEFAULT false,
  evaluated_by uuid,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_worker_id, stage)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_worker_skill_tests TO authenticated;
GRANT ALL ON public.partner_worker_skill_tests TO service_role;

ALTER TABLE public.partner_worker_skill_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partner can read own worker tests" ON public.partner_worker_skill_tests;
CREATE POLICY "Partner can read own worker tests"
  ON public.partner_worker_skill_tests FOR SELECT
  TO authenticated
  USING (
    partner_profile_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Partner can manage stage 1 test" ON public.partner_worker_skill_tests;
CREATE POLICY "Partner can manage stage 1 test"
  ON public.partner_worker_skill_tests FOR INSERT
  TO authenticated
  WITH CHECK (
    stage = 'partner'
    AND partner_profile_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partner can update stage 1 test" ON public.partner_worker_skill_tests;
CREATE POLICY "Partner can update stage 1 test"
  ON public.partner_worker_skill_tests FOR UPDATE
  TO authenticated
  USING (
    stage = 'partner'
    AND partner_profile_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all skill tests" ON public.partner_worker_skill_tests;
CREATE POLICY "Admins manage all skill tests"
  ON public.partner_worker_skill_tests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_partner_skill_tests_updated_at
BEFORE UPDATE ON public.partner_worker_skill_tests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Update placement incentive to use config table
CREATE OR REPLACE FUNCTION public.handle_partner_worker_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_amount numeric(12,2);
  v_type public.partner_incentive_type;
  v_desc text;
  v_partner_user_id uuid;
  v_placement_amount numeric(12,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.partner_worker_status_history (worker_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Worker registered');
    UPDATE public.partner_profiles
    SET workers_registered = COALESCE(workers_registered, 0) + 1
    WHERE id = NEW.partner_profile_id;
    INSERT INTO public.partner_activities (partner_profile_id, activity_type, title, description, metadata)
    VALUES (NEW.partner_profile_id, 'worker_registered', 'New worker registered',
            NEW.full_name || ' registered as ' || NEW.skill,
            jsonb_build_object('worker_id', NEW.id, 'skill', NEW.skill));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.partner_worker_status_history (worker_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated to ' || NEW.status::text);

    SELECT placement_reward_amount INTO v_placement_amount FROM public.partner_reward_config WHERE id = true;
    IF v_placement_amount IS NULL THEN v_placement_amount := 1000; END IF;

    v_amount := NULL;
    v_type := NULL;
    v_desc := NULL;

    IF NEW.status = 'verified' THEN
      v_amount := 50; v_type := 'verified'; v_desc := 'Worker verification incentive';
    ELSIF NEW.status = 'interviewed' THEN
      v_amount := 100; v_type := 'interview_qualified'; v_desc := 'Interview qualified incentive';
    ELSIF NEW.status = 'placed' THEN
      v_amount := v_placement_amount; v_type := 'placement'; v_desc := 'Successful placement incentive';
      UPDATE public.partner_profiles
      SET workers_placed = COALESCE(workers_placed, 0) + 1
      WHERE id = NEW.partner_profile_id;
    END IF;

    IF v_amount IS NOT NULL AND v_type IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.partner_incentives
        WHERE worker_id = NEW.id AND incentive_type = v_type
      ) THEN
        INSERT INTO public.partner_incentives (partner_profile_id, worker_id, incentive_type, amount, description)
        VALUES (NEW.partner_profile_id, NEW.id, v_type, v_amount, v_desc);

        UPDATE public.partner_profiles
        SET total_incentives_earned = COALESCE(total_incentives_earned, 0) + v_amount
        WHERE id = NEW.partner_profile_id;

        SELECT user_id INTO v_partner_user_id FROM public.partner_profiles WHERE id = NEW.partner_profile_id;
        IF v_partner_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'notifications'
        ) THEN
          INSERT INTO public.notifications (user_id, type, title, message, is_read)
          VALUES (
            v_partner_user_id,
            'partner_incentive',
            'Incentive credited: ₹' || v_amount::text,
            v_desc || ' for ' || NEW.full_name,
            false
          );
        END IF;

        INSERT INTO public.partner_activities (partner_profile_id, activity_type, title, description, metadata)
        VALUES (NEW.partner_profile_id, 'incentive_credited', 'Incentive credited',
                '₹' || v_amount::text || ' — ' || v_desc,
                jsonb_build_object('worker_id', NEW.id, 'amount', v_amount, 'type', v_type));
      END IF;
    END IF;

    SELECT user_id INTO v_partner_user_id FROM public.partner_profiles WHERE id = NEW.partner_profile_id;
    IF v_partner_user_id IS NOT NULL
      AND NEW.status IN ('shortlisted', 'interview_scheduled', 'selected', 'placed')
      AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'notifications'
      ) THEN
      INSERT INTO public.notifications (user_id, type, title, message, is_read)
      VALUES (
        v_partner_user_id,
        'partner_worker_status',
        CASE NEW.status
          WHEN 'shortlisted' THEN 'Worker shortlisted'
          WHEN 'interview_scheduled' THEN 'Interview scheduled'
          WHEN 'selected' THEN 'Worker selected'
          WHEN 'placed' THEN 'Placement completed'
          ELSE 'Worker status updated'
        END,
        NEW.full_name || ' — ' || NEW.status::text,
        false
      );
    END IF;

    INSERT INTO public.partner_activities (partner_profile_id, activity_type, title, description, metadata)
    VALUES (NEW.partner_profile_id, 'status_change', 'Worker status updated',
            NEW.full_name || ' → ' || NEW.status::text,
            jsonb_build_object('worker_id', NEW.id, 'status', NEW.status));
  END IF;

  RETURN NEW;
END;
$function$;
