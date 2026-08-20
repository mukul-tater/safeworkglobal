CREATE OR REPLACE FUNCTION public.interviewer_record_decision(p_interview_id uuid, p_approved boolean, p_reason text DEFAULT NULL::text, p_score numeric DEFAULT NULL::numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.worker_verification_interviews;
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  SELECT * INTO v_row FROM public.worker_verification_interviews WHERE id = p_interview_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Interview not found';
  END IF;
  IF NOT v_is_admin AND v_row.interviewer_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not assigned to this interview';
  END IF;

  UPDATE public.worker_verification_interviews
     SET decision = CASE WHEN p_approved THEN 'approved' ELSE 'not_approved' END,
         decision_reason = p_reason,
         decided_at = now(),
         status = 'completed',
         score = COALESCE(p_score, score),
         rated_by = auth.uid(),
         updated_at = now()
   WHERE id = p_interview_id;

  PERFORM set_config('app.verification_guard_bypass', '1', true);
  UPDATE public.worker_verification
     SET interview_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
         interview_score = COALESCE(p_score, interview_score),
         interview_notes = COALESCE(p_reason, interview_notes),
         interview_rated_at = now(),
         stage = CASE WHEN p_approved THEN 'awaiting_payment' ELSE 'awaiting_interview' END,
         updated_at = now()
   WHERE user_id = v_row.user_id;
END; $function$;