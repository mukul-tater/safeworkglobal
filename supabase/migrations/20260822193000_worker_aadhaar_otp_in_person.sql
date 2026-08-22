-- Worker Aadhaar: last 4 + verified flag only. Never keep the 12-digit number.
-- Independent workers: OTP (vendor, via edge function).
-- Partner-sourced workers: last 4 in app + in-person at the centre.

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aadhaar_verify_method text,
  ADD COLUMN IF NOT EXISTS aadhaar_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS aadhaar_verified_by uuid,
  ADD COLUMN IF NOT EXISTS aadhaar_otp_ref text,
  ADD COLUMN IF NOT EXISTS aadhaar_verified_name text;

ALTER TABLE public.worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_aadhaar_verify_method_check;
ALTER TABLE public.worker_profiles ADD CONSTRAINT worker_profiles_aadhaar_verify_method_check
  CHECK (aadhaar_verify_method IS NULL OR aadhaar_verify_method IN ('otp', 'in_person'));

UPDATE public.worker_profiles
SET aadhaar_last4 = COALESCE(aadhaar_last4, RIGHT(aadhaar_number, 4))
WHERE aadhaar_number IS NOT NULL
  AND aadhaar_number ~ '^[0-9]{12}$';

UPDATE public.worker_profiles SET aadhaar_number = NULL;

-- Strip any future write of the full number; keep last 4 if it was the only copy.
CREATE OR REPLACE FUNCTION public.strip_worker_aadhaar_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.aadhaar_number IS NOT NULL THEN
    IF (NEW.aadhaar_last4 IS NULL OR NEW.aadhaar_last4 = '')
       AND NEW.aadhaar_number ~ '^[0-9]{12}$' THEN
      NEW.aadhaar_last4 := RIGHT(NEW.aadhaar_number, 4);
    END IF;
    NEW.aadhaar_number := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_strip_worker_aadhaar_number ON public.worker_profiles;
CREATE TRIGGER trg_strip_worker_aadhaar_number
BEFORE INSERT OR UPDATE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.strip_worker_aadhaar_number();

-- Workers cannot self-attest Aadhaar. OTP uses the service role (auth.uid() is null).
-- Partners may mark in-person verification for workers they manage.
CREATE OR REPLACE FUNCTION public.prevent_worker_profile_privileged_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('safework.allow_partner_worker_attach', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL
     OR pg_trigger_depth() > 1
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    RAISE EXCEPTION 'Review status can only be changed by SafeWork staff.';
  END IF;

  IF NEW.source_type IS DISTINCT FROM OLD.source_type
     OR NEW.source_partner_id IS DISTINCT FROM OLD.source_partner_id THEN
    RAISE EXCEPTION 'Worker source attribution cannot be changed.';
  END IF;

  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     AND NEW.kyc_status <> 'submitted' THEN
    RAISE EXCEPTION 'Verification status can only be changed by SafeWork staff.';
  END IF;

  IF NEW.aadhaar_verified IS TRUE
     AND OLD.aadhaar_verified IS DISTINCT FROM TRUE
     AND NOT public.partner_manages_worker(NEW.user_id) THEN
    RAISE EXCEPTION 'Aadhaar can only be verified by OTP or in person at a centre.';
  END IF;

  RETURN NEW;
END;
$$;

-- When SSVN marks physical Aadhaar checked, copy onto the worker profile.
CREATE OR REPLACE FUNCTION public.sync_assessment_aadhaar_to_worker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.aadhaar_verified IS TRUE AND OLD.aadhaar_verified IS DISTINCT FROM TRUE THEN
    UPDATE public.worker_profiles
    SET
      aadhaar_verified = true,
      aadhaar_verify_method = COALESCE(aadhaar_verify_method, 'in_person'),
      aadhaar_verified_at = COALESCE(aadhaar_verified_at, now()),
      aadhaar_verified_by = COALESCE(aadhaar_verified_by, NEW.arrival_photo_taken_by)
    WHERE user_id = NEW.worker_id
      AND aadhaar_verified IS NOT TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_assessment_aadhaar_to_worker ON public.assessments;
CREATE TRIGGER trg_sync_assessment_aadhaar_to_worker
AFTER UPDATE OF aadhaar_verified ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.sync_assessment_aadhaar_to_worker();

-- Stop showing stored Aadhaar card photos in the app (files may remain in storage).
DELETE FROM public.worker_documents
WHERE document_type IN ('aadhaar', 'aadhaar_front', 'aadhaar_back');

COMMENT ON COLUMN public.worker_profiles.aadhaar_last4 IS 'Only Aadhaar identifier SafeWork stores (last 4 digits).';
COMMENT ON COLUMN public.worker_profiles.aadhaar_number IS 'Deprecated. Always null — full Aadhaar must not be stored.';
COMMENT ON COLUMN public.worker_profiles.aadhaar_verify_method IS 'otp = UIDAI OTP via licensed vendor; in_person = original card checked at partner/SSVN centre.';
