-- Limit the UAE Choose-a-job catalog to the 14 supported categories.
-- Rename kept listings, close specialist extras, and add warehouse / supermarket labour.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('mason_tiles_marble', 'Mason (tiles/marble)', 50),
  ('construction_labour_helper', 'Construction Labour/Helper', 91),
  ('warehouse_supermarket_labour', 'General Labour - Warehouse/Supermarket', 95),
  ('aluminium_fixer_fabricator', 'Aluminium Fixer/Fabricator', 23)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

UPDATE public.jobs
SET
  title = 'Mason (tiles/marble)',
  description = 'Tile, marble and granite mason openings for UAE finishing packages in Abu Dhabi. Floor and wall tiling, wet-area falls, and marble / granite fixing.',
  requirements =
    '2+ years tiling or marble / granite fixing experience' || chr(10) ||
    'Valid passport (min 2 years)' || chr(10) ||
    'Willing to work in UAE',
  responsibilities =
    'Set out floor and wall tiles, marble and stone from drawings and datum lines' || chr(10) ||
    'Prepare substrate, mix adhesive and bed tiles or stone to line and level' || chr(10) ||
    'Cut tiles and stone around openings, edges and sanitary fittings' || chr(10) ||
    'Grout joints, polish stone and complete movement joints as specified' || chr(10) ||
    'Fix skirting, dado, wet-area tiles and marble / granite cladding' || chr(10) ||
    'Keep the work area clean and follow HSE'
WHERE slug = 'uae-listed-mason'
   OR id = 'a1e10000-2026-4000-8000-000000000005';

UPDATE public.jobs
SET
  title = 'Construction Labour/Helper',
  description = 'Construction labour and helper openings supporting masons, carpenters and site gangs on Dubai projects. Material handling and general civil support.',
  requirements =
    'Site experience preferred' || chr(10) ||
    'Valid passport (min 2 years)' || chr(10) ||
    'Willing to work in UAE'
WHERE slug = 'uae-listed-civil-helper'
   OR id = 'a1e10000-2026-4000-8000-000000000006';

UPDATE public.jobs
SET title = 'Aluminium Fixer/Fabricator'
WHERE slug = 'uae-listed-aluminium-fabricator'
   OR id = 'a1e10000-2026-4000-8000-00000000000b';

UPDATE public.jobs
SET
  status = 'CLOSED',
  expires_at = now()
WHERE status = 'ACTIVE'
  AND (
    slug IN (
      'uae-listed-civil-labour',
      'uae-listed-mig-welder',
      'uae-listed-tig-welder',
      'uae-listed-industrial-electrician',
      'uae-listed-finishing-carpenter',
      'uae-listed-tile-mason',
      'uae-listed-all-round-mason',
      'uae-listed-block-plaster-mason',
      'uae-listed-ductman',
      'uae-listed-mechanical-helper',
      'uae-listed-general-helper',
      'uae-listed-hvac-technician',
      'uae-listed-fire-fighting-technician',
      'uae-listed-pop-gypsum-carpenter',
      'uae-listed-waterproofing-mason',
      'uae-listed-marble-granite-mason'
    )
    OR id IN (
      'a1e10000-2026-4000-8000-000000000007',
      'a1e10000-2026-4000-8000-000000000009',
      'a1e10000-2026-4000-8000-00000000000a',
      'a1e10000-2026-4000-8000-00000000000c',
      'a1e10000-2026-4000-8000-00000000000d',
      'a1e10000-2026-4000-8000-00000000000e',
      'a1e10000-2026-4000-8000-00000000000f',
      'a1e10000-2026-4000-8000-000000000010',
      'a1e10000-2026-4000-8000-000000000012',
      'a1e10000-2026-4000-8000-000000000013',
      'a1e10000-2026-4000-8000-000000000014',
      'a1e10000-2026-4000-8000-000000000016',
      'a1e10000-2026-4000-8000-000000000018',
      'a1e10000-2026-4000-8000-00000000001b',
      'a1e10000-2026-4000-8000-00000000001c',
      'a1e10000-2026-4000-8000-00000000001d'
    )
  );

INSERT INTO public.job_skills (job_id, skill_name)
SELECT seed.job_id, seed.skill_name
FROM (
  VALUES
    ('a1e10000-2026-4000-8000-000000000005'::uuid, 'Tiling'),
    ('a1e10000-2026-4000-8000-000000000005'::uuid, 'Marble Fixing'),
    ('a1e10000-2026-4000-8000-00000000000b'::uuid, 'Aluminium Fixing')
) AS seed(job_id, skill_name)
WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
    'Flight tickets' || chr(10) ||
    'Accommodation' || chr(10) ||
    'Food - Minimum 200 and kitchen facilities' || chr(10) ||
    'Local transport' || chr(10) ||
    'MOL' || chr(10) ||
    'Work visa and Emirates ID' || chr(10) ||
    'Legal contract and job security' || chr(10) ||
    'Airport pickup' || chr(10) ||
    '8-10 hours of duty + overtime (extra pay)' || chr(10) ||
    'Medical facility + Insurance in Dubai' || chr(10) ||
    '11+1' || chr(10) ||
    'Return airfare after 2 years' || chr(10) ||
    'PBBY Insurance in India' || chr(10) ||
    'Uniform provided by company' || chr(10) ||
    'Attendance bonus (26 working days)' || chr(10) ||
    '6-day work week' || chr(10) ||
    '2-year contract';
BEGIN
  SELECT ep.user_id
    INTO v_employer
    FROM public.employer_profiles ep
    INNER JOIN public.user_roles ur ON ur.user_id = ep.user_id AND ur.role = 'employer'
    ORDER BY ep.created_at
    LIMIT 1;

  IF v_employer IS NULL THEN
    SELECT ur.user_id
      INTO v_employer
      FROM public.user_roles ur
     WHERE ur.role = 'admin'
     LIMIT 1;
  END IF;

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping warehouse labour seed: no employer or admin user found';
    RETURN;
  END IF;

  INSERT INTO public.jobs (
    id, employer_id, created_by, posted_by_role,
    title, description, requirements, responsibilities, benefits,
    location, country, job_type, experience_level,
    salary_min, salary_max, currency, salary_display,
    openings, visa_sponsorship, remote_allowed, status,
    posted_at, expires_at, slug
  )
  SELECT
    seed.id,
    v_employer,
    v_employer,
    'admin',
    seed.title,
    seed.description,
    seed.requirements,
    seed.responsibilities,
    v_benefits,
    seed.city,
    'UAE',
    'FULL_TIME',
    seed.experience_level,
    seed.salary_min,
    seed.salary_max,
    'INR',
    seed.salary_display,
    seed.openings,
    true,
    false,
    'ACTIVE',
    now(),
    now() + interval '18 months',
    seed.slug
  FROM (
    VALUES
      (
        'a1e10000-2026-4000-8000-00000000001e'::uuid,
        'General Labour - Warehouse/Supermarket',
        'uae-listed-warehouse-labour',
        'Dubai',
        'ENTRY',
        27000, 28000, '₹27,000 – ₹28,000', 20,
        'General labour openings for UAE warehouses, stores and supermarket back-of-house in Dubai. Loading, stacking, replenishment and housekeeping.',
        'Physically fit for warehouse / store work' || chr(10) || 'Valid passport (min 2 years)' || chr(10) || 'Willing to work in UAE',
        'Load, unload and shift goods in warehouses, stores and supermarket back-of-house' || chr(10) || 'Pick, pack, stack and replenish stock as directed' || chr(10) || 'Keep aisles, docks and storage areas clean and clear' || chr(10) || 'Help with receiving, put-away and simple inventory counts' || chr(10) || 'Follow supervisor instructions and warehouse / store safety rules' || chr(10) || 'Wear PPE at all times on site'
      )
  ) AS seed(
    id, title, slug, city, experience_level,
    salary_min, salary_max, salary_display, openings,
    description, requirements, responsibilities
  )
  WHERE NOT EXISTS (
    SELECT 1
      FROM public.jobs j
     WHERE j.status = 'ACTIVE'
       AND (
         (j.country = 'UAE' AND lower(j.title) = lower(seed.title))
         OR j.slug = seed.slug
         OR j.id = seed.id
       )
  );

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-00000000001e'::uuid, 'Warehouse'),
      ('a1e10000-2026-4000-8000-00000000001e'::uuid, 'Material Handling')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.job_skills js
       WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
    );
END $$;
