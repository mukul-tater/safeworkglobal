-- Physical trade test: store assigned centre + reporting window on worker_verification

ALTER TABLE public.worker_verification
  ADD COLUMN IF NOT EXISTS trade_test_center_id text,
  ADD COLUMN IF NOT EXISTS trade_test_center_name text,
  ADD COLUMN IF NOT EXISTS trade_test_reporting_window text,
  ADD COLUMN IF NOT EXISTS trade_test_booked_at timestamptz;

COMMENT ON COLUMN public.worker_verification.trade_test_center_id IS
  'Assigned physical trade test centre id (from app catalog, e.g. jaipur)';
COMMENT ON COLUMN public.worker_verification.trade_test_reporting_window IS
  'Human-readable reporting window, typically 9:00 AM – 10:00 AM';
