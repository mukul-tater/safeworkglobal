-- Phase 2: benefit catalog, and copy the UAE trade templates onto jobs that still use them.
-- Find jobs and the journey then read the job row (use_saved_copy).
-- A null benefit_catalog keeps the lists that ship with the app.

ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS benefit_catalog jsonb;

CREATE OR REPLACE FUNCTION public.admin_save_site_content(
  p_section text,
  p_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_section = 'country_cards' THEN
    UPDATE public.site_content SET country_cards = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'trade_card_images' THEN
    UPDATE public.site_content SET trade_card_images = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'popular_titles' THEN
    UPDATE public.site_content SET popular_titles = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'job_templates' THEN
    UPDATE public.site_content SET job_templates = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'pre_journey' THEN
    UPDATE public.site_content SET pre_journey = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'acknowledgements' THEN
    UPDATE public.site_content SET acknowledgements = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'indemnity_bond' THEN
    UPDATE public.site_content SET indemnity_bond = p_value, updated_at = now() WHERE id = 1;
  ELSIF p_section = 'benefit_catalog' THEN
    UPDATE public.site_content SET benefit_catalog = p_value, updated_at = now() WHERE id = 1;
  ELSE
    RAISE EXCEPTION 'Unknown site content section';
  END IF;
END;
$$;

-- Delivery
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'delivery' THEN 'Bike delivery persons (Food and Parcel)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'बाइक डिलीवरी (खाना और पार्सल)'
    ELSE title_hi
  END,
  description = $job$Bike rider openings for full-time delivery work in the UAE (Keta). You need a valid Indian driving license and an ECNR passport, and you must be physically fit for flexible shifts. Riding experience is preferred; freshers may be considered. Pay is AED 3,000 – 3,500 (₹78,000 – ₹91,000) per month. Duty is 8–10 hours a day, with overtime paid extra. Age 22–37 years. The UAE license fee of AED 4,500 is deducted over up to 10 months. Accommodation is provided until the license is issued. Food is usually included in the salary, with a minimum of 200 and kitchen facilities until the 2-wheeler license is issued. Selection is through an online interview. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Deliver orders safely and on time
Follow assigned delivery routes and schedules
Keep clear communication with the company and team
Handle deliveries carefully
Follow UAE traffic and road-safety rules
Complete the deliveries assigned for the day$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'bike delivery'
    ELSE work_phrase
  END,
  benefits = $job$Flight tickets
Accommodation (till the license is issued)
Food (usually included in salary) - Minimum 200 and kitchen facilities (2 Wheeler license milne tak)
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
PBBY Insurance in India
Uniform provided by company
2-year contract$job$,
    benefits_hi = $job$फ्लाइट टिकट
आवास (लाइसेंस जारी होने तक)
खाना (आमतौर पर सैलरी में शामिल) — न्यूनतम 200 और किचन की सुविधा (2 व्हीलर लाइसेंस मिलने तक)
लोकल ट्रांसपोर्ट
एमओएल (श्रम मंत्रालय)
वर्क वीज़ा और एमिरेट्स आईडी
कानूनी अनुबंध और नौकरी की सुरक्षा
एयरपोर्ट पिकअप
8-10 घंटे की ड्यूटी + ओवरटाइम (अतिरिक्त पगार)
दुबई में मेडिकल सुविधा और बीमा
भारत में PBBY बीमा
कंपनी द्वारा यूनिफॉर्म
2 साल का कॉन्ट्रैक्ट$job$,
  salary_min = 78000,
  salary_max = 91000,
  salary_display = 'AED 3,000 – 3,500 (₹78,000 – ₹91,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=1k5yecjHlq0', 'https://www.youtube.com/watch?v=KvA00e5EIwk', 'https://www.youtube.com/watch?v=gl-UDyQIq8Y']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'delivery'
    OR lower(btrim(title)) = 'bike delivery persons (food and parcel)'
    OR lower(title) LIKE '%bike rider%'
      OR lower(title) LIKE '%delivery rider%'
      OR lower(title) LIKE '%bike delivery%'
      OR lower(title) LIKE '%delivery boy%'
  );

-- Aluminium Fixer/Fabricator
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'aluminium fixer/fabricator' THEN 'Aluminium Fixer'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'एल्युमिनियम फिक्सर'
    ELSE title_hi
  END,
  description = $job$Aluminium fixer and fabricator openings for UAE windows, doors, cladding and shop-fronts. You will cut, mill, assemble and install aluminium frames from fabrication drawings, join sections and prepare surfaces for powder coat or anodising. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Read fabrication drawings and mark cutting lists for aluminium sections
Cut, mill, drill and assemble aluminium frames, cladding and joinery
Fit, tack and weld or mechanically join aluminium components
Install windows, doors, curtain-wall and shop-front frames as directed
File, grind and prepare surfaces for powder coat or anodising
Follow workshop and site HSE, including hot-work controls$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'aluminium fitting'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 39000,
  salary_max = 42000,
  salary_display = 'AED 1,696 – 1,826 (₹39,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=ovEDLzbAWpg']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'aluminium fixer/fabricator'
    OR lower(btrim(title)) = 'aluminium fixer'
    OR lower(title) LIKE '%aluminium fixer%'
      OR lower(title) LIKE '%aluminum fixer%'
      OR lower(title) LIKE '%aluminium fabricator%'
      OR lower(title) LIKE '%aluminum fabricator%'
      OR lower(title) LIKE '%glazing fabricator%'
  );

-- Shuttering Carpenter
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'shuttering carpenter' THEN 'Shuttering Carpenter'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'शटरिंग (साँचा बढ़ई)'
    ELSE title_hi
  END,
  description = $job$Formwork / shuttering carpenter openings for UAE high-rise and infrastructure pours. You will erect, align and strike timber, plywood or system formwork to line and level, install props and ties, and coordinate pour sequence with civil and steel-fixer teams. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Erect, align and strike timber, plywood or system formwork
Set shuttering to line, level and plumb from drawings
Install props, walers, ties and working platforms safely
Coordinate pour sequence with civil and steel-fixer teams
Dismantle formwork without damaging concrete
Follow working-at-height and site HSE rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'shuttering'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 36000,
  salary_max = 42000,
  salary_display = 'AED 1,565 – 1,826 (₹36,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=7tHqE8uD1WY', 'https://www.youtube.com/watch?v=jfoIdlaiUsQ', 'https://www.youtube.com/watch?v=BEFRlLUkjgs', 'https://www.youtube.com/watch?v=ROdYO2yzDeU', 'https://www.youtube.com/watch?v=-v5AlV_td1w', 'https://www.youtube.com/watch?v=ndurB3hkWOY']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'shuttering carpenter'
    OR lower(btrim(title)) = 'shuttering carpenter'
    OR lower(title) LIKE '%shuttering carpenter%'
      OR lower(title) LIKE '%shuttering%'
      OR lower(title) LIKE '%formwork carpenter%'
      OR lower(title) LIKE '%s. carpenter%'
  );

-- MIG Welder
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'mig welder' THEN 'MIG Welder'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'MIG वेल्डर'
    ELSE title_hi
  END,
  description = $job$MIG welder openings for UAE fabrication and construction. You will set up MIG/MAG plant, weld structural steel, plates and ducts to WPS, grind between passes and complete visual quality checks with hot-work controls. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Set up MIG / MAG plant, wire, gas and parameters as per WPS
MIG-weld structural steel, plates, ducts and fabrication spools
Fit, tack and weld joints to drawings; grind and clean between passes
Carry out visual checks for undercut, porosity and incomplete fusion
Use screens, fire watch and PPE for hot work
Report defects and complete rework as directed$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'MIG welding'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 39000,
  salary_max = 42000,
  salary_display = 'AED 1,696 – 1,826 (₹39,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=rj-FaVlieC8', 'https://www.youtube.com/watch?v=dmU9CdmChsQ', 'https://www.youtube.com/watch?v=y9R1-ZoHoBw', 'https://www.youtube.com/watch?v=j4lCfSxUio4', 'https://www.youtube.com/watch?v=d2YeclasnjI']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'mig welder'
    OR lower(btrim(title)) = 'mig welder'
    OR lower(title) LIKE '%mig welder%'
      OR lower(title) LIKE '%mig welding%'
      OR lower(title) LIKE '%mag welder%'
  );

-- TIG Welder
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'tig welder' THEN 'TIG Welder'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'TIG वेल्डर'
    ELSE title_hi
  END,
  description = $job$TIG welder openings for UAE pipe, tank and precision fabrication. You will TIG-weld stainless, aluminium or carbon steel, run root and fill passes, keep the gas shield and inspect joints. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Set up TIG plant, tungsten, filler and argon as per WPS
TIG-weld stainless, aluminium or carbon-steel pipe and sheet
Run root and fill passes on pipe, tanks and precision joints
Keep the purge and gas shield; inspect for oxidation and undercut
Read isometric and fabrication drawings
Follow hot-work, PPE and UAE HSE procedures$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'TIG welding'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 39000,
  salary_max = 42000,
  salary_display = 'AED 1,696 – 1,826 (₹39,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=IEO_yaeFKlA&t=15s', 'https://www.youtube.com/watch?v=bFNDpgbB9P4', 'https://www.youtube.com/watch?v=9I46o-xnyLg', 'https://www.youtube.com/watch?v=C44edJcOe-U']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'tig welder'
    OR lower(btrim(title)) = 'tig welder'
    OR lower(title) LIKE '%tig welder%'
      OR lower(title) LIKE '%tig welding%'
  );

-- Mason (bricks/plaster)
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'mason (bricks/plaster)' THEN 'Mason (Bricks / Plaster)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'ईंट प्लास्टर राजमिस्त्री'
    ELSE title_hi
  END,
  description = $job$Brick, block and plaster mason openings for UAE building works. You will lay bricks and blocks to line and level, apply internal and external plaster, mix mortar and keep corners and surfaces within tolerance. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Lay bricks and AAC / concrete blocks to line, level and plumb
Build walls, columns, partitions and openings as marked out
Apply scratch and finish plaster coats to walls and soffits
Mix mortar and plaster to the specified ratio
Install lintels, mesh and corner beads as required
Keep joints, corners and surfaces within tolerance and follow HSE$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'brick and plaster work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE youtube_urls
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'mason (bricks/plaster)'
    OR lower(btrim(title)) = 'mason (bricks / plaster)'
    OR lower(title) LIKE '%mason (bricks/plaster)%'
      OR lower(title) LIKE '%bricks/plaster%'
      OR lower(title) LIKE '%brick mason%'
      OR lower(title) LIKE '%plaster mason%'
      OR lower(title) LIKE '%block & plaster%'
      OR lower(title) LIKE '%block plaster%'
      OR lower(title) LIKE '%brick and plaster%'
  );

-- Mason (tiles/marble)
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'mason (tiles/marble)' THEN 'Mason (Raj Mistri / Tiles / Marble)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'राजमिस्त्री (टाइल्स एंड मार्बल)'
    ELSE title_hi
  END,
  description = $job$Tile, marble and granite mason openings for UAE finishing packages. You will set out floors and walls, bed tiles and stone to falls, cut around fittings, grout joints and fix skirting, dado and cladding. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Set out floor and wall tiles, marble and stone from drawings and datum lines
Prepare substrate, mix adhesive and bed tiles or stone to line and level
Cut tiles and stone around openings, edges and sanitary fittings
Grout joints, polish stone and complete movement joints as specified
Fix skirting, dado, wet-area tiles and marble / granite cladding
Keep the work area clean and follow HSE$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'tile and marble work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=zc6oD3xhleE', 'https://www.youtube.com/watch?v=kv4RoL-5sjE', 'https://www.youtube.com/watch?v=94n8_jm6-lE', 'https://www.youtube.com/watch?v=H4iBocERDRs', 'https://www.youtube.com/watch?v=0wJ68LNU_EI']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'mason (tiles/marble)'
    OR lower(btrim(title)) = 'mason (raj mistri / tiles / marble)'
    OR lower(title) LIKE '%mason (tiles/marble)%'
      OR lower(title) LIKE '%tiles/marble%'
      OR lower(title) LIKE '%tile mason%'
      OR lower(title) LIKE '%tile fixer%'
      OR lower(title) LIKE '%marble mason%'
      OR lower(title) LIKE '%granite mason%'
      OR lower(title) LIKE '%marble / granite%'
      OR lower(title) LIKE '%marble/granite%'
  );

-- Cleaner (Female)
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'cleaner (female)' THEN 'Cleaner (Female)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'क्लीनर (सफाई वाली)'
    ELSE title_hi
  END,
  description = $job$Female cleaner openings for UAE camps, offices, residences and facilities. You will sweep, mop, empty bins, clean toilets and keep assigned areas tidy under supervisor instructions. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Sweep, mop and keep assigned floors, rooms and common areas clean
Empty bins and take waste to the designated collection point
Clean toilets, pantries and wash areas with the chemicals provided
Follow the daily cleaning checklist and supervisor instructions
Report spills, damage and missing supplies promptly
Wear PPE and follow site HSE and hygiene rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'cleaning'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 28000,
  salary_max = 32000,
  salary_display = 'AED 1,217 – 1,391 (₹28,000 – ₹32,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=a_K0yfcJamw', 'https://www.youtube.com/watch?v=7MWw1J8x_f0', 'https://www.youtube.com/watch?v=CmR-bYHkUgk', 'https://www.youtube.com/watch?v=GSX_G5Pz_Fc']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'cleaner (female)'
    OR lower(btrim(title)) = 'cleaner (female)'
    OR lower(title) LIKE '%cleaner (female)%'
      OR lower(title) LIKE '%female cleaner%'
      OR lower(title) LIKE '%lady cleaner%'
  );

-- Cleaner (Male)
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'cleaner (male)' THEN 'Cleaner (Male)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'क्लीनर (सफाई वाला)'
    ELSE title_hi
  END,
  description = $job$Male cleaner openings for UAE camps, offices, sites and facilities. You will sweep, mop, empty bins, clean toilets and keep assigned areas tidy under supervisor instructions. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Sweep, mop and keep assigned floors, rooms and common areas clean
Empty bins and take waste to the designated collection point
Clean toilets, pantries and wash areas with the chemicals provided
Follow the daily cleaning checklist and supervisor instructions
Report spills, damage and missing supplies promptly
Wear PPE and follow site HSE and hygiene rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'cleaning'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 28000,
  salary_max = 32000,
  salary_display = 'AED 1,217 – 1,391 (₹28,000 – ₹32,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=a_K0yfcJamw', 'https://www.youtube.com/watch?v=7MWw1J8x_f0', 'https://www.youtube.com/watch?v=CmR-bYHkUgk', 'https://www.youtube.com/watch?v=GSX_G5Pz_Fc']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'cleaner (male)'
    OR lower(btrim(title)) = 'cleaner (male)'
    OR lower(title) LIKE '%cleaner (male)%'
      OR lower(title) LIKE '%male cleaner%'
      OR lower(title) LIKE '%cleaner%'
      OR lower(title) LIKE '%housekeeping%'
      OR lower(title) LIKE '%janitor%'
  );

-- Warehouse Helper
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'warehouse helper' THEN 'Warehouse Helper'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'वेयरहाउस हेल्पर'
    ELSE title_hi
  END,
  description = $job$Warehouse helper openings for UAE warehouses and stores. You will load, unload, pick, pack, stack and replenish stock, keep aisles and docks clear, and help with receiving and simple inventory counts. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Load, unload and shift goods in warehouses and stores
Pick, pack, stack and replenish stock as directed
Keep aisles, docks and storage areas clean and clear
Help with receiving, put-away and simple inventory counts
Follow supervisor instructions and warehouse safety rules
Wear PPE at all times on site$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'warehouse work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 30000,
  salary_max = 32000,
  salary_display = 'AED 1,304 – 1,391 (₹30,000 – ₹32,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=e8RgNqmSh2c']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'warehouse helper'
    OR lower(btrim(title)) = 'warehouse helper'
    OR lower(title) LIKE '%warehouse helper%'
      OR lower(title) LIKE '%supermarket helper%'
      OR lower(title) LIKE '%warehouse/supermarket%'
      OR lower(title) LIKE '%general labour - warehouse%'
      OR lower(title) LIKE '%warehouse%'
  );

-- Construction Labour/Helper
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'construction labour/helper' THEN 'Construction Labour'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'कंस्ट्रक्शन लेबर / हेल्पर'
    ELSE title_hi
  END,
  description = $job$Construction labour and helper openings supporting masons, carpenters, steel fixers and site gangs. You will shift materials, mix mortar or concrete, keep the work area tidy and follow supervisor instructions and site HSE. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Assist masons, carpenters, steel fixers and other skilled trades
Shift blocks, cement, tools and materials as directed
Mix mortar or concrete and keep the work area tidy
Help with shuttering, curing and simple site tasks
Follow supervisor instructions and site safety rules
Wear PPE at all times on site$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'construction work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 30000,
  salary_max = 32000,
  salary_display = 'AED 1,304 – 1,391 (₹30,000 – ₹32,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=5-WAwzGtJbQ', 'https://www.youtube.com/watch?v=EN0RKQBIUSM', 'https://www.youtube.com/watch?v=dgxM2qpuRh0', 'https://www.youtube.com/watch?v=XI1o-C-1MK4']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'construction labour/helper'
    OR lower(btrim(title)) = 'construction labour'
    OR lower(title) LIKE '%construction labour%'
      OR lower(title) LIKE '%construction labor%'
      OR lower(title) LIKE '%construction helper%'
      OR lower(title) LIKE '%civil helper%'
      OR lower(title) LIKE '%civil labour%'
      OR lower(title) LIKE '%civil labor%'
      OR lower(title) LIKE '%mechanical helper%'
      OR lower(title) LIKE '%general helper%'
  );

-- Pipe Fitter
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'pipe fitter' THEN 'GI Steel Pipe Fitter'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'GI स्टील पाइप फिटर'
    ELSE title_hi
  END,
  description = $job$Pipe fitter openings for UAE mechanical and plumbing packages. You will read isometrics, cut and align CS/GI/SS pipe, install flanges, valves and supports, and assist hydrotest and punch-list close-out with welders and riggers. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Read isometrics and piping drawings for routing and supports
Cut, bevel, fit and align CS/GI/SS pipes and fittings
Install flanges, gaskets, valves and pipe supports
Assist hydrotest / leak test and punch-list close-out
Coordinate with welders and riggers for spool installation
Follow HSE, hot-work and quality procedures$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'pipe fitting'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=1-ngwzGeq8Q', 'https://www.youtube.com/watch?v=FdCbRTSWH7g', 'https://www.youtube.com/watch?v=xAsKpckUj6g', 'https://www.youtube.com/watch?v=aUtzmTsSOUg', 'https://www.youtube.com/watch?v=N5_h1kTq7Yk', 'https://www.youtube.com/watch?v=_nKpUYXYjKI', 'https://www.youtube.com/watch?v=0ljxKfplUgo', 'https://www.youtube.com/watch?v=_JNm3nBHVwo']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'pipe fitter'
    OR lower(btrim(title)) = 'gi steel pipe fitter'
    OR lower(title) LIKE '%pipe fitter%'
      OR lower(title) LIKE '%pipefitter%'
  );

-- Steel Fixer
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'steel fixer' THEN 'Steel Fixer'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'सरिया बांधने वाला'
    ELSE title_hi
  END,
  description = $job$Steel fixer openings for UAE high-rise and infrastructure. You will read bar-bending schedules, cut, bend, place and tie reinforcement for slabs, beams, columns and walls, and keep cover, laps and chairs as specified. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Read bar-bending schedules and rebar drawings
Cut, bend, place and tie reinforcement for slabs, beams, columns and walls
Maintain cover, laps, chairs and spacers as specified
Fix starter bars, couplers and extra steel at openings
Coordinate pour sequence with shuttering and civil teams
Follow working-at-height, lifting and site HSE rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'steel fixing'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=NT2IeAdO7eg']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'steel fixer'
    OR lower(btrim(title)) = 'steel fixer'
    OR lower(title) LIKE '%steel fixer%'
      OR lower(title) LIKE '%rebar fixer%'
  );

-- AC Technician
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'ac technician' THEN 'AC Technician'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'एसी मिस्त्री'
    ELSE title_hi
  END,
  description = $job$AC technician openings for UAE facilities and residential packages. You will install, service and repair split, window and package units, run copper and drain lines, vacuum and charge circuits, and diagnose cooling faults. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Install, service and repair split, window and package AC units
Run copper piping, drain lines and indoor/outdoor connections
Vacuum, charge and leak-test refrigerant circuits
Diagnose cooling faults and replace filters, capacitors and fans
Keep plant rooms and work areas clean
Follow electrical isolation and site HSE rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'AC work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 39000,
  salary_max = 50000,
  salary_display = 'AED 1,696 – 2,174 (₹39,000 – ₹50,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=sRy3zy84hwg']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'ac technician'
    OR lower(btrim(title)) = 'ac technician'
    OR lower(title) LIKE '%ac technician%'
      OR lower(title) LIKE '%air conditioning technician%'
      OR lower(title) LIKE '%air conditioner technician%'
      OR lower(title) LIKE '%hvac technician%'
  );

-- Scaffolder
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'scaffolder' THEN 'Scaffolder'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'पाड़ बाँधने वाला / मचान बनाने वाला'
    ELSE title_hi
  END,
  description = $job$Scaffolder openings for UAE high-rise and industrial access. You will erect, alter and dismantle tube-and-coupler or system scaffold, set standards, ledgers, braces and platforms, and tag incomplete or unsafe work. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Erect, alter and dismantle tube-and-coupler or system scaffold
Set base plates, standards, ledgers, braces, platforms and ties
Install guardrails, toe boards, ladders and working platforms
Inspect components and tag incomplete or unsafe scaffold
Follow working-at-height, lifting and site HSE rules
Coordinate with civil and finishing trades for access$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'scaffolding'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 36000,
  salary_max = 42000,
  salary_display = 'AED 1,565 – 1,826 (₹36,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=87oUrUvPaNg', 'https://www.youtube.com/watch?v=vxUSsnpUM18', 'https://www.youtube.com/watch?v=Q77bEb6dAls', 'https://www.youtube.com/watch?v=HRduiZsbdv0', 'https://www.youtube.com/watch?v=mCijicwSucA', 'https://www.youtube.com/watch?v=jm7MfSSUOj0']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'scaffolder'
    OR lower(btrim(title)) = 'scaffolder'
    OR lower(title) LIKE '%scaffolder%'
      OR lower(title) LIKE '%scaffolding%'
  );

-- Painter
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'painter' THEN 'Painter'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'पेंटर'
    ELSE title_hi
  END,
  description = $job$Painter openings for UAE interiors and structural steel. You will prepare surfaces, apply emulsion, enamel and texture finishes by brush, roller or spray, protect adjacent work and close snags before handover. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Prepare surfaces: filling, sanding, priming and masking
Apply emulsion, enamel and texture paint to walls, ceilings and steel
Spray or roll to an even finish as per the specification
Protect adjacent finishes and clean up after each area
Touch up snags before handover
Follow site HSE including working-at-height and solvent controls$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'painting'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 36000,
  salary_max = 42000,
  salary_display = 'AED 1,565 – 1,826 (₹36,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=1J55ifnYB5k', 'https://www.youtube.com/watch?v=FPzHpVRiNE8', 'https://www.youtube.com/watch?v=vgaRcs22Q1A', 'https://www.youtube.com/watch?v=mmsn1S2Ojks']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'painter'
    OR lower(btrim(title)) = 'painter'
    OR lower(title) LIKE '%painter%'
      OR lower(title) LIKE '%painting%'
  );

-- Furniture Carpenter - Finishing, All Rounder
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'furniture carpenter - finishing, all rounder' THEN 'Furniture Carpenter'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'फर्नीचर कारपेंटर'
    ELSE title_hi
  END,
  description = $job$Furniture and finishing carpentry openings for UAE interiors. You will build cabinets, wardrobes and wooden joinery, install doors, frames, panelling and fittings, and handle sanding, polish and snag close-out as an all-rounder. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Build and finish furniture, cabinets, wardrobes and wooden joinery
Cut, assemble, sand and fix timber to drawings and site measures
Install doors, frames, panelling, skirting and furniture fittings
Handle finishing, polish and snag-list close-out before handover
Work as an all-rounder across furniture and finishing carpentry as directed
Follow site HSE and protect completed interiors$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'furniture work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 37000,
  salary_max = 41000,
  salary_display = 'AED 1,609 – 1,783 (₹37,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=piL7_XJG0k4', 'https://www.youtube.com/watch?v=YXkruBOAMD8', 'https://www.youtube.com/watch?v=fcuod3D9v_s']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'furniture carpenter - finishing, all rounder'
    OR lower(btrim(title)) = 'furniture carpenter'
    OR lower(title) LIKE '%furniture carpenter%'
      OR lower(title) LIKE '%finishing, all rounder%'
      OR lower(title) LIKE '%finishing all rounder%'
      OR lower(title) LIKE '%finishing carpenter%'
      OR lower(title) LIKE '%pop / gypsum%'
      OR lower(title) LIKE '%pop/gypsum%'
      OR lower(title) LIKE '%gypsum carpenter%'
      OR lower(title) LIKE '%pop carpenter%'
  );

-- Electrician
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'electrician' THEN 'Electrician'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'इलेक्ट्रीशियन'
    ELSE title_hi
  END,
  description = $job$UAE sites need electricians for LV wiring, distribution boards, lighting circuits and fault-finding on construction and facilities packages. You will work from drawings and single-line diagrams, terminate DBs/MCBs, and follow LOTO and permit-to-work. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Read electrical drawings, single-line diagrams and site layouts
Install, terminate and test LV wiring, DBs, MCB/RCCB and lighting circuits
Carry out fault finding on power, lighting and equipment circuits
Follow LOTO, permit-to-work and UAE HSE procedures
Coordinate first-fix and second-fix with civil and finishing teams
Maintain tools, report daily progress and raise material requests$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'electrical work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 42000,
  salary_display = 'AED 1,522 – 1,826 (₹35,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=y4mS3RU2fdk&t=17s', 'https://www.youtube.com/watch?v=YqLV_kT8KFs', 'https://www.youtube.com/watch?v=5cNVMHiDZ7I', 'https://www.youtube.com/watch?v=mc4XG2D05uI', 'https://www.youtube.com/watch?v=dXck9UX9eVc', 'https://www.youtube.com/watch?v=KSFF77dhFQQ', 'https://www.youtube.com/watch?v=hIg3ulllRPQ', 'https://www.youtube.com/watch?v=zL5yjxgPoCA']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'electrician'
    OR lower(btrim(title)) = 'electrician'
    OR lower(title) LIKE '%electrician%'
      OR lower(title) LIKE '%electrical%'
  );

-- Plumber
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'plumber' THEN 'Plumber'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'प्लंबर'
    ELSE title_hi
  END,
  description = $job$Residential and commercial plumbing packages in the UAE covering PVC, CPVC, PPR and GI supply and drainage. You will fit sanitary ware, pressure-test lines, leak-test stacks and close punch-list items before handover. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Install PVC, CPVC, PPR and GI pipes for water supply and drainage
Fit sanitary ware, taps, floor traps and bathroom accessories
Pressure-test supply lines and leak-test drainage stacks
Chase walls, set levels and connect to existing risers as per drawings
Clear blockages and close punch-list items before handover
Follow plumbing drawings and site HSE rules$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'plumbing'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=gWUtDhS3-SY', 'https://www.youtube.com/watch?v=28BXeowy8Ik', 'https://www.youtube.com/watch?v=6QzM_HhKO-M', 'https://www.youtube.com/watch?v=sQxCfztlRvM', 'https://www.youtube.com/watch?v=Di4eJO39KB8', 'https://www.youtube.com/watch?v=f72wv4A9oYA', 'https://www.youtube.com/watch?v=oywhmEenRhs']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'plumber'
    OR lower(btrim(title)) = 'plumber'
    OR lower(title) LIKE '%plumber%'
      OR lower(title) LIKE '%plumbing%'
  );

-- Welder
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'welder' THEN 'Welder'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'वेल्डर'
    ELSE title_hi
  END,
  description = $job$Structural and fabrication welding openings in the UAE for ARC, MIG and TIG work on steel, plates, pipes and supports. You will fit, tack and weld to WPS and drawings, grind joints, and complete visual quality checks with hot-work controls. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Perform ARC, MIG and/or TIG welding as per WPS and drawings
Fit, tack and weld structural steel, plates, pipes or supports
Grind, clean and prepare joints; carry out visual quality checks
Read fabrication drawings and mark cutting lists
Use PPE, screens and fire watch for hot work
Report defects and complete rework as directed$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'welding'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 39000,
  salary_max = 42000,
  salary_display = 'AED 1,696 – 1,826 (₹39,000 – ₹42,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=d2YeclasnjI', 'https://www.youtube.com/watch?v=PzrHWzNsJyE', 'https://www.youtube.com/watch?v=mbpPz2vdjLM', 'https://www.youtube.com/watch?v=av-5yUbu6WU', 'https://www.youtube.com/watch?v=bFNDpgbB9P4', 'https://www.youtube.com/watch?v=IsZuZdE99T4', 'https://www.youtube.com/watch?v=uE0yq1BUeYk']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'welder'
    OR lower(btrim(title)) = 'welder'
    OR lower(title) LIKE '%welder%'
      OR lower(title) LIKE '%welding%'
  );

-- Mason (tiles/marble)
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'mason (tiles/marble)' THEN 'Mason (Raj Mistri / Tiles / Marble)'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'राजमिस्त्री (टाइल्स एंड मार्बल)'
    ELSE title_hi
  END,
  description = $job$Tile, marble and granite mason openings for UAE finishing packages. You will set out floors and walls, bed tiles and stone to falls, cut around fittings, grout joints and fix skirting, dado and cladding. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Set out floor and wall tiles, marble and stone from drawings and datum lines
Prepare substrate, mix adhesive and bed tiles or stone to line and level
Cut tiles and stone around openings, edges and sanitary fittings
Grout joints, polish stone and complete movement joints as specified
Fix skirting, dado, wet-area tiles and marble / granite cladding
Keep the work area clean and follow HSE$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'tile and marble work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 35000,
  salary_max = 41000,
  salary_display = 'AED 1,522 – 1,783 (₹35,000 – ₹41,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=zc6oD3xhleE', 'https://www.youtube.com/watch?v=kv4RoL-5sjE', 'https://www.youtube.com/watch?v=94n8_jm6-lE', 'https://www.youtube.com/watch?v=H4iBocERDRs', 'https://www.youtube.com/watch?v=0wJ68LNU_EI']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'mason (tiles/marble)'
    OR lower(btrim(title)) = 'mason (raj mistri / tiles / marble)'
    OR lower(title) LIKE '%mason%'
  );

-- Construction Labour/Helper
UPDATE public.jobs
SET
  title = CASE
    WHEN lower(btrim(title)) = 'construction labour/helper' THEN 'Construction Labour'
    ELSE title
  END,
  title_hi = CASE
    WHEN title_hi IS NULL OR btrim(title_hi) = '' THEN 'कंस्ट्रक्शन लेबर / हेल्पर'
    ELSE title_hi
  END,
  description = $job$Construction labour and helper openings supporting masons, carpenters, steel fixers and site gangs. You will shift materials, mix mortar or concrete, keep the work area tidy and follow supervisor instructions and site HSE. Visa sponsorship for shortlisted candidates.$job$,
  responsibilities = $job$Assist masons, carpenters, steel fixers and other skilled trades
Shift blocks, cement, tools and materials as directed
Mix mortar or concrete and keep the work area tidy
Help with shuttering, curing and simple site tasks
Follow supervisor instructions and site safety rules
Wear PPE at all times on site$job$,
  work_phrase = CASE
    WHEN work_phrase IS NULL OR btrim(work_phrase) = '' THEN 'construction work'
    ELSE work_phrase
  END,
  benefits = CASE
      WHEN benefits IS NULL OR btrim(benefits) = '' THEN $job$Flight tickets
Accommodation
Food (usually included in salary) - Minimum 200 and kitchen facilities
Local transport
MOL
Work visa and Emirates ID
Legal contract and job security
Airport pickup
8-10 hours of duty + overtime (extra pay)
Medical facility + Insurance in Dubai
Return airfare after 2 years
PBBY Insurance in India
Uniform provided by company
6-day work week
2-year contract$job$
      ELSE benefits
    END,
  salary_min = 30000,
  salary_max = 32000,
  salary_display = 'AED 1,304 – 1,391 (₹30,000 – ₹32,000)',
  currency = 'INR',
  youtube_urls = CASE
    WHEN youtube_urls IS NOT NULL AND cardinality(youtube_urls) > 0 THEN youtube_urls
    ELSE ARRAY['https://www.youtube.com/watch?v=5-WAwzGtJbQ', 'https://www.youtube.com/watch?v=EN0RKQBIUSM', 'https://www.youtube.com/watch?v=dgxM2qpuRh0', 'https://www.youtube.com/watch?v=XI1o-C-1MK4']::text[]
  END,
  use_saved_copy = true
WHERE COALESCE(use_saved_copy, false) = false
  AND (country IS NULL OR btrim(country) = '' OR lower(btrim(country)) = 'uae')
  AND (
    lower(btrim(title)) = 'construction labour/helper'
    OR lower(btrim(title)) = 'construction labour'
    OR lower(title) LIKE '%helper%'
      OR lower(title) LIKE '%labour%'
      OR lower(title) LIKE '%labor%'
  );

