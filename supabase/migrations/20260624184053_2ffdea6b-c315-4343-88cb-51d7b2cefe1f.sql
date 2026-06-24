
CREATE OR REPLACE FUNCTION public.create_emitra_placement_reward()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE v_partner_id uuid; v_amount numeric(12,2); v_fire boolean := false;
BEGIN
  IF TG_OP='INSERT' AND NEW.status='HIRED' THEN v_fire := true;
  ELSIF TG_OP='UPDATE' AND NEW.status='HIRED' AND OLD.status IS DISTINCT FROM 'HIRED' THEN v_fire := true;
  END IF;
  IF NOT v_fire THEN RETURN NEW; END IF;

  SELECT source_partner_id INTO v_partner_id FROM public.worker_profiles
   WHERE user_id=NEW.worker_id AND source_type='emitra';
  IF v_partner_id IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.reward_transactions WHERE application_id=NEW.id) THEN RETURN NEW; END IF;

  SELECT COALESCE(placement_reward_amount,1000) INTO v_amount FROM public.partner_reward_config WHERE id=true;
  v_amount := COALESCE(v_amount,1000);

  INSERT INTO public.reward_transactions (partner_id, worker_id, job_id, application_id, amount, status)
  VALUES (v_partner_id, NEW.worker_id, NEW.job_id, NEW.id, v_amount, 'available');

  UPDATE public.partner_profiles
    SET workers_placed = COALESCE(workers_placed,0)+1,
        total_incentives_earned = COALESCE(total_incentives_earned,0) + v_amount
    WHERE id = v_partner_id;
  RETURN NEW;
END $f$;

DROP TRIGGER IF EXISTS trg_emitra_placement_reward ON public.job_applications;
CREATE TRIGGER trg_emitra_placement_reward
  AFTER INSERT OR UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.create_emitra_placement_reward();

CREATE OR REPLACE FUNCTION public.bump_partner_workers_registered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old uuid; v_new uuid;
BEGIN
  v_new := CASE WHEN NEW.source_type='emitra' THEN NEW.source_partner_id END;
  v_old := CASE WHEN TG_OP='UPDATE' AND OLD.source_type='emitra' THEN OLD.source_partner_id END;
  IF v_new IS DISTINCT FROM v_old THEN
    IF v_old IS NOT NULL THEN
      UPDATE public.partner_profiles SET workers_registered=GREATEST(COALESCE(workers_registered,0)-1,0) WHERE id=v_old;
    END IF;
    IF v_new IS NOT NULL THEN
      UPDATE public.partner_profiles SET workers_registered=COALESCE(workers_registered,0)+1 WHERE id=v_new;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bump_partner_workers ON public.worker_profiles;
CREATE TRIGGER trg_bump_partner_workers
  AFTER INSERT OR UPDATE OF source_type, source_partner_id ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.bump_partner_workers_registered();

-- Backfill rewards
DO $bf$
DECLARE rec record; v_amount numeric(12,2);
BEGIN
  SELECT COALESCE(placement_reward_amount,1000) INTO v_amount FROM public.partner_reward_config WHERE id=true;
  v_amount := COALESCE(v_amount,1000);
  FOR rec IN
    SELECT ja.id AS app_id, ja.worker_id, ja.job_id, wp.source_partner_id AS pid
    FROM public.job_applications ja
    JOIN public.worker_profiles wp ON wp.user_id = ja.worker_id
    WHERE ja.status='HIRED' AND wp.source_type='emitra' AND wp.source_partner_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.reward_transactions rt WHERE rt.application_id = ja.id)
  LOOP
    INSERT INTO public.reward_transactions (partner_id, worker_id, job_id, application_id, amount, status)
    VALUES (rec.pid, rec.worker_id, rec.job_id, rec.app_id, v_amount, 'available');
    UPDATE public.partner_profiles
      SET workers_placed=COALESCE(workers_placed,0)+1,
          total_incentives_earned=COALESCE(total_incentives_earned,0)+v_amount
      WHERE id = rec.pid;
  END LOOP;
END $bf$;

-- Backfill workers_registered counters
WITH c AS (
  SELECT source_partner_id AS pid, count(*) AS n
  FROM public.worker_profiles WHERE source_type='emitra' AND source_partner_id IS NOT NULL
  GROUP BY source_partner_id
)
UPDATE public.partner_profiles pp SET workers_registered=c.n FROM c WHERE pp.id=c.pid;
