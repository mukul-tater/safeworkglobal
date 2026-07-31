-- Must run (and commit) BEFORE 20260731180000_trade_test_partner_workflow.sql
-- Postgres forbids using newly added enum values in the same transaction.
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'allocated';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'accepted';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'centre_rejected';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'kyc_done';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'centre_submitted';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'under_review';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
