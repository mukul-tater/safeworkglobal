-- Workers choose their trade test centre unless an admin switches it off.

ALTER TABLE public.trade_test_settings
  ALTER COLUMN assignment_mode SET DEFAULT 'worker_select';

UPDATE public.trade_test_settings
SET assignment_mode = 'worker_select', updated_at = now()
WHERE id = 1;

CREATE OR REPLACE FUNCTION public.trade_test_assignment_mode()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT assignment_mode FROM public.trade_test_settings WHERE id = 1),
    'worker_select'
  );
$$;
