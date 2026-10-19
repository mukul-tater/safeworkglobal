-- Fill Hindi names and YouTube links on jobs that are still empty, even when
-- saved copy is already on. Re-assert interview and job-selection email triggers.

CREATE TEMP TABLE job_catalog_seed (
  skill text PRIMARY KEY,
  display_en text NOT NULL,
  title_hi text NOT NULL,
  about text NOT NULL,
  responsibilities text NOT NULL,
  work_phrase text NOT NULL,
  youtube_urls text[] NOT NULL
);

INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Electrician', 'Electrician', 'इलेक्ट्रीशियन', 'UAE sites need electricians for LV wiring, distribution boards, lighting circuits and fault-finding on construction and facilities packages. You will work from drawings and single-line diagrams, terminate DBs/MCBs, and follow LOTO and permit-to-work. Visa sponsorship for shortlisted candidates.', 'Read electrical drawings, single-line diagrams and site layouts
Install, terminate and test LV wiring, DBs, MCB/RCCB and lighting circuits
Carry out fault finding on power, lighting and equipment circuits
Follow LOTO, permit-to-work and UAE HSE procedures
Coordinate first-fix and second-fix with civil and finishing teams
Maintain tools, report daily progress and raise material requests', 'electrical work', ARRAY['https://www.youtube.com/watch?v=y4mS3RU2fdk&t=17s','https://www.youtube.com/watch?v=YqLV_kT8KFs','https://www.youtube.com/watch?v=5cNVMHiDZ7I','https://www.youtube.com/watch?v=mc4XG2D05uI','https://www.youtube.com/watch?v=dXck9UX9eVc','https://www.youtube.com/watch?v=KSFF77dhFQQ','https://www.youtube.com/watch?v=hIg3ulllRPQ','https://www.youtube.com/watch?v=zL5yjxgPoCA']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Welder', 'Welder', 'वेल्डर', 'Structural and fabrication welding openings in the UAE for ARC, MIG and TIG work on steel, plates, pipes and supports. You will fit, tack and weld to WPS and drawings, grind joints, and complete visual quality checks with hot-work controls. Visa sponsorship for shortlisted candidates.', 'Perform ARC, MIG and/or TIG welding as per WPS and drawings
Fit, tack and weld structural steel, plates, pipes or supports
Grind, clean and prepare joints; carry out visual quality checks
Read fabrication drawings and mark cutting lists
Use PPE, screens and fire watch for hot work
Report defects and complete rework as directed', 'welding', ARRAY['https://www.youtube.com/watch?v=d2YeclasnjI','https://www.youtube.com/watch?v=PzrHWzNsJyE','https://www.youtube.com/watch?v=mbpPz2vdjLM','https://www.youtube.com/watch?v=av-5yUbu6WU','https://www.youtube.com/watch?v=bFNDpgbB9P4','https://www.youtube.com/watch?v=IsZuZdE99T4','https://www.youtube.com/watch?v=uE0yq1BUeYk']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('MIG Welder', 'MIG Welder', 'MIG वेल्डर', 'MIG welder openings for UAE fabrication and construction. You will set up MIG/MAG plant, weld structural steel, plates and ducts to WPS, grind between passes and complete visual quality checks with hot-work controls. Visa sponsorship for shortlisted candidates.', 'Set up MIG / MAG plant, wire, gas and parameters as per WPS
MIG-weld structural steel, plates, ducts and fabrication spools
Fit, tack and weld joints to drawings; grind and clean between passes
Carry out visual checks for undercut, porosity and incomplete fusion
Use screens, fire watch and PPE for hot work
Report defects and complete rework as directed', 'MIG welding', ARRAY['https://www.youtube.com/watch?v=rj-FaVlieC8','https://www.youtube.com/watch?v=dmU9CdmChsQ','https://www.youtube.com/watch?v=y9R1-ZoHoBw','https://www.youtube.com/watch?v=j4lCfSxUio4','https://www.youtube.com/watch?v=d2YeclasnjI']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('TIG Welder', 'TIG Welder', 'TIG वेल्डर', 'TIG welder openings for UAE pipe, tank and precision fabrication. You will TIG-weld stainless, aluminium or carbon steel, run root and fill passes, keep the gas shield and inspect joints. Visa sponsorship for shortlisted candidates.', 'Set up TIG plant, tungsten, filler and argon as per WPS
TIG-weld stainless, aluminium or carbon-steel pipe and sheet
Run root and fill passes on pipe, tanks and precision joints
Keep the purge and gas shield; inspect for oxidation and undercut
Read isometric and fabrication drawings
Follow hot-work, PPE and UAE HSE procedures', 'TIG welding', ARRAY['https://www.youtube.com/watch?v=IEO_yaeFKlA&t=15s','https://www.youtube.com/watch?v=bFNDpgbB9P4','https://www.youtube.com/watch?v=9I46o-xnyLg','https://www.youtube.com/watch?v=C44edJcOe-U']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Plumber', 'Plumber', 'प्लंबर', 'Residential and commercial plumbing packages in the UAE covering PVC, CPVC, PPR and GI supply and drainage. You will fit sanitary ware, pressure-test lines, leak-test stacks and close punch-list items before handover. Visa sponsorship for shortlisted candidates.', 'Install PVC, CPVC, PPR and GI pipes for water supply and drainage
Fit sanitary ware, taps, floor traps and bathroom accessories
Pressure-test supply lines and leak-test drainage stacks
Chase walls, set levels and connect to existing risers as per drawings
Clear blockages and close punch-list items before handover
Follow plumbing drawings and site HSE rules', 'plumbing', ARRAY['https://www.youtube.com/watch?v=gWUtDhS3-SY','https://www.youtube.com/watch?v=28BXeowy8Ik','https://www.youtube.com/watch?v=6QzM_HhKO-M','https://www.youtube.com/watch?v=sQxCfztlRvM','https://www.youtube.com/watch?v=Di4eJO39KB8','https://www.youtube.com/watch?v=f72wv4A9oYA','https://www.youtube.com/watch?v=oywhmEenRhs']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Shuttering Carpenter', 'Shuttering Carpenter', 'शटरिंग (साँचा बढ़ई)', 'Formwork / shuttering carpenter openings for UAE high-rise and infrastructure pours. You will erect, align and strike timber, plywood or system formwork to line and level, install props and ties, and coordinate pour sequence with civil and steel-fixer teams. Visa sponsorship for shortlisted candidates.', 'Erect, align and strike timber, plywood or system formwork
Set shuttering to line, level and plumb from drawings
Install props, walers, ties and working platforms safely
Coordinate pour sequence with civil and steel-fixer teams
Dismantle formwork without damaging concrete
Follow working-at-height and site HSE rules', 'shuttering', ARRAY['https://www.youtube.com/watch?v=7tHqE8uD1WY','https://www.youtube.com/watch?v=jfoIdlaiUsQ','https://www.youtube.com/watch?v=BEFRlLUkjgs','https://www.youtube.com/watch?v=ROdYO2yzDeU','https://www.youtube.com/watch?v=-v5AlV_td1w','https://www.youtube.com/watch?v=ndurB3hkWOY']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Mason (tiles/marble)', 'Mason (Raj Mistri / Tiles / Marble)', 'राजमिस्त्री (टाइल्स एंड मार्बल)', 'Tile, marble and granite mason openings for UAE finishing packages. You will set out floors and walls, bed tiles and stone to falls, cut around fittings, grout joints and fix skirting, dado and cladding. Visa sponsorship for shortlisted candidates.', 'Set out floor and wall tiles, marble and stone from drawings and datum lines
Prepare substrate, mix adhesive and bed tiles or stone to line and level
Cut tiles and stone around openings, edges and sanitary fittings
Grout joints, polish stone and complete movement joints as specified
Fix skirting, dado, wet-area tiles and marble / granite cladding
Keep the work area clean and follow HSE', 'tile and marble work', ARRAY['https://www.youtube.com/watch?v=zc6oD3xhleE','https://www.youtube.com/watch?v=kv4RoL-5sjE','https://www.youtube.com/watch?v=94n8_jm6-lE','https://www.youtube.com/watch?v=H4iBocERDRs','https://www.youtube.com/watch?v=0wJ68LNU_EI']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Mason (bricks/plaster)', 'Mason (Bricks / Plaster)', 'ईंट प्लास्टर राजमिस्त्री', 'Brick, block and plaster mason openings for UAE building works. You will lay bricks and blocks to line and level, apply internal and external plaster, mix mortar and keep corners and surfaces within tolerance. Visa sponsorship for shortlisted candidates.', 'Lay bricks and AAC / concrete blocks to line, level and plumb
Build walls, columns, partitions and openings as marked out
Apply scratch and finish plaster coats to walls and soffits
Mix mortar and plaster to the specified ratio
Install lintels, mesh and corner beads as required
Keep joints, corners and surfaces within tolerance and follow HSE', 'brick and plaster work', '{}'::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Construction Labour/Helper', 'Construction Labour', 'कंस्ट्रक्शन लेबर / हेल्पर', 'Construction labour and helper openings supporting masons, carpenters, steel fixers and site gangs. You will shift materials, mix mortar or concrete, keep the work area tidy and follow supervisor instructions and site HSE. Visa sponsorship for shortlisted candidates.', 'Assist masons, carpenters, steel fixers and other skilled trades
Shift blocks, cement, tools and materials as directed
Mix mortar or concrete and keep the work area tidy
Help with shuttering, curing and simple site tasks
Follow supervisor instructions and site safety rules
Wear PPE at all times on site', 'construction work', ARRAY['https://www.youtube.com/watch?v=5-WAwzGtJbQ','https://www.youtube.com/watch?v=EN0RKQBIUSM','https://www.youtube.com/watch?v=dgxM2qpuRh0','https://www.youtube.com/watch?v=XI1o-C-1MK4']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Pipe Fitter', 'GI Steel Pipe Fitter', 'GI स्टील पाइप फिटर', 'Pipe fitter openings for UAE mechanical and plumbing packages. You will read isometrics, cut and align CS/GI/SS pipe, install flanges, valves and supports, and assist hydrotest and punch-list close-out with welders and riggers. Visa sponsorship for shortlisted candidates.', 'Read isometrics and piping drawings for routing and supports
Cut, bevel, fit and align CS/GI/SS pipes and fittings
Install flanges, gaskets, valves and pipe supports
Assist hydrotest / leak test and punch-list close-out
Coordinate with welders and riggers for spool installation
Follow HSE, hot-work and quality procedures', 'pipe fitting', ARRAY['https://www.youtube.com/watch?v=1-ngwzGeq8Q','https://www.youtube.com/watch?v=FdCbRTSWH7g','https://www.youtube.com/watch?v=xAsKpckUj6g','https://www.youtube.com/watch?v=aUtzmTsSOUg','https://www.youtube.com/watch?v=N5_h1kTq7Yk','https://www.youtube.com/watch?v=_nKpUYXYjKI','https://www.youtube.com/watch?v=0ljxKfplUgo','https://www.youtube.com/watch?v=_JNm3nBHVwo']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Furniture Carpenter - Finishing, All Rounder', 'Furniture Carpenter', 'फर्नीचर कारपेंटर', 'Furniture and finishing carpentry openings for UAE interiors. You will build cabinets, wardrobes and wooden joinery, install doors, frames, panelling and fittings, and handle sanding, polish and snag close-out as an all-rounder. Visa sponsorship for shortlisted candidates.', 'Build and finish furniture, cabinets, wardrobes and wooden joinery
Cut, assemble, sand and fix timber to drawings and site measures
Install doors, frames, panelling, skirting and furniture fittings
Handle finishing, polish and snag-list close-out before handover
Work as an all-rounder across furniture and finishing carpentry as directed
Follow site HSE and protect completed interiors', 'furniture work', ARRAY['https://www.youtube.com/watch?v=piL7_XJG0k4','https://www.youtube.com/watch?v=YXkruBOAMD8','https://www.youtube.com/watch?v=fcuod3D9v_s']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Steel Fixer', 'Steel Fixer', 'सरिया बांधने वाला', 'Steel fixer openings for UAE high-rise and infrastructure. You will read bar-bending schedules, cut, bend, place and tie reinforcement for slabs, beams, columns and walls, and keep cover, laps and chairs as specified. Visa sponsorship for shortlisted candidates.', 'Read bar-bending schedules and rebar drawings
Cut, bend, place and tie reinforcement for slabs, beams, columns and walls
Maintain cover, laps, chairs and spacers as specified
Fix starter bars, couplers and extra steel at openings
Coordinate pour sequence with shuttering and civil teams
Follow working-at-height, lifting and site HSE rules', 'steel fixing', ARRAY['https://www.youtube.com/watch?v=NT2IeAdO7eg']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('AC Technician', 'AC Technician', 'एसी मिस्त्री', 'AC technician openings for UAE facilities and residential packages. You will install, service and repair split, window and package units, run copper and drain lines, vacuum and charge circuits, and diagnose cooling faults. Visa sponsorship for shortlisted candidates.', 'Install, service and repair split, window and package AC units
Run copper piping, drain lines and indoor/outdoor connections
Vacuum, charge and leak-test refrigerant circuits
Diagnose cooling faults and replace filters, capacitors and fans
Keep plant rooms and work areas clean
Follow electrical isolation and site HSE rules', 'AC work', ARRAY['https://www.youtube.com/watch?v=sRy3zy84hwg']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Warehouse Helper', 'Warehouse Helper', 'वेयरहाउस हेल्पर', 'Warehouse helper openings for UAE warehouses and stores. You will load, unload, pick, pack, stack and replenish stock, keep aisles and docks clear, and help with receiving and simple inventory counts. Visa sponsorship for shortlisted candidates.', 'Load, unload and shift goods in warehouses and stores
Pick, pack, stack and replenish stock as directed
Keep aisles, docks and storage areas clean and clear
Help with receiving, put-away and simple inventory counts
Follow supervisor instructions and warehouse safety rules
Wear PPE at all times on site', 'warehouse work', ARRAY['https://www.youtube.com/watch?v=e8RgNqmSh2c']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Cleaner (Male)', 'Cleaner (Male)', 'क्लीनर (सफाई वाला)', 'Male cleaner openings for UAE camps, offices, sites and facilities. You will sweep, mop, empty bins, clean toilets and keep assigned areas tidy under supervisor instructions. Visa sponsorship for shortlisted candidates.', 'Sweep, mop and keep assigned floors, rooms and common areas clean
Empty bins and take waste to the designated collection point
Clean toilets, pantries and wash areas with the chemicals provided
Follow the daily cleaning checklist and supervisor instructions
Report spills, damage and missing supplies promptly
Wear PPE and follow site HSE and hygiene rules', 'cleaning', ARRAY['https://www.youtube.com/watch?v=a_K0yfcJamw','https://www.youtube.com/watch?v=7MWw1J8x_f0','https://www.youtube.com/watch?v=CmR-bYHkUgk','https://www.youtube.com/watch?v=GSX_G5Pz_Fc']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Cleaner (Female)', 'Cleaner (Female)', 'क्लीनर (सफाई वाली)', 'Female cleaner openings for UAE camps, offices, residences and facilities. You will sweep, mop, empty bins, clean toilets and keep assigned areas tidy under supervisor instructions. Visa sponsorship for shortlisted candidates.', 'Sweep, mop and keep assigned floors, rooms and common areas clean
Empty bins and take waste to the designated collection point
Clean toilets, pantries and wash areas with the chemicals provided
Follow the daily cleaning checklist and supervisor instructions
Report spills, damage and missing supplies promptly
Wear PPE and follow site HSE and hygiene rules', 'cleaning', ARRAY['https://www.youtube.com/watch?v=a_K0yfcJamw','https://www.youtube.com/watch?v=7MWw1J8x_f0','https://www.youtube.com/watch?v=CmR-bYHkUgk','https://www.youtube.com/watch?v=GSX_G5Pz_Fc']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Scaffolder', 'Scaffolder', 'पाड़ बाँधने वाला / मचान बनाने वाला', 'Scaffolder openings for UAE high-rise and industrial access. You will erect, alter and dismantle tube-and-coupler or system scaffold, set standards, ledgers, braces and platforms, and tag incomplete or unsafe work. Visa sponsorship for shortlisted candidates.', 'Erect, alter and dismantle tube-and-coupler or system scaffold
Set base plates, standards, ledgers, braces, platforms and ties
Install guardrails, toe boards, ladders and working platforms
Inspect components and tag incomplete or unsafe scaffold
Follow working-at-height, lifting and site HSE rules
Coordinate with civil and finishing trades for access', 'scaffolding', ARRAY['https://www.youtube.com/watch?v=87oUrUvPaNg','https://www.youtube.com/watch?v=vxUSsnpUM18','https://www.youtube.com/watch?v=Q77bEb6dAls','https://www.youtube.com/watch?v=HRduiZsbdv0','https://www.youtube.com/watch?v=mCijicwSucA','https://www.youtube.com/watch?v=jm7MfSSUOj0']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Painter', 'Painter', 'पेंटर', 'Painter openings for UAE interiors and structural steel. You will prepare surfaces, apply emulsion, enamel and texture finishes by brush, roller or spray, protect adjacent work and close snags before handover. Visa sponsorship for shortlisted candidates.', 'Prepare surfaces: filling, sanding, priming and masking
Apply emulsion, enamel and texture paint to walls, ceilings and steel
Spray or roll to an even finish as per the specification
Protect adjacent finishes and clean up after each area
Touch up snags before handover
Follow site HSE including working-at-height and solvent controls', 'painting', ARRAY['https://www.youtube.com/watch?v=1J55ifnYB5k','https://www.youtube.com/watch?v=FPzHpVRiNE8','https://www.youtube.com/watch?v=vgaRcs22Q1A','https://www.youtube.com/watch?v=mmsn1S2Ojks']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Aluminium Fixer/Fabricator', 'Aluminium Fixer', 'एल्युमिनियम फिक्सर', 'Aluminium fixer and fabricator openings for UAE windows, doors, cladding and shop-fronts. You will cut, mill, assemble and install aluminium frames from fabrication drawings, join sections and prepare surfaces for powder coat or anodising. Visa sponsorship for shortlisted candidates.', 'Read fabrication drawings and mark cutting lists for aluminium sections
Cut, mill, drill and assemble aluminium frames, cladding and joinery
Fit, tack and weld or mechanically join aluminium components
Install windows, doors, curtain-wall and shop-front frames as directed
File, grind and prepare surfaces for powder coat or anodising
Follow workshop and site HSE, including hot-work controls', 'aluminium fitting', ARRAY['https://www.youtube.com/watch?v=ovEDLzbAWpg']::text[]);
INSERT INTO job_catalog_seed (skill, display_en, title_hi, about, responsibilities, work_phrase, youtube_urls) VALUES ('Delivery', 'Bike delivery persons (Food and Parcel)', 'बाइक डिलीवरी (खाना और पार्सल)', 'Bike rider openings for full-time delivery work in the UAE (Keta). You need a valid Indian driving license and an ECNR passport, and you must be physically fit for flexible shifts. Riding experience is preferred; freshers may be considered. Pay is AED 3,000 – 3,500 (₹78,000 – ₹91,000) per month. Duty is 8–10 hours a day, with overtime paid extra. Age 22–37 years. The UAE license fee of AED 4,500 is deducted over up to 10 months. Accommodation is provided until the license is issued. Food is usually included in the salary, with a minimum of 200 and kitchen facilities until the 2-wheeler license is issued. Selection is through an online interview. Visa sponsorship for shortlisted candidates.', 'Deliver orders safely and on time
Follow assigned delivery routes and schedules
Keep clear communication with the company and team
Handle deliveries carefully
Follow UAE traffic and road-safety rules
Complete the deliveries assigned for the day', 'bike delivery', ARRAY['https://www.youtube.com/watch?v=1k5yecjHlq0','https://www.youtube.com/watch?v=KvA00e5EIwk','https://www.youtube.com/watch?v=gl-UDyQIq8Y']::text[]);

UPDATE public.jobs j
SET
  title_hi = COALESCE(NULLIF(btrim(j.title_hi), ''), c.title_hi),
  work_phrase = COALESCE(NULLIF(btrim(j.work_phrase), ''), c.work_phrase),
  description = CASE
    WHEN j.use_saved_copy THEN j.description
    WHEN j.description ILIKE 'Reputed employer hiring%' OR btrim(j.description) = '' THEN c.about
    ELSE j.description
  END,
  responsibilities = CASE
    WHEN NULLIF(btrim(j.responsibilities), '') IS NULL THEN NULLIF(btrim(c.responsibilities), '')
    ELSE j.responsibilities
  END,
  youtube_urls = CASE
    WHEN COALESCE(cardinality(j.youtube_urls), 0) = 0 THEN c.youtube_urls
    ELSE j.youtube_urls
  END
FROM job_catalog_seed c
WHERE (
    COALESCE(cardinality(j.youtube_urls), 0) = 0
    OR j.title_hi IS NULL
    OR btrim(j.title_hi) = ''
  )
  AND (
    j.quiz_skill_code = c.skill
    OR lower(btrim(j.title)) = lower(c.skill)
    OR lower(btrim(j.title)) = lower(c.display_en)
    OR (c.skill = 'Delivery' AND lower(j.title) LIKE '%deliver%')
    OR (c.skill = 'Aluminium Fixer/Fabricator' AND (lower(j.title) LIKE '%aluminium%' OR lower(j.title) LIKE '%aluminum%'))
  );


UPDATE public.jobs
SET use_saved_copy = true
WHERE use_saved_copy = false;

UPDATE public.jobs
SET quiz_skill_code = CASE
  WHEN lower(title) LIKE '%seat belt%' OR lower(title) LIKE '%seatbelt%' THEN 'Automotive Seat Belt Production Worker'
  WHEN lower(title) LIKE '%sewing machine%' OR lower(title) LIKE '%seamstress%' OR lower(title) LIKE '%automotive sewing%' THEN 'Automotive Sewing Machine Operator / Seamstress'
  WHEN lower(title) LIKE '%quality control%' OR lower(title) LIKE '%production & quality%' OR lower(title) LIKE '%production and quality%' THEN 'Automobile Factory – Production & Quality Control Worker'
  ELSE quiz_skill_code
END
WHERE (
  lower(title) LIKE '%seat belt%' OR lower(title) LIKE '%seatbelt%'
  OR lower(title) LIKE '%sewing%' OR lower(title) LIKE '%seamstress%'
  OR lower(title) LIKE '%quality control%' OR lower(title) LIKE '%production & quality%' OR lower(title) LIKE '%production and quality%'
)
AND (
  quiz_skill_code IS NULL
  OR quiz_skill_code IS DISTINCT FROM CASE
    WHEN lower(title) LIKE '%seat belt%' OR lower(title) LIKE '%seatbelt%' THEN 'Automotive Seat Belt Production Worker'
    WHEN lower(title) LIKE '%sewing machine%' OR lower(title) LIKE '%seamstress%' OR lower(title) LIKE '%automotive sewing%' THEN 'Automotive Sewing Machine Operator / Seamstress'
    WHEN lower(title) LIKE '%quality control%' OR lower(title) LIKE '%production & quality%' OR lower(title) LIKE '%production and quality%' THEN 'Automobile Factory – Production & Quality Control Worker'
    ELSE quiz_skill_code
  END
);

-- Email triggers. Safe to replace if an earlier migration already created them.
CREATE OR REPLACE FUNCTION public.enqueue_journey_step_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN (
    'journey_step_cleared',
    'trade_test_slip',
    'trade_test_slip_cancelled',
    'job_selected',
    'interview_scheduled'
  ) THEN
    PERFORM public.request_journey_step_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_journey_job_selected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_hi text;
BEGIN
  IF NEW.journey_job_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.journey_job_id IS NOT DISTINCT FROM OLD.journey_job_id THEN
    RETURN NEW;
  END IF;

  SELECT title, title_hi INTO v_title, v_hi
    FROM public.jobs
   WHERE id = NEW.journey_job_id;
  v_title := COALESCE(NULLIF(btrim(v_title), ''), 'the selected job');

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.user_id,
      'job_selected',
      'Job selected / नौकरी चुनी गई',
      'You selected ' || v_title
        || CASE WHEN NULLIF(btrim(v_hi), '') IS NULL THEN '' ELSE ' (' || btrim(v_hi) || ')' END
        || '. This trade stays on your journey. / आपने '
        || v_title || ' चुना है। यही ट्रेड आपकी यात्रा में रहेगा।',
      jsonb_build_object(
        'href', '/worker/journey',
        'job_id', NEW.journey_job_id,
        'job_title', v_title,
        'job_title_hi', NULLIF(btrim(v_hi), '')
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'job selected notification failed for %: %', NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_journey_job_selected ON public.worker_verification;
CREATE TRIGGER trg_notify_journey_job_selected
  AFTER INSERT OR UPDATE OF journey_job_id ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_journey_job_selected();

CREATE OR REPLACE FUNCTION public.notify_interview_scheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_when text;
BEGIN
  IF NEW.interview_scheduled_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.interview_scheduled_at IS NOT DISTINCT FROM OLD.interview_scheduled_at THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_title FROM public.jobs WHERE id = NEW.journey_job_id;
  v_title := COALESCE(NULLIF(btrim(v_title), ''), 'your job');
  v_when := to_char(NEW.interview_scheduled_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM');

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.user_id,
      'interview_scheduled',
      'Video interview scheduled / वीडियो इंटरव्यू तय',
      'Your video interview for ' || v_title || ' is on ' || v_when || ' IST.'
        || CASE
             WHEN NULLIF(btrim(NEW.interview_meeting_url), '') IS NULL THEN ''
             ELSE ' Join: ' || btrim(NEW.interview_meeting_url)
           END
        || ' / ' || v_title || ' के लिए आपका वीडियो इंटरव्यू ' || v_when || ' IST को है।',
      jsonb_build_object(
        'href', '/worker/journey',
        'job_id', NEW.journey_job_id,
        'job_title', v_title,
        'scheduled_at', NEW.interview_scheduled_at,
        'meeting_url', NEW.interview_meeting_url
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'interview scheduled notification failed for %: %', NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_interview_scheduled ON public.worker_verification;
CREATE TRIGGER trg_notify_interview_scheduled
  AFTER UPDATE OF interview_scheduled_at ON public.worker_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_interview_scheduled();

