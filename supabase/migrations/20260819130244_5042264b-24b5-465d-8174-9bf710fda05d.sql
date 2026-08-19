-- 1. MESSAGES: restrict sender updates, allow receiver to mark read
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;

CREATE POLICY "Senders can update own messages limited"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages read"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.enforce_message_update_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.parent_message_id IS DISTINCT FROM OLD.parent_message_id
     OR NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.is_flagged IS DISTINCT FROM OLD.is_flagged
     OR NEW.flagged_reason IS DISTINCT FROM OLD.flagged_reason
  THEN
    RAISE EXCEPTION 'Messages cannot be edited after sending; only read status may change.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_update_integrity ON public.messages;
CREATE TRIGGER trg_enforce_message_update_integrity
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_integrity();

-- 2. OFFERS: workers may only accept/decline
CREATE OR REPLACE FUNCTION public.enforce_offer_worker_update_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role)
     OR auth.uid() = OLD.employer_id
  THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.worker_id THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.application_id IS DISTINCT FROM OLD.application_id
       OR NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.employer_id IS DISTINCT FROM OLD.employer_id
       OR NEW.worker_id IS DISTINCT FROM OLD.worker_id
       OR NEW.salary_amount IS DISTINCT FROM OLD.salary_amount
       OR NEW.salary_currency IS DISTINCT FROM OLD.salary_currency
       OR NEW.benefits IS DISTINCT FROM OLD.benefits
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.expiry_date IS DISTINCT FROM OLD.expiry_date
       OR NEW.sent_at IS DISTINCT FROM OLD.sent_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Workers cannot modify offer terms; only accepting or declining is allowed.';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       AND upper(coalesce(NEW.status, '')) NOT IN ('ACCEPTED', 'REJECTED', 'DECLINED')
    THEN
      RAISE EXCEPTION 'Workers may only set offer status to accepted or declined.';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_offer_worker_update_limits ON public.offers;
CREATE TRIGGER trg_enforce_offer_worker_update_limits
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_worker_update_limits();

-- 3. PARTNER_PROFILES: widen protected column set
CREATE OR REPLACE FUNCTION public.prevent_partner_sensitive_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approval_notes IS DISTINCT FROM OLD.approval_notes
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.info_request_message IS DISTINCT FROM OLD.info_request_message
     OR NEW.lsp_verified_at IS DISTINCT FROM OLD.lsp_verified_at
     OR NEW.source_lsp_id IS DISTINCT FROM OLD.source_lsp_id
     OR NEW.total_incentives_earned IS DISTINCT FROM OLD.total_incentives_earned
     OR NEW.workers_placed IS DISTINCT FROM OLD.workers_placed
     OR NEW.workers_registered IS DISTINCT FROM OLD.workers_registered
     OR NEW.total_placements IS DISTINCT FROM OLD.total_placements
     OR NEW.leaderboard_rank IS DISTINCT FROM OLD.leaderboard_rank
  THEN
    RAISE EXCEPTION 'Cannot modify approval, review, tier, commission, incentive, or leaderboard fields. Contact support.';
  END IF;

  IF (OLD.aadhaar_number IS NOT NULL AND NEW.aadhaar_number IS DISTINCT FROM OLD.aadhaar_number)
     OR (OLD.pan_number IS NOT NULL AND NEW.pan_number IS DISTINCT FROM OLD.pan_number)
     OR (OLD.account_number IS NOT NULL AND NEW.account_number IS DISTINCT FROM OLD.account_number)
     OR (OLD.ifsc IS NOT NULL AND NEW.ifsc IS DISTINCT FROM OLD.ifsc)
     OR (OLD.account_holder IS NOT NULL AND NEW.account_holder IS DISTINCT FROM OLD.account_holder)
     OR (OLD.aadhaar_front_url IS NOT NULL AND NEW.aadhaar_front_url IS DISTINCT FROM OLD.aadhaar_front_url)
     OR (OLD.aadhaar_back_url IS NOT NULL AND NEW.aadhaar_back_url IS DISTINCT FROM OLD.aadhaar_back_url)
     OR (OLD.pan_card_url IS NOT NULL AND NEW.pan_card_url IS DISTINCT FROM OLD.pan_card_url)
  THEN
    RAISE EXCEPTION 'Cannot modify identity or bank details after initial submission. Contact support to update these.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_partner_sensitive_field_changes ON public.partner_profiles;
CREATE TRIGGER trg_prevent_partner_sensitive_field_changes
BEFORE UPDATE ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_partner_sensitive_field_changes();

-- 4. PARTNERS: keep protection, add metadata-independent privileged columns
CREATE OR REPLACE FUNCTION public.prevent_partners_privileged_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.partner_code IS DISTINCT FROM OLD.partner_code
     OR NEW.partner_type_id IS DISTINCT FROM OLD.partner_type_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Cannot modify approval, verification, rating, or partner type fields. Contact support.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_partners_privileged_field_changes ON public.partners;
CREATE TRIGGER trg_prevent_partners_privileged_field_changes
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.prevent_partners_privileged_field_changes();