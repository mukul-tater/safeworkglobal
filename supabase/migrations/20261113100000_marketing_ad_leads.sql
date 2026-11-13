-- Phase 1 Marketing & Ad Leads Engine
-- Tracks candidates coming from Instagram Ads, Instagram DMs, WhatsApp DMs, and Influencers.

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  full_name text,
  source text NOT NULL DEFAULT 'instagram_dm',
  campaign_name text,
  job_interest text,
  notes text,
  status text NOT NULL DEFAULT 'lead_created' CHECK (status IN ('lead_created', 'invited', 'registered', 'converted', 'archived')),
  worker_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_marketing_leads_phone ON public.marketing_leads(phone);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_source ON public.marketing_leads(source);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_campaign ON public.marketing_leads(campaign_name);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON public.marketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_worker ON public.marketing_leads(worker_user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON public.marketing_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to marketing leads" ON public.marketing_leads;
CREATE POLICY "Admins full access to marketing leads"
  ON public.marketing_leads
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper function to link new worker signups to existing marketing leads
CREATE OR REPLACE FUNCTION public.sync_worker_marketing_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_phone text;
BEGIN
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN
    v_norm_phone := right(regexp_replace(NEW.phone, '\D', '', 'g'), 10);
    IF length(v_norm_phone) = 10 THEN
      UPDATE public.marketing_leads
      SET 
        worker_user_id = NEW.id,
        status = CASE 
          WHEN status IN ('lead_created', 'invited') THEN 'registered' 
          ELSE status 
        END,
        updated_at = now()
      WHERE right(regexp_replace(phone, '\D', '', 'g'), 10) = v_norm_phone
        AND (worker_user_id IS NULL OR worker_user_id = NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_worker_marketing_lead ON public.profiles;
CREATE TRIGGER trg_sync_worker_marketing_lead
  AFTER INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_worker_marketing_lead();

