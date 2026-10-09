-- Czech (Europe) pay lines show koruna and rupees together.
-- Rate already used on the seat-belt vacancy: 150 CZK = ₹665.

UPDATE public.jobs
SET
  salary_display = '150 CZK (₹665)/hour net',
  description = 'Automotive seat-belt production in Brandýs nad Labem, Czech Republic. Shifts are 12 hours, five days per week, covering morning and night. Pay is 150 CZK (₹665) per hour net.'
WHERE id = 'a1e10000-2026-4000-8000-000000000048'::uuid;

UPDATE public.jobs
SET
  salary_display = 'Pec pod Sněžkou: 120–140 CZK (₹532 – ₹621)/hour. Beroun housekeeping: 115 CZK (₹510)/hour',
  description = 'Hotel work in Pec pod Sněžkou and Beroun, Czech Republic, for housekeeping, breakfast cooks, and parking or garage support. Some positions are described as permanent. Pec pod Sněžkou pay is 120–140 CZK (₹532 – ₹621) per hour depending on the role. Beroun housekeeping is 115 CZK (₹510) per hour, and piece-rate work is also mentioned (Overtime extra pay).'
WHERE id = 'a1e10000-2026-4000-8000-000000000046'::uuid;

UPDATE public.jobs
SET
  salary_display = '150–170 CZK (₹665 – ₹754)/hour',
  description = 'Warehouse and logistics work at NOTINO in Rajhrad, Czech Republic. The role covers product collection, packaging, sorting, and dispatch. Pay is 150–170 CZK (₹665 – ₹754) per hour.'
WHERE id = 'a1e10000-2026-4000-8000-000000000042'::uuid;

UPDATE public.jobs
SET
  salary_display = '130 CZK (₹576)/hour, up to 250 hours per month',
  description = 'Food manufacturing in Žiželice, Czech Republic, preparing bakery and fast-food products. Women and couples are preferred. Pay is 130 CZK (₹576) per hour, with up to 250 working hours per month.'
WHERE id = 'a1e10000-2026-4000-8000-000000000043'::uuid;

UPDATE public.jobs
SET
  salary_display = '140 CZK (₹621)/hour plus bonuses',
  description = 'Automotive manufacturing of vehicle wheel components, with quality checks. A city was not specified. Pay is 140 CZK (₹621) per hour plus bonuses.'
WHERE id = 'a1e10000-2026-4000-8000-000000000044'::uuid;

UPDATE public.jobs
SET
  salary_display = '180 CZK/hour (₹798)',
  description = 'Male candidates support automated welding at a production facility in Slaný, Czech Republic. Shifts are 8–10 hours. Pay is 180 CZK (₹798) per hour. A welding certificate is not required.'
WHERE id = 'a1e10000-2026-4000-8000-000000000045'::uuid;

UPDATE public.jobs
SET
  salary_display = 'CZK 150 (₹665)/hour net for the first 3 months, CZK 155 (₹687)/hour from months 3–6, CZK 160 (₹709)/hour after 6 months',
  description = 'Full-time sewing of automotive interior components in Bor, Czech Republic, about 60 km from Plzeň. Previous sewing experience is required. No night shifts are mentioned. Pay is described as net: 150 CZK (₹665) per hour for the first 3 months, 155 CZK (₹687) per hour from months 3–6, and 160 CZK (₹709) per hour after 6 months.'
WHERE id = 'a1e10000-2026-4000-8000-000000000047'::uuid;
