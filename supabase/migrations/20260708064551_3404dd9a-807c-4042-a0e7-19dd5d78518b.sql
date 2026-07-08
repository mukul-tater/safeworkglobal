
-- =========================================================
-- PARTNER ECOSYSTEM PHASE 2
-- SRN worker timeline, SEN Global leads, advanced wallet, support tickets
-- =========================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.srn_stage_code AS ENUM ('medical','visa','offer_letter','poe','travel','deployment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.srn_stage_status AS ENUM ('pending','in_progress','submitted','approved','rejected','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sen_lead_status AS ENUM ('new','contacted','qualified','proposal','negotiation','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sen_commission_status AS ENUM ('pending','earned','invoiced','paid','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_payout_status AS ENUM ('requested','approved','processing','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_status AS ENUM ('open','in_progress','waiting','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_ticket_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- SRN — worker deployment timeline
-- =========================================================
CREATE TABLE IF NOT EXISTS public.srn_worker_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  job_id UUID,
  stage public.srn_stage_code NOT NULL,
  status public.srn_stage_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, worker_id, stage)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.srn_worker_stages TO authenticated;
GRANT ALL ON public.srn_worker_stages TO service_role;
ALTER TABLE public.srn_worker_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srn stages: partner owns"
  ON public.srn_worker_stages FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "srn stages: admin all"
  ON public.srn_worker_stages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_srn_stages_partner ON public.srn_worker_stages(partner_id);
CREATE INDEX IF NOT EXISTS idx_srn_stages_worker ON public.srn_worker_stages(worker_id);

CREATE TABLE IF NOT EXISTS public.srn_stage_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.srn_worker_stages(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.srn_stage_documents TO authenticated;
GRANT ALL ON public.srn_stage_documents TO service_role;
ALTER TABLE public.srn_stage_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "srn docs: partner owns"
  ON public.srn_stage_documents FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "srn docs: admin all"
  ON public.srn_stage_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- SEN Global — employer leads and commissions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sen_global_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT,
  industry TEXT,
  estimated_hires INTEGER,
  status public.sen_lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  converted_employer_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sen_global_leads TO authenticated;
GRANT ALL ON public.sen_global_leads TO service_role;
ALTER TABLE public.sen_global_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sen leads: partner owns"
  ON public.sen_global_leads FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "sen leads: admin all"
  ON public.sen_global_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_sen_leads_partner ON public.sen_global_leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_sen_leads_status ON public.sen_global_leads(status);

CREATE TABLE IF NOT EXISTS public.sen_global_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sen_global_leads(id) ON DELETE SET NULL,
  employer_id UUID,
  job_id UUID,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.sen_commission_status NOT NULL DEFAULT 'pending',
  earned_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sen_global_commissions TO authenticated;
GRANT ALL ON public.sen_global_commissions TO service_role;
ALTER TABLE public.sen_global_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sen commissions: partner owns"
  ON public.sen_global_commissions FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "sen commissions: admin all"
  ON public.sen_global_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Advanced wallet — invoices + payout requests
-- =========================================================
CREATE TABLE IF NOT EXISTS public.partner_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.partner_invoice_status NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, invoice_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_invoices TO authenticated;
GRANT ALL ON public.partner_invoices TO service_role;
ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices: partner reads own"
  ON public.partner_invoices FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "invoices: admin all"
  ON public.partner_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.partner_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.partner_payout_status NOT NULL DEFAULT 'requested',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  reference TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_payout_requests TO authenticated;
REVOKE UPDATE (status, processed_at, processed_by, admin_notes, reference) ON public.partner_payout_requests FROM authenticated;
GRANT ALL ON public.partner_payout_requests TO service_role;
ALTER TABLE public.partner_payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts: partner reads own"
  ON public.partner_payout_requests FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "payouts: partner creates own"
  ON public.partner_payout_requests FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "payouts: admin all"
  ON public.partner_payout_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Support tickets (shared across partner types)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.partner_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT,
  priority public.support_ticket_priority NOT NULL DEFAULT 'normal',
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  assigned_admin UUID,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_support_tickets TO authenticated;
GRANT ALL ON public.partner_support_tickets TO service_role;
ALTER TABLE public.partner_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets: partner owns"
  ON public.partner_support_tickets FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "tickets: admin all"
  ON public.partner_support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.partner_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.partner_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partner_support_messages TO authenticated;
GRANT ALL ON public.partner_support_messages TO service_role;
ALTER TABLE public.partner_support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ticket msgs: participants read"
  ON public.partner_support_messages FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.partner_support_tickets
      WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    )
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "ticket msgs: participants write"
  ON public.partner_support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      ticket_id IN (
        SELECT id FROM public.partner_support_tickets
        WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
      )
      OR public.has_role(auth.uid(),'admin')
    )
  );

-- =========================================================
-- Trigger: bump ticket last_reply_at + status
-- =========================================================
CREATE OR REPLACE FUNCTION public.bump_ticket_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.partner_support_tickets
    SET last_reply_at = now(),
        status = CASE
          WHEN NEW.sender_role = 'admin' AND status = 'open' THEN 'in_progress'::public.support_ticket_status
          WHEN NEW.sender_role = 'partner' AND status = 'waiting' THEN 'in_progress'::public.support_ticket_status
          ELSE status
        END,
        updated_at = now()
    WHERE id = NEW.ticket_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bump_ticket_on_message ON public.partner_support_messages;
CREATE TRIGGER trg_bump_ticket_on_message
  AFTER INSERT ON public.partner_support_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_on_message();

-- =========================================================
-- updated_at triggers
-- =========================================================
DROP TRIGGER IF EXISTS trg_srn_stages_updated ON public.srn_worker_stages;
CREATE TRIGGER trg_srn_stages_updated BEFORE UPDATE ON public.srn_worker_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sen_leads_updated ON public.sen_global_leads;
CREATE TRIGGER trg_sen_leads_updated BEFORE UPDATE ON public.sen_global_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sen_commissions_updated ON public.sen_global_commissions;
CREATE TRIGGER trg_sen_commissions_updated BEFORE UPDATE ON public.sen_global_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_invoices_updated ON public.partner_invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.partner_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payouts_updated ON public.partner_payout_requests;
CREATE TRIGGER trg_payouts_updated BEFORE UPDATE ON public.partner_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tickets_updated ON public.partner_support_tickets;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.partner_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Admin RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_process_payout(
  p_payout_id UUID, p_status public.partner_payout_status, p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL, p_rejection_reason TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.partner_payout_requests
    SET status = p_status,
        processed_at = CASE WHEN p_status IN ('paid','rejected','approved','processing') THEN now() ELSE processed_at END,
        processed_by = auth.uid(),
        reference = COALESCE(p_reference, reference),
        admin_notes = COALESCE(p_notes, admin_notes),
        rejection_reason = CASE WHEN p_status='rejected' THEN p_rejection_reason ELSE rejection_reason END
    WHERE id = p_payout_id;
END $$;
