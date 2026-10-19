-- Show the public display name when a job or skill is still stored as the internal trade id.
-- Custom admin titles are left as written.

UPDATE public.jobs
SET title = CASE lower(btrim(title))
  WHEN 'mason (tiles/marble)' THEN 'Mason (Raj Mistri / Tiles / Marble)'
  WHEN 'mason (bricks/plaster)' THEN 'Mason (Bricks / Plaster)'
  WHEN 'construction labour/helper' THEN 'Construction Labour'
  WHEN 'pipe fitter' THEN 'GI Steel Pipe Fitter'
  WHEN 'furniture carpenter - finishing, all rounder' THEN 'Furniture Carpenter'
  WHEN 'aluminium fixer/fabricator' THEN 'Aluminium Fixer'
  WHEN 'delivery' THEN 'Bike delivery persons (Food and Parcel)'
  ELSE title
END
WHERE lower(btrim(title)) IN (
  'mason (tiles/marble)',
  'mason (bricks/plaster)',
  'construction labour/helper',
  'pipe fitter',
  'furniture carpenter - finishing, all rounder',
  'aluminium fixer/fabricator',
  'delivery'
);

DELETE FROM public.job_skills js
USING (
  VALUES
    ('mason (tiles/marble)', 'mason (raj mistri / tiles / marble)'),
    ('mason (bricks/plaster)', 'mason (bricks / plaster)'),
    ('construction labour/helper', 'construction labour'),
    ('pipe fitter', 'gi steel pipe fitter'),
    ('furniture carpenter - finishing, all rounder', 'furniture carpenter'),
    ('aluminium fixer/fabricator', 'aluminium fixer'),
    ('delivery', 'bike delivery persons (food and parcel)')
) AS mapped(skill, display_name)
WHERE lower(btrim(js.skill_name)) = mapped.skill
  AND EXISTS (
    SELECT 1
    FROM public.job_skills other
    WHERE other.job_id = js.job_id
      AND other.id <> js.id
      AND lower(btrim(other.skill_name)) = mapped.display_name
  );

UPDATE public.job_skills
SET skill_name = CASE lower(btrim(skill_name))
  WHEN 'mason (tiles/marble)' THEN 'Mason (Raj Mistri / Tiles / Marble)'
  WHEN 'mason (bricks/plaster)' THEN 'Mason (Bricks / Plaster)'
  WHEN 'construction labour/helper' THEN 'Construction Labour'
  WHEN 'pipe fitter' THEN 'GI Steel Pipe Fitter'
  WHEN 'furniture carpenter - finishing, all rounder' THEN 'Furniture Carpenter'
  WHEN 'aluminium fixer/fabricator' THEN 'Aluminium Fixer'
  WHEN 'delivery' THEN 'Bike delivery persons (Food and Parcel)'
  ELSE skill_name
END
WHERE lower(btrim(skill_name)) IN (
  'mason (tiles/marble)',
  'mason (bricks/plaster)',
  'construction labour/helper',
  'pipe fitter',
  'furniture carpenter - finishing, all rounder',
  'aluminium fixer/fabricator',
  'delivery'
);

INSERT INTO public.job_skills (job_id, skill_name)
SELECT j.id, btrim(j.title)
FROM public.jobs j
WHERE btrim(coalesce(j.title, '')) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js WHERE js.job_id = j.id
  );

UPDATE public.jobs
SET use_saved_copy = true
WHERE use_saved_copy = false;

CREATE TABLE IF NOT EXISTS public.custom_amount_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount >= 1 AND amount <= 500000),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  provider text NOT NULL DEFAULT 'razorpay',
  razorpay_payment_link_id text,
  razorpay_payment_id text,
  short_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS custom_amount_payments_link_idx
  ON public.custom_amount_payments (razorpay_payment_link_id)
  WHERE razorpay_payment_link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS custom_amount_payments_user_idx
  ON public.custom_amount_payments (user_id, created_at DESC);

ALTER TABLE public.custom_amount_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own custom amount payments" ON public.custom_amount_payments;
CREATE POLICY "Users read own custom amount payments"
  ON public.custom_amount_payments FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
