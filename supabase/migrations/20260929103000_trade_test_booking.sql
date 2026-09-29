-- Trade test booking: admin chooses who picks the centre, centres declare trades
-- and a map pin, workers get a slip, and a job change cancels an open booking.

CREATE TABLE IF NOT EXISTS public.trade_test_settings (
  id int PRIMARY KEY CHECK (id = 1),
  assignment_mode text NOT NULL DEFAULT 'worker_select'
    CHECK (assignment_mode IN ('worker_select', 'admin_assign')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.trade_test_settings (id, assignment_mode)
VALUES (1, 'worker_select')
ON CONFLICT (id) DO NOTHING;

REVOKE ALL ON public.trade_test_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.trade_test_settings TO service_role;

CREATE OR REPLACE FUNCTION public.trade_test_assignment_mode()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assignment_mode FROM public.trade_test_settings WHERE id = 1;
$$;

REVOKE ALL ON FUNCTION public.trade_test_assignment_mode() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trade_test_assignment_mode() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_trade_test_assignment_mode(p_mode text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_mode NOT IN ('worker_select', 'admin_assign') THEN
    RAISE EXCEPTION 'Unknown assignment mode';
  END IF;
  UPDATE public.trade_test_settings
  SET assignment_mode = p_mode, updated_at = now()
  WHERE id = 1;
  RETURN p_mode;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_trade_test_assignment_mode(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_trade_test_assignment_mode(text) TO authenticated;

ALTER TABLE public.trade_test_centers
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS trades text[] NOT NULL DEFAULT '{}';

-- Existing hubs can test the hands-on trades. Admin can narrow this later.
-- Pins are city centres so distance works before a street pin is saved.
UPDATE public.trade_test_centers
SET
  trades = ARRAY[
    'Electrician',
    'Welder',
    'MIG Welder',
    'TIG Welder',
    'Plumber',
    'Pipe Fitter',
    'Mason',
    'Mason (tiles/marble)',
    'Mason (bricks/plaster)',
    'Steel Fixer',
    'Carpenter',
    'Shuttering Carpenter',
    'Furniture Carpenter - Finishing, All Rounder',
    'HVAC Technician',
    'AC Technician',
    'Aluminium Fixer/Fabricator'
  ],
  latitude = CASE id
    WHEN 'jaipur' THEN 26.9124
    WHEN 'delhi' THEN 28.6139
    WHEN 'mumbai' THEN 19.0760
    WHEN 'hyderabad' THEN 17.3850
    WHEN 'lucknow' THEN 26.8467
    WHEN 'kochi' THEN 9.9312
    ELSE latitude
  END,
  longitude = CASE id
    WHEN 'jaipur' THEN 75.7873
    WHEN 'delhi' THEN 77.2090
    WHEN 'mumbai' THEN 72.8777
    WHEN 'hyderabad' THEN 78.4867
    WHEN 'lucknow' THEN 80.9462
    WHEN 'kochi' THEN 76.2673
    ELSE longitude
  END,
  updated_at = now()
WHERE id IN ('jaipur', 'delhi', 'mumbai', 'hyderabad', 'lucknow', 'kochi')
  AND (trades = '{}' OR latitude IS NULL OR longitude IS NULL);

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS booking_reference text,
  ADD COLUMN IF NOT EXISTS slip_issued_at timestamptz;

CREATE SEQUENCE IF NOT EXISTS public.trade_test_booking_ref_seq START WITH 10000;

CREATE UNIQUE INDEX IF NOT EXISTS assessments_booking_reference_key
  ON public.assessments (booking_reference)
  WHERE booking_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prepare_trade_test_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR btrim(NEW.booking_reference) = '' THEN
    NEW.booking_reference := 'TT-' || nextval('public.trade_test_booking_ref_seq')::text;
  END IF;
  IF NEW.slip_issued_at IS NULL AND NEW.status = 'allocated' THEN
    NEW.slip_issued_at := now();
  END IF;
  IF NEW.job_id IS NULL AND NEW.worker_verification_id IS NOT NULL THEN
    SELECT journey_job_id INTO NEW.job_id
    FROM public.worker_verification
    WHERE id = NEW.worker_verification_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_trade_test_assessment ON public.assessments;
CREATE TRIGGER trg_prepare_trade_test_assessment
  BEFORE INSERT ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_trade_test_assessment();

CREATE OR REPLACE FUNCTION public.guard_assessment_quality_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'allocated' THEN
    IF coalesce(current_setting('app.trade_test_worker_booking', true), '') = '1' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only SafeWork admin can allocate assessments';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.outcome IS DISTINCT FROM OLD.outcome
       OR NEW.quality_reviewed_by IS DISTINCT FROM OLD.quality_reviewed_by
       OR NEW.quality_reviewed_at IS DISTINCT FROM OLD.quality_reviewed_at
       OR NEW.quality_notes IS DISTINCT FROM OLD.quality_notes
    THEN
      RAISE EXCEPTION 'Only SafeWork admin can set assessment outcome / quality review';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_trade_test_slip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_message text;
  v_type text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'allocated' AND NEW.booking_reference IS NOT NULL THEN
    v_type := 'trade_test_slip';
    v_title := 'Trade test slip / ट्रेड टेस्ट स्लिप';
    v_message := 'Your physical trade test is booked. Reference ' || NEW.booking_reference
      || '. Show this slip at the centre. / आपका फिजिकल ट्रेड टेस्ट बुक हो गया है। रेफरेंस '
      || NEW.booking_reference || '। यह स्लिप सेंटर पर दिखाएँ।';
  ELSIF TG_OP = 'UPDATE'
    AND NEW.status = 'centre_rejected'
    AND OLD.status IS DISTINCT FROM 'centre_rejected'
    AND NEW.booking_reference IS NOT NULL
  THEN
    v_type := 'trade_test_slip_cancelled';
    v_title := 'Trade test slip cancelled / ट्रेड टेस्ट स्लिप रद्द';
    v_message := 'Booking ' || NEW.booking_reference || ' is cancelled. '
      || coalesce(nullif(btrim(NEW.reject_reason), ''), 'SafeWork will assign the next step.')
      || ' / बुकिंग ' || NEW.booking_reference || ' रद्द हो गई है।';

    PERFORM set_config('app.verification_guard_bypass', '1', true);

    UPDATE public.worker_verification
    SET
      assessment_id = NULL,
      trade_test_center_id = NULL,
      trade_test_center_name = NULL,
      trade_test_reporting_window = NULL,
      trade_test_booked_at = NULL,
      trade_test_scheduled_at = NULL,
      trade_test_place = NULL,
      trade_test_instructions = NULL,
      trade_test_status = 'pending',
      updated_at = now()
    WHERE user_id = NEW.worker_id
      AND stage = 'trade_test'
      AND (assessment_id = NEW.id OR assessment_id IS NULL);
  ELSE
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.worker_id,
      v_type,
      v_title,
      v_message,
      jsonb_build_object(
        'href', '/worker/journey',
        'assessment_id', NEW.id,
        'booking_reference', NEW.booking_reference,
        'cancelled', v_type = 'trade_test_slip_cancelled',
        'reject_reason', NEW.reject_reason
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trade test slip notification failed for %: %', NEW.worker_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trade_test_slip ON public.assessments;
CREATE TRIGGER trg_notify_trade_test_slip
  AFTER INSERT OR UPDATE OF status ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trade_test_slip();

CREATE OR REPLACE FUNCTION public.enqueue_journey_step_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('journey_step_cleared', 'trade_test_slip', 'trade_test_slip_cancelled') THEN
    PERFORM public.request_journey_step_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_trade_test_on_job_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.journey_job_id IS NOT DISTINCT FROM OLD.journey_job_id THEN
    RETURN NEW;
  END IF;
  IF NEW.trade_test_center_id IS NOT NULL OR OLD.trade_test_center_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.assessments
  SET
    status = 'centre_rejected',
    rejected_at = now(),
    reject_reason = 'Job changed',
    updated_at = now()
  WHERE worker_id = NEW.user_id
    AND status IN (
      'allocated', 'accepted', 'scheduled', 'checked_in', 'kyc_done', 'running'
    );

  IF NEW.assessment_id IS NOT NULL THEN
    UPDATE public.worker_verification
    SET assessment_id = NULL, updated_at = now()
    WHERE id = NEW.id
      AND assessment_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancel_trade_test_on_job_change ON public.worker_verification;
CREATE TRIGGER trg_cancel_trade_test_on_job_change
  AFTER UPDATE OF journey_job_id ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_trade_test_on_job_change();

CREATE OR REPLACE FUNCTION public.book_worker_trade_test(
  p_center_id text,
  p_appointment_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mode text;
  v_row public.worker_verification%ROWTYPE;
  v_center public.trade_test_centers%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_window text;
  v_scheduled timestamptz;
  v_place text;
  v_id uuid;
  v_open int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to book a trade test';
  END IF;

  SELECT assignment_mode INTO v_mode FROM public.trade_test_settings WHERE id = 1;
  IF v_mode IS DISTINCT FROM 'worker_select' THEN
    RAISE EXCEPTION 'SafeWork assigns your trade test centre';
  END IF;

  SELECT * INTO v_row FROM public.worker_verification WHERE user_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complete your journey before booking a trade test';
  END IF;
  IF v_row.stage IS DISTINCT FROM 'trade_test' OR v_row.trade_test_required IS NOT TRUE THEN
    RAISE EXCEPTION 'Trade test booking opens after payment, when a physical test is required';
  END IF;
  IF v_row.primary_skill IS NULL OR btrim(v_row.primary_skill) = '' THEN
    RAISE EXCEPTION 'Apply for a job before booking a trade test';
  END IF;

  IF p_appointment_date IS NULL
     OR p_appointment_date < v_today
     OR p_appointment_date > v_today + 14 THEN
    RAISE EXCEPTION 'Pick a test date in the next 14 days';
  END IF;

  SELECT * INTO v_center
  FROM public.trade_test_centers
  WHERE id = p_center_id
    AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade test centre not found';
  END IF;
  IF v_center.latitude IS NULL OR v_center.longitude IS NULL THEN
    RAISE EXCEPTION 'This centre is not on the map yet';
  END IF;
  IF NOT (v_row.primary_skill = ANY (coalesce(v_center.trades, '{}'))) THEN
    RAISE EXCEPTION 'This centre does not test %', v_row.primary_skill;
  END IF;
  IF v_center.partner_id IS NULL THEN
    RAISE EXCEPTION 'This centre is not ready to take bookings yet';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = v_center.partner_id
      AND p.status::text = 'approved'
  ) THEN
    RAISE EXCEPTION 'This centre is not ready to take bookings yet';
  END IF;

  SELECT count(*) INTO v_open
  FROM public.assessments
  WHERE worker_id = v_uid
    AND status IN (
      'allocated', 'accepted', 'scheduled', 'checked_in',
      'kyc_done', 'running', 'centre_submitted', 'under_review'
    );
  IF v_open > 0 THEN
    RAISE EXCEPTION 'You already have an open trade test booking';
  END IF;

  v_window := coalesce(nullif(btrim(v_center.reporting_window), ''), '9:00 AM – 10:00 AM');
  v_scheduled := (p_appointment_date::text || ' 09:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_place := nullif(concat_ws(', ',
    nullif(btrim(v_center.address), ''),
    nullif(btrim(v_center.city), ''),
    nullif(btrim(v_center.state), ''),
    nullif(btrim(v_center.pincode), '')
  ), '');

  PERFORM set_config('app.trade_test_worker_booking', '1', true);
  PERFORM set_config('app.verification_guard_bypass', '1', true);

  INSERT INTO public.assessments (
    worker_id,
    worker_verification_id,
    partner_id,
    trade_test_center_id,
    job_id,
    location,
    appointment_date,
    reporting_window,
    scheduled_at,
    status,
    created_by
  ) VALUES (
    v_uid,
    v_row.id,
    v_center.partner_id,
    v_center.id,
    v_row.journey_job_id,
    v_center.name,
    p_appointment_date,
    v_window,
    v_scheduled,
    'allocated',
    v_uid
  )
  RETURNING id INTO v_id;

  UPDATE public.worker_verification
  SET
    assessment_id = v_id,
    trade_test_center_id = v_center.id,
    trade_test_center_name = v_center.name,
    trade_test_reporting_window = v_window,
    trade_test_booked_at = now(),
    trade_test_scheduled_at = v_scheduled,
    trade_test_place = coalesce(v_place, v_center.name),
    trade_test_instructions = nullif(btrim(coalesce(v_center.instructions, '')), ''),
    trade_test_status = 'scheduled',
    updated_at = now()
  WHERE id = v_row.id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.book_worker_trade_test(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_worker_trade_test(text, date) TO authenticated;
