-- ITI partner type for Industrial Training Institutes
INSERT INTO public.partner_types (code, name, description, sort_order) VALUES
  ('ITI', 'Industrial Training Institute', 'ITIs that train and onboard skilled workers', 25)
ON CONFLICT (code) DO NOTHING;
