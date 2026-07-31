-- P1: job approval gate, background check lockdown, placement rewards pending admin

-- ---------------------------------------------------------------------------
-- 1) Jobs: employers cannot set ACTIVE; only DRAFT/PENDING on create
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_employer_job_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('DRAFT', 'PENDING') THEN
      RAISE EXCEPTION 'Employers may only create jobs as DRAFT or PENDING';
    END IF;
    RETURN NEW;
  END IF;

  -- Employers cannot publish or un-reject
  IF NEW.status = 'ACTIVE' AND OLD.status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Only admins can activate jobs';
  END IF;
  IF NEW.status = 'REJECTED' AND OLD.status IS DISTINCT FROM 'REJECTED' THEN
    RAISE EXCEPTION 'Only admins can reject jobs';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_employer_job_status ON public.jobs;
CREATE TRIGGER trg_guard_employer_job_status
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_employer_job_status();

-- ---------------------------------------------------------------------------
-- 2) Background verifications: employers cannot self-complete
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employers can update their verification requests"
  ON public.background_verifications;

DROP POLICY IF EXISTS "Employers can create verification requests"
  ON public.background_verifications;

CREATE POLICY "Employers can create pending verification requests"
  ON public.background_verifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = employer_id
    AND COALESCE(status, 'pending') = 'pending'
    AND result IS NULL
  );

-- ---------------------------------------------------------------------------
-- 3) Placement rewards: HIRED creates pending_placement, not available
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_emitra_placement_reward ON public.job_applications;
DROP TRIGGER IF EXISTS trg_create_emitra_placement_reward ON public.job_applications;

CREATE OR REPLACE FUNCTION public.create_emitra_placement_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_amount numeric(12,2);
  v_fire boolean := false;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'HIRED' THEN
    v_fire := true;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'HIRED' AND OLD.status IS DISTINCT FROM 'HIRED' THEN
    v_fire := true;
  END IF;
  IF NOT v_fire THEN
    RETURN NEW;
  END IF;

  SELECT source_partner_id INTO v_partner_id
  FROM public.worker_profiles
  WHERE user_id = NEW.worker_id AND source_type = 'emitra';

  IF v_partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.reward_transactions WHERE application_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(placement_reward_amount, 1000) INTO v_amount
  FROM public.partner_reward_config WHERE id = true;
  v_amount := COALESCE(v_amount, 1000);

  -- Do not bump partner wallet until admin confirms
  INSERT INTO public.reward_transactions (partner_id, worker_id, job_id, application_id, amount, status)
  VALUES (v_partner_id, NEW.worker_id, NEW.job_id, NEW.id, v_amount, 'pending_placement');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_emitra_placement_reward
  AFTER INSERT OR UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.create_emitra_placement_reward();

-- Downgrade any auto-available rewards that were never admin-confirmed (optional safety)
-- Leave historical available rows intact; only new HIREDs go pending.

CREATE OR REPLACE FUNCTION public.confirm_emitra_placement_reward(p_reward_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.reward_transactions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO r FROM public.reward_transactions WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;
  IF r.status IS DISTINCT FROM 'pending_placement' THEN
    RAISE EXCEPTION 'Reward is not pending placement confirmation';
  END IF;

  UPDATE public.reward_transactions
  SET status = 'available', updated_at = now()
  WHERE id = p_reward_id;

  UPDATE public.partner_profiles
  SET workers_placed = COALESCE(workers_placed, 0) + 1,
      total_incentives_earned = COALESCE(total_incentives_earned, 0) + r.amount
  WHERE id = r.partner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_emitra_placement_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_emitra_placement_reward(uuid) TO authenticated;
