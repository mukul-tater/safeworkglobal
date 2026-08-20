-- Create worker_pre_journey_declarations table
CREATE TABLE IF NOT EXISTS public.worker_pre_journey_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  medical jsonb NOT NULL DEFAULT '{}'::jsonb,
  overseas jsonb NOT NULL DEFAULT '{}'::jsonb,
  recruitment jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledgements jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index user_id
CREATE INDEX IF NOT EXISTS worker_pre_journey_declarations_user_idx
  ON public.worker_pre_journey_declarations(user_id);

-- Enable RLS
ALTER TABLE public.worker_pre_journey_declarations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Workers manage own declarations" ON public.worker_pre_journey_declarations;
CREATE POLICY "Workers manage own declarations"
  ON public.worker_pre_journey_declarations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all declarations" ON public.worker_pre_journey_declarations;
CREATE POLICY "Admins read all declarations"
  ON public.worker_pre_journey_declarations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also add columns to worker_verification if missing
ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS pre_screening_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS screening_declarations jsonb;
