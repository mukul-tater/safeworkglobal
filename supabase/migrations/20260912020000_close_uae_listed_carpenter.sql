-- Remove the generic Carpenter listing. Shuttering Carpenter and
-- Furniture Carpenter - Finishing, All Rounder stay live.

UPDATE public.jobs
SET
  status = 'CLOSED',
  expires_at = now()
WHERE status = 'ACTIVE'
  AND (
    slug = 'uae-listed-carpenter'
    OR id = 'a1e10000-2026-4000-8000-000000000015'
  );
