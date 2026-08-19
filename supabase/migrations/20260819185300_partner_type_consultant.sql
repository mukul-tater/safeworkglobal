-- Consultant partners: placement consultants, recruitment partners, freelancers, NGOs, candidate mobilisers
INSERT INTO public.partner_types (code, name, description, sort_order) VALUES
  (
    'CONSULTANT',
    'Consultants & Mobilisers',
    'Placement consultants, recruitment partners, freelancers, NGOs and candidate mobilisers',
    35
  )
ON CONFLICT (code) DO NOTHING;
