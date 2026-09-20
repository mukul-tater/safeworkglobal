-- New UAE trades were added to Find jobs / Quiz CMS, but Test 1 still only
-- had CMS rows for the original 14 skill_codes. Clone those banks so admin
-- sees questions+answers and workers submit UUID quiz items.
-- Also rename the leftover generic "Cleaner" listing to Cleaner (Male).

UPDATE public.jobs
SET
  title = 'Cleaner (Male)',
  description = 'Male cleaner openings for UAE camps, offices, sites and facilities in Dubai. Sweeping, mopping and housekeeping under supervisor instructions.',
  requirements =
    'Physically fit for cleaning work' || chr(10) ||
    'Valid passport (min 2 years)' || chr(10) ||
    'Willing to work in UAE',
  responsibilities =
    'Sweep, mop and keep assigned floors, rooms and common areas clean' || chr(10) ||
    'Empty bins and take waste to the designated collection point' || chr(10) ||
    'Clean toilets, pantries and wash areas with the chemicals provided' || chr(10) ||
    'Follow the daily cleaning checklist and supervisor instructions' || chr(10) ||
    'Report spills, damage and missing supplies promptly' || chr(10) ||
    'Wear PPE and follow site HSE and hygiene rules'
WHERE id = 'a1e10000-2026-4000-8000-000000000020'
   OR slug IN ('uae-listed-cleaner-male', 'cleaner-a1e10000')
   OR (country = 'UAE' AND title = 'Cleaner' AND status = 'ACTIVE');

INSERT INTO public.skill_quiz_configs
  (skill_code, region, questions_to_show, selection_mode, selected_ids, pass_score, active)
SELECT v.skill_code, NULL, 10, 'random_active', '{}'::uuid[], 60, true
FROM (VALUES
  ('MIG Welder'),
  ('TIG Welder'),
  ('Mason (bricks/plaster)'),
  ('Cleaner (Male)'),
  ('Cleaner (Female)')
) AS v(skill_code)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.skill_quiz_configs c
  WHERE c.skill_code = v.skill_code
    AND c.region IS NULL
);

INSERT INTO public.worker_skill_quiz_items (
  skill_code, question, question_hi, youtube_url, image_url,
  expected_answer, sort_order, region, active, options, correct_option
)
SELECT
  m.new_skill,
  i.question,
  i.question_hi,
  i.youtube_url,
  i.image_url,
  i.expected_answer,
  i.sort_order,
  i.region,
  i.active,
  i.options,
  i.correct_option
FROM (
  VALUES
    ('MIG Welder', 'Welder'),
    ('TIG Welder', 'Welder'),
    ('Mason (bricks/plaster)', 'Mason (tiles/marble)'),
    ('Cleaner (Male)', 'Construction Labour/Helper'),
    ('Cleaner (Female)', 'Construction Labour/Helper')
) AS m(new_skill, source_skill)
INNER JOIN public.worker_skill_quiz_items i
  ON i.skill_code = m.source_skill
 AND i.correct_option IS NOT NULL
 AND i.options IS NOT NULL
 AND jsonb_typeof(i.options) = 'array'
 AND jsonb_array_length(i.options) >= 2
WHERE NOT EXISTS (
  SELECT 1
  FROM public.worker_skill_quiz_items x
  WHERE x.skill_code = m.new_skill
    AND x.question = i.question
);
