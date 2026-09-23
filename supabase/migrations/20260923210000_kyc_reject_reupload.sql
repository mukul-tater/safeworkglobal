-- KYC reject sends the worker back to identity and asks them to re-upload.
-- worker_profiles.kyc_status is what the journey reads; previously only
-- worker_verification was updated, so the upload form stayed locked.

CREATE OR REPLACE FUNCTION public.admin_verify_worker_kyc(
  p_user_id uuid, p_approved boolean, p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reason text := nullif(btrim(COALESCE(p_reason, '')), '');
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF NOT p_approved AND v_reason IS NULL THEN
    RAISE EXCEPTION 'A reason is required so the worker knows what to re-upload';
  END IF;

  PERFORM set_config('app.verification_guard_bypass', '1', true);

  UPDATE public.worker_verification
     SET kyc_status = CASE WHEN p_approved THEN 'verified' ELSE 'rejected' END,
         kyc_verified_at = CASE WHEN p_approved THEN now() ELSE NULL END,
         kyc_rejection_reason = CASE WHEN p_approved THEN NULL ELSE v_reason END,
         stage = CASE
           WHEN p_approved AND stage IN ('identity', 'media', 'quiz') THEN 'awaiting_interview'
           WHEN NOT p_approved THEN 'identity'
           ELSE stage
         END,
         updated_at = now()
   WHERE user_id = p_user_id;

  UPDATE public.worker_profiles
     SET kyc_status = CASE WHEN p_approved THEN 'verified' ELSE 'rejected' END
   WHERE user_id = p_user_id;

  IF NOT p_approved THEN
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
      VALUES (
        p_user_id,
        'kyc_reupload_required',
        'Re-upload identity documents / पहचान दस्तावेज़ फिर से अपलोड करें',
        'SafeWork could not verify your identity documents. '
          || v_reason
          || ' Open your journey and upload clear photos again. / सेफवर्क आपके दस्तावेज़ सत्यापित नहीं कर सका। यात्रा खोलकर साफ़ फ़ोटो फिर से अपलोड करें।',
        jsonb_build_object(
          'href', '/worker/journey',
          'kyc_status', 'rejected'
        ),
        false
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'KYC re-upload notification failed for %: %', p_user_id, SQLERRM;
    END;
  END IF;
END; $$;

-- Same email hook as a cleared step. The edge function branches on type.
CREATE OR REPLACE FUNCTION public.enqueue_journey_step_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('journey_step_cleared', 'kyc_reupload_required') THEN
    PERFORM public.request_journey_step_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
