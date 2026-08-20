UPDATE public.bond_templates SET active = false WHERE active = true;

INSERT INTO public.bond_templates (version, title, file_url, courier_address, instructions, active)
VALUES (
  'v2026.1',
  'Candidate Employment Bond',
  '/__l5e/assets-v1/1efbb3d0-cc04-4bb5-82e0-d87fd9f51f96/candidate-employment-bond.pdf',
  E'SafeWork Global\nBond Documents Desk\nJaipur, Rajasthan, India',
  E'1. Download and print the Candidate Employment Bond on plain paper.\n2. Fill in all details and sign every page along with your witness.\n3. Attach a copy of your Aadhaar and PAN.\n4. Courier the signed original to the address above and enter the courier tracking number below.',
  true
);