-- Seed Test 1 quiz items with YouTube + images for all worker skill categories.
-- Run in Supabase SQL Editor (project etpiadoqryvtlpmiuxia).
-- Safe to re-run: clears existing quiz items/responses then re-inserts.

BEGIN;

-- Responses reference quiz items — clear first
DELETE FROM public.worker_skill_quiz_responses;
DELETE FROM public.worker_skill_quiz_items;

INSERT INTO public.worker_skill_quiz_items
  (skill_code, question, youtube_url, image_url, expected_answer, sort_order, active)
VALUES
-- ===== Electrician =====
(
  'Electrician',
  'Have you done basic house / single-phase wiring work like this?',
  'https://www.youtube.com/watch?v=whAvCfrlhZ4',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Electrician',
  'Should you isolate / lock power before opening a live junction box?',
  'https://www.youtube.com/watch?v=ejx286HDsNI',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Electrician',
  'Is it OK to leave damaged insulation tape as a permanent fix on live wires?',
  'https://www.youtube.com/watch?v=DBTtPDGyufs',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Electrician',
  'Can you use a digital multimeter to check voltage like in this example?',
  'https://www.youtube.com/watch?v=6idXlgNYkpk',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Plumber =====
(
  'Plumber',
  'Have you installed PVC / CPVC pipe fittings like this?',
  'https://www.youtube.com/watch?v=49x3n08ZcvI',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Plumber',
  'Should you shut off the water supply before changing a faucet or valve?',
  'https://www.youtube.com/watch?v=x4eKmNxF6l8',
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Plumber',
  'Is it fine to leave a pipe joint leaking if the pressure feels low?',
  'https://www.youtube.com/watch?v=49x3n08ZcvI',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Plumber',
  'Do you know how to cut and join PVC pipe for drainage / supply lines?',
  'https://www.youtube.com/watch?v=49x3n08ZcvI',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Welder =====
(
  'Welder',
  'Have you used an arc / stick (MMA/SMAW) welding machine before?',
  'https://www.youtube.com/watch?v=Px1LQhc4nEc',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Welder',
  'Must you wear a welding helmet and gloves while striking an arc?',
  'https://www.youtube.com/watch?v=0ZH0NHaettE',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Welder',
  'Is it safe to weld without checking cables / connections first?',
  'https://www.youtube.com/watch?v=q8xaOsbM1FQ',
  'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Welder',
  'Can you strike an arc and lay a basic bead like in this demo?',
  'https://www.youtube.com/watch?v=KHDDtFgF2YU',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Driver =====
(
  'Driver',
  'Have you driven heavy vehicles / trucks as shown in this type of work?',
  'https://www.youtube.com/watch?v=4HZbW-BN_gc',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Driver',
  'Should you always inspect brakes, lights and tyres before a long trip?',
  'https://www.youtube.com/watch?v=N4vhohgoMAQ',
  'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Driver',
  'Is it OK to drive when you feel drowsy if the road looks empty?',
  'https://www.youtube.com/watch?v=4HZbW-BN_gc',
  'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Driver',
  'Do you have a valid licence suitable for the vehicle class you drive?',
  'https://www.youtube.com/watch?v=N4vhohgoMAQ',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Mason =====
(
  'Mason',
  'Have you laid bricks / blocks with mortar like this?',
  'https://www.youtube.com/watch?v=D094nZf6ikk',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Mason',
  'Do you know the common hand tools used for bricklaying?',
  'https://www.youtube.com/watch?v=NAfAEbU7dNE',
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Mason',
  'Is it OK to build a wall without checking level and plumb?',
  'https://www.youtube.com/watch?v=HFGLfhP6AVk',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Mason',
  'Have you mixed cement / mortar for masonry work on site?',
  'https://www.youtube.com/watch?v=D094nZf6ikk',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Carpenter =====
(
  'Carpenter',
  'Have you done basic carpentry / woodwork like measuring and cutting timber?',
  'https://www.youtube.com/watch?v=MNQcunoK4y8',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Carpenter',
  'Do you recognise common woodworking hand / power tools?',
  'https://www.youtube.com/watch?v=jDhFfTc2bvU',
  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Carpenter',
  'Is it safe to use a circular saw without eye and hand protection?',
  'https://www.youtube.com/watch?v=MNQcunoK4y8',
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Carpenter',
  'Can you make a reliable corner / joint as shown in carpentry demos?',
  'https://www.youtube.com/watch?v=uJh0jd6wxhY',
  'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Helper =====
(
  'Helper',
  'Have you worked as a site helper supporting skilled trades?',
  'https://www.youtube.com/watch?v=o2kiA5ItiJw',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Helper',
  'Should you wear a helmet / PPE on an active construction site?',
  'https://www.youtube.com/watch?v=74d6heVzQCo',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Helper',
  'Is it OK to stand under a suspended load while materials are lifted?',
  'https://www.youtube.com/watch?v=ODmL-oOhV9o',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'Helper',
  'Are you ready to follow supervisor instructions and site safety rules?',
  'https://www.youtube.com/watch?v=o2kiA5ItiJw',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== HVAC Technician =====
(
  'HVAC Technician',
  'Have you worked on air-conditioning / HVAC units like this?',
  'https://www.youtube.com/watch?v=WiHRP7ilcBg',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'HVAC Technician',
  'Should refrigerant lines and electrical supply be handled only with proper training?',
  'https://www.youtube.com/watch?v=YEXJqcRiQIE',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'HVAC Technician',
  'Is it safe to open a live outdoor AC unit without isolating power?',
  'https://www.youtube.com/watch?v=Oq6yrSBVVp4',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
  false, 3, true
),
(
  'HVAC Technician',
  'Can you identify basic AC outdoor / indoor unit components on site?',
  'https://www.youtube.com/watch?v=WiHRP7ilcBg',
  'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=900&q=80',
  true, 4, true
),

-- ===== Other =====
(
  'Other',
  'Are you ready to relocate abroad for verified skilled work if selected?',
  'https://www.youtube.com/watch?v=o2kiA5ItiJw',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
  true, 1, true
),
(
  'Other',
  'Do you understand SafeWork does not allow unauthorized agent fees?',
  'https://www.youtube.com/watch?v=74d6heVzQCo',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
  true, 2, true
),
(
  'Other',
  'Will you share only truthful work experience and documents on your profile?',
  'https://www.youtube.com/watch?v=ODmL-oOhV9o',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
  true, 3, true
),
(
  'Other',
  'Are you medically fit and willing to complete skill checks for GCC placement?',
  'https://www.youtube.com/watch?v=o2kiA5ItiJw',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
  true, 4, true
);

COMMIT;

-- Confirm counts per skill
SELECT skill_code, count(*) AS questions,
       count(youtube_url) AS with_youtube,
       count(image_url) AS with_image
FROM public.worker_skill_quiz_items
GROUP BY skill_code
ORDER BY skill_code;

NOTIFY pgrst, 'reload schema';
