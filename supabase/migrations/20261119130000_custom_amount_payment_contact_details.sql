ALTER TABLE public.custom_amount_payments
  ADD COLUMN IF NOT EXISTS registered_mobile text,
  ADD COLUMN IF NOT EXISTS payer_email text,
  ADD COLUMN IF NOT EXISTS passport_number text;

COMMENT ON COLUMN public.custom_amount_payments.passport_number IS
  'Sensitive payer identifier collected for SafeWork payment reconciliation; never sent to Razorpay.';
