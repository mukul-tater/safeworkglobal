-- UAE Find-jobs catalog: Nanny / House Maid listing for employer Maid Cc.
-- Total demand 200+, salary 1600 AED after allocation / 800 AED standby, food and accommodation included in both.

INSERT INTO public.trades (code, name, sort_order) VALUES
  ('nanny_house_maid', 'Nanny / House Maid', 98)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

DO $$
DECLARE
  v_employer uuid;
  v_benefits text :=
    'Flight tickets included in service charge' || chr(10) ||
    'Free accommodation provided (in both work & standby)' || chr(10) ||
    'Food provided (in both work & standby)' || chr(10) ||
    'Work visa and Emirates ID' || chr(10) ||
    'Medical insurance in Dubai / UAE' || chr(10) ||
    'Legal employment contract';
  v_description text :=
    'Nanny / House Maid recruitment in the UAE for employer Maid Cc. Openings for cleaning, cooking, and house help across residences. Total demand 200+ vacancies. Salary AED 1,600 per month after work allocation, AED 800 per month on standby. Food and accommodation provided in both conditions. Duty 12 hours per day. Selection mode: Interview. Requirements: Basic English mandatory, ECNR passport only, minimum 1 year experience, age 25–45 years. Processing time 20–25 days. Total service charge ₹25,000 including flight ticket.';
  v_requirements text :=
    'Age: 25–45 years' || chr(10) ||
    'Only ECNR passport' || chr(10) ||
    'Basic English mandatory' || chr(10) ||
    'Minimum 1 year relevant experience' || chr(10) ||
    'Working hours: 12 hours' || chr(10) ||
    'Selection mode: Interview';
  v_responsibilities text :=
    'Perform household cleaning including sweeping, mopping, dusting, and tidying' || chr(10) ||
    'Assist with daily family cooking, meal preparation, and kitchen maintenance' || chr(10) ||
    'Provide caring and attentive childcare and nanny supervision' || chr(10) ||
    'Handle laundry, ironing, and general housekeeping duties' || chr(10) ||
    'Maintain high standards of hygiene and cleanliness throughout the home' || chr(10) ||
    'Communicate in basic English and follow household instructions and routines';
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

  UPDATE public.jobs AS j
  SET
    status = 'ACTIVE',
    title = 'Nanny / House Maid',
    title_hi = 'नैनी / हाउस मेड',
    description = v_description,
    requirements = v_requirements,
    responsibilities = v_responsibilities,
    benefits = v_benefits,
    location = 'Dubai',
    country = 'UAE',
    job_type = 'FULL_TIME',
    experience_level = 'ENTRY',
    salary_min = 18400,
    salary_max = 36800,
    local_salary_min = 18400,
    local_salary_max = 36800,
    local_salary_currency = 'INR',
    currency = 'AED',
    salary_display = 'AED 800 – 1,600 (₹18,400 – ₹36,800)',
    openings = 200,
    visa_sponsorship = true,
    remote_allowed = false,
    service_charge = 25000,
    processing_time = '20–25 days',
    processing_time_hi = '20-25 दिन',
    age_min = 25,
    age_max = 45,
    work_phrase = 'housekeeping and child care',
    quiz_skill_code = 'Nanny / House Maid',
    use_saved_copy = true,
    expires_at = GREATEST(COALESCE(j.expires_at, now()), now() + interval '18 months')
  WHERE j.slug = 'uae-listed-nanny-house-maid'
     OR j.id = 'a1e10000-2026-4000-8000-000000000050'::uuid
     OR (j.country = 'UAE' AND lower(j.title) IN ('nanny / house maid', 'nanny/ house maid', 'nanny/house maid', 'nanny', 'house maid'));

  IF v_employer IS NULL THEN
    RAISE NOTICE 'Skipping insert of UAE nanny/house maid job: no employer or admin user found';
  ELSE
    INSERT INTO public.jobs (
      id, employer_id, created_by, posted_by_role,
      title, title_hi, description, requirements, responsibilities, benefits,
      location, country, job_type, experience_level,
      salary_min, salary_max, local_salary_min, local_salary_max, local_salary_currency,
      currency, salary_display,
      openings, visa_sponsorship, remote_allowed, status,
      posted_at, expires_at, slug, service_charge,
      processing_time, processing_time_hi, age_min, age_max,
      work_phrase, quiz_skill_code, use_saved_copy
    )
    SELECT
      'a1e10000-2026-4000-8000-000000000050'::uuid,
      v_employer,
      v_employer,
      'admin',
      'Nanny / House Maid',
      'नैनी / हाउस मेड',
      v_description,
      v_requirements,
      v_responsibilities,
      v_benefits,
      'Dubai',
      'UAE',
      'FULL_TIME',
      'ENTRY',
      18400,
      36800,
      18400,
      36800,
      'INR',
      'AED',
      'AED 800 – 1,600 (₹18,400 – ₹36,800)',
      200,
      true,
      false,
      'ACTIVE',
      now(),
      now() + interval '18 months',
      'uae-listed-nanny-house-maid',
      25000,
      '20–25 days',
      '20-25 दिन',
      25,
      45,
      'housekeeping and child care',
      'Nanny / House Maid',
      true
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.slug = 'uae-listed-nanny-house-maid'
          OR j.id = 'a1e10000-2026-4000-8000-000000000050'::uuid
          OR (j.country = 'UAE' AND lower(j.title) IN ('nanny / house maid', 'nanny/ house maid', 'nanny/house maid') AND j.status = 'ACTIVE')
    );
  END IF;

  INSERT INTO public.job_skills (job_id, skill_name)
  SELECT seed.job_id, seed.skill_name
  FROM (
    VALUES
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'Cleaning'),
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'Cooking'),
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'House help'),
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'Childcare'),
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'ECNR passport'),
      ('a1e10000-2026-4000-8000-000000000050'::uuid, 'Basic English')
  ) AS seed(job_id, skill_name)
  WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = seed.job_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
     WHERE js.job_id = seed.job_id AND js.skill_name = seed.skill_name
  );
END $$;

INSERT INTO public.skill_quiz_configs
  (skill_code, region, questions_to_show, selection_mode, selected_ids, pass_score, active)
SELECT 'Nanny / House Maid', NULL, 10, 'random_active', '{}'::uuid[], 60, true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.skill_quiz_configs c
  WHERE c.skill_code = 'Nanny / House Maid'
    AND c.region IS NULL
);

DELETE FROM public.worker_skill_quiz_items
WHERE skill_code = 'Nanny / House Maid';

INSERT INTO public.worker_skill_quiz_items
  (skill_code, question, question_hi, options, correct_option, sort_order)
VALUES
  ('Nanny / House Maid', 'What are the main duties of a house maid and nanny?', 'हाउस मेड और नैनी का मुख्य काम क्या होता है?', '[{"id":"A","en":"Cleaning, cooking, childcare, and household assistance","hi":"सफाई, खाना बनाना, बच्चों की देखभाल और घरेलू सहायता"},{"id":"B","en":"Driving heavy commercial vehicles","hi":"भारी व्यावसायिक वाहन चलाना"},{"id":"C","en":"Electrical repairs and welding","hi":"इलेक्ट्रिकल मरम्मत और वेल्डिंग"},{"id":"D","en":"Security patrolling","hi":"सुरक्षा गश्त करना"}]'::jsonb, 'A', 1),
  ('Nanny / House Maid', 'What is the most important step before preparing food or feeding a child?', 'खाना बनाने या बच्चे को खाना खिलाने से पहले सबसे जरूरी कदम क्या है?', '[{"id":"A","en":"Wash your hands thoroughly with soap and water","hi":"साबुन और पानी से अपने हाथ अच्छी तरह धोना"},{"id":"B","en":"Apply perfume on hands","hi":"हाथों पर परफ्यूम लगाना"},{"id":"C","en":"Turn off the refrigerator","hi":"फ्रिज बंद कर देना"},{"id":"D","en":"Leave food uncovered","hi":"खाने को खुला छोड़ देना"}]'::jsonb, 'A', 2),
  ('Nanny / House Maid', 'When looking after a young child, what is the most important safety rule?', 'छोटे बच्चे की देखभाल करते समय सबसे महत्वपूर्ण सुरक्षा नियम क्या है?', '[{"id":"A","en":"Never leave the child unattended near hot stoves, water, or balconies","hi":"बच्चे को गर्म चूल्हे, पानी या बालकनी के पास कभी अकेला न छोड़ें"},{"id":"B","en":"Allow the child to play with sharp kitchen knives","hi":"बच्चे को रसोई के तेज चाकू से खेलने दें"},{"id":"C","en":"Keep medicines open within reach","hi":"दवाइयों को बच्चे की पहुंच में खुला रखें"},{"id":"D","en":"Lock the child in a dark room alone","hi":"बच्चे को अकेले अंधेरे कमरे में बंद कर दें"}]'::jsonb, 'A', 3),
  ('Nanny / House Maid', 'How should household cleaning chemicals (bleach, floor cleaner) be stored?', 'घर में इस्तेमाल होने वाले सफाई के केमिकल (ब्लीच, फिनाइल आदि) को कैसे रखना चाहिए?', '[{"id":"A","en":"In a secure place away from food and out of children’s reach","hi":"खाने से दूर और बच्चों की पहुंच से बाहर सुरक्षित स्थान पर"},{"id":"B","en":"Next to baby milk bottles","hi":"बच्चे के दूध की बोतल के पास"},{"id":"C","en":"In open bowls on the floor","hi":"फर्श पर खुले बर्तनों में"},{"id":"D","en":"Inside the microwave oven","hi":"माइक्रोवेव ओवन के अंदर"}]'::jsonb, 'A', 4),
  ('Nanny / House Maid', 'What should you do before washing colored and white clothes?', 'रंगीन और सफेद कपड़े धोने से पहले क्या करना चाहिए?', '[{"id":"A","en":"Separate white clothes from colored clothes to prevent staining","hi":"रंग चढ़ने से बचाने के लिए सफेद और रंगीन कपड़ों को अलग करना"},{"id":"B","en":"Wash everything together in boiling hot water","hi":"सभी कपड़ों को एक साथ उबलते पानी में धोना"},{"id":"C","en":"Add bleach to all colored clothes","hi":"सभी रंगीन कपड़ों में ब्लीच मिला देना"},{"id":"D","en":"Dry clothes without washing","hi":"बिना धोए कपड़े सुखा देना"}]'::jsonb, 'A', 5),
  ('Nanny / House Maid', 'What should you do immediately if water or oil spills on the kitchen floor?', 'यदि रसोई के फर्श पर पानी या तेल गिर जाए तो तुरंत क्या करना चाहिए?', '[{"id":"A","en":"Wipe and dry the floor immediately to prevent slips and falls","hi":"फिसलने और गिरने से बचाने के लिए तुरंत पोंछकर सुखाना"},{"id":"B","en":"Leave it until someone slips","hi":"किसी के फिसलने तक उसे वैसे ही छोड़ देना"},{"id":"C","en":"Cover it with a rug and ignore it","hi":"उस पर कपड़ा डालकर अनदेखा करना"},{"id":"D","en":"Pour more water on it","hi":"उस पर और पानी डाल देना"}]'::jsonb, 'A', 6),
  ('Nanny / House Maid', 'If a child is injured or there is an emergency at home, what is your first action?', 'यदि बच्चे को चोट लगे या घर में कोई आपात स्थिति हो, तो आपकी पहली कार्रवाई क्या होनी चाहिए?', '[{"id":"A","en":"Immediately inform the employer and call emergency services if needed","hi":"तुरंत नियोक्ता को सूचित करें और जरूरत पड़ने पर आपातकालीन नंबर पर कॉल करें"},{"id":"B","en":"Hide the incident and do not tell anyone","hi":"घटना को छिपाएं और किसी को न बताएं"},{"id":"C","en":"Leave the house quietly","hi":"चुपचाप घर से बाहर चले जाएं"},{"id":"D","en":"Blame another person","hi":"किसी अन्य व्यक्ति पर दोष मढ़ें"}]'::jsonb, 'A', 7),
  ('Nanny / House Maid', 'Why is basic English communication necessary for this job in the UAE?', 'UAE में इस नौकरी के लिए बुनियादी अंग्रेजी बातचीत क्यों जरूरी है?', '[{"id":"A","en":"To understand employer instructions and communicate clearly","hi":"नियोक्ता के निर्देशों को समझने और स्पष्ट बातचीत करने के लिए"},{"id":"B","en":"To teach school classes","hi":"स्कूल की कक्षाएं पढ़ाने के लिए"},{"id":"C","en":"To write legal contracts","hi":"कानूनी अनुबंध लिखने के लिए"},{"id":"D","en":"It is not required","hi":"इसकी कोई आवश्यकता नहीं है"}]'::jsonb, 'A', 8),
  ('Nanny / House Maid', 'How should perishable food items like milk, cooked meals, and meat be stored?', 'दूध, पका हुआ खाना और मांस जैसी जल्दी खराब होने वाली चीजों को कैसे रखना चाहिए?', '[{"id":"A","en":"Stored inside the refrigerator at the right temperature","hi":"सही तापमान पर फ्रिज के अंदर रखना"},{"id":"B","en":"Left in direct sunlight outside","hi":"बाहर सीधी धूप में छोड़ देना"},{"id":"C","en":"Kept open in a warm room for days","hi":"गर्म कमरे में दिनों तक खुला रखना"},{"id":"D","en":"Stored with cleaning chemicals","hi":"सफाई के केमिकल के साथ रखना"}]'::jsonb, 'A', 9),
  ('Nanny / House Maid', 'What is expected of you regarding the employer’s household privacy and valuables?', 'नियोक्ता के घर की निजता और कीमती सामान के संबंध में आपसे क्या अपेक्षा की जाती है?', '[{"id":"A","en":"Respect family privacy, be honest, and never touch belongings without permission","hi":"परिवार की निजता का सम्मान करना, ईमानदार रहना और बिना अनुमति सामान न छूना"},{"id":"B","en":"Share family photos and details on social media","hi":"सोशल मीडिया पर परिवार की तस्वीरें और जानकारी साझा करना"},{"id":"C","en":"Open private drawers and cupboards","hi":"निजी दराज और अलमारी खोलना"},{"id":"D","en":"Invite strangers into the home without permission","hi":"बिना अनुमति अजनबियों को घर के अंदर बुलाना"}]'::jsonb, 'A', 10);
