-- Worker verification pipeline (essentials → quiz → media → interview → payment → tests → bond)

CREATE TABLE IF NOT EXISTS public.worker_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'essentials'
    CHECK (stage IN (
      'essentials',
      'quiz',
      'media',
      'awaiting_interview',
      'awaiting_payment',
      'tests',
      'bond',
      'gcc_ready'
    )),
  terms_accepted_at timestamptz,
  terms_version text,
  email text,
  city text,
  state text,
  education_level text,
  primary_skill text,
  essentials_completed_at timestamptz,
  quiz_score numeric(5,2),
  quiz_completed_at timestamptz,
  media_submitted_at timestamptz,
  interview_score numeric(5,2),
  interview_notes text,
  interview_rated_at timestamptz,
  trade_test_required boolean DEFAULT true,
  payment_status text DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'waived', 'failed')),
  payment_amount numeric(12,2),
  paid_at timestamptz,
  medical_status text DEFAULT 'pending'
    CHECK (medical_status IN ('pending', 'scheduled', 'passed', 'failed')),
  trade_test_status text DEFAULT 'pending'
    CHECK (trade_test_status IN ('pending', 'not_required', 'scheduled', 'passed', 'failed')),
  bond_status text DEFAULT 'pending'
    CHECK (bond_status IN ('pending', 'submitted', 'approved', 'rejected')),
  gcc_ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worker_verification_stage_idx ON public.worker_verification(stage);

CREATE TABLE IF NOT EXISTS public.worker_skill_quiz_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_code text NOT NULL,
  question text NOT NULL,
  youtube_url text,
  image_url text,
  expected_answer boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worker_skill_quiz_items_skill_idx
  ON public.worker_skill_quiz_items(skill_code);

CREATE TABLE IF NOT EXISTS public.worker_skill_quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_item_id uuid NOT NULL REFERENCES public.worker_skill_quiz_items(id) ON DELETE CASCADE,
  answer boolean NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quiz_item_id)
);

CREATE TABLE IF NOT EXISTS public.worker_verification_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  meeting_link text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  score numeric(5,2),
  notes text,
  rated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_assessment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  provider text,
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.worker_bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('estamp', 'emitra', 'physical_upload')),
  stamp_doc_url text,
  video_proof_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_skill_quiz_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_skill_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_verification_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_assessment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_bonds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workers manage own verification" ON public.worker_verification;
CREATE POLICY "Workers manage own verification"
  ON public.worker_verification FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all verification" ON public.worker_verification;
CREATE POLICY "Admins manage all verification"
  ON public.worker_verification FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone authenticated reads quiz items" ON public.worker_skill_quiz_items;
CREATE POLICY "Anyone authenticated reads quiz items"
  ON public.worker_skill_quiz_items FOR SELECT TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Admins manage quiz items" ON public.worker_skill_quiz_items;
CREATE POLICY "Admins manage quiz items"
  ON public.worker_skill_quiz_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers manage own quiz responses" ON public.worker_skill_quiz_responses;
CREATE POLICY "Workers manage own quiz responses"
  ON public.worker_skill_quiz_responses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers read own interviews" ON public.worker_verification_interviews;
CREATE POLICY "Workers read own interviews"
  ON public.worker_verification_interviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage verification interviews" ON public.worker_verification_interviews;
CREATE POLICY "Admins manage verification interviews"
  ON public.worker_verification_interviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Workers manage own assessment payments" ON public.worker_assessment_payments;
CREATE POLICY "Workers manage own assessment payments"
  ON public.worker_assessment_payments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers manage own bonds" ON public.worker_bonds;
CREATE POLICY "Workers manage own bonds"
  ON public.worker_bonds FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage bonds" ON public.worker_bonds;
CREATE POLICY "Admins manage bonds"
  ON public.worker_bonds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed quiz items (Welder + Electrician + generic Other)
INSERT INTO public.worker_skill_quiz_items (skill_code, question, youtube_url, expected_answer, sort_order)
SELECT * FROM (VALUES
  ('Welder', 'Have you used an arc welding machine (MMA/SMAW) before?', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', true, 1),
  ('Welder', 'Do you know you must wear a welding helmet and gloves while welding?', NULL, true, 2),
  ('Welder', 'Is it safe to weld without checking gas / cable connections first?', NULL, false, 3),
  ('Welder', 'Have you done any fillet or butt weld practice joints?', NULL, true, 4),
  ('Electrician', 'Have you worked with single-phase domestic wiring?', NULL, true, 1),
  ('Electrician', 'Should you isolate power before opening a junction box?', NULL, true, 2),
  ('Electrician', 'Is it OK to use damaged insulation tape on live wires permanently?', NULL, false, 3),
  ('Electrician', 'Do you know how to use a digital multimeter for voltage checks?', NULL, true, 4),
  ('Plumber', 'Have you installed PVC or CPVC pipe fittings?', NULL, true, 1),
  ('Plumber', 'Should water supply be shut off before changing a faucet?', NULL, true, 2),
  ('Plumber', 'Is it fine to leave a joint leaking if pressure is low?', NULL, false, 3),
  ('Other', 'Are you ready to relocate abroad for verified work if selected?', NULL, true, 1),
  ('Other', 'Do you understand SafeWork does not charge unauthorized agent fees?', NULL, true, 2),
  ('Other', 'Will you share only truthful work experience on your profile?', NULL, true, 3)
) AS v(skill_code, question, youtube_url, expected_answer, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.worker_skill_quiz_items q WHERE q.skill_code = v.skill_code AND q.question = v.question
);

NOTIFY pgrst, 'reload schema';
