-- Rename the UAE warehouse listing from "General Labour - Warehouse/Supermarket"
-- to "Warehouse Helper" (drop supermarket from the public job name).

UPDATE public.trades
SET name = 'Warehouse Helper'
WHERE code = 'warehouse_supermarket_labour'
   OR name = 'General Labour - Warehouse/Supermarket';

UPDATE public.jobs
SET
  title = 'Warehouse Helper',
  description = 'Warehouse helper openings for UAE warehouses and stores in Dubai. Loading, stacking, replenishment and housekeeping.',
  requirements =
    'Physically fit for warehouse work' || chr(10) ||
    'Valid passport (min 2 years)' || chr(10) ||
    'Willing to work in UAE',
  responsibilities =
    'Load, unload and shift goods in warehouses and stores' || chr(10) ||
    'Pick, pack, stack and replenish stock as directed' || chr(10) ||
    'Keep aisles, docks and storage areas clean and clear' || chr(10) ||
    'Help with receiving, put-away and simple inventory counts' || chr(10) ||
    'Follow supervisor instructions and warehouse safety rules' || chr(10) ||
    'Wear PPE at all times on site'
WHERE slug = 'uae-listed-warehouse-labour'
   OR id = 'a1e10000-2026-4000-8000-00000000001e'
   OR title = 'General Labour - Warehouse/Supermarket';

UPDATE public.worker_skill_quiz_items
SET skill_code = 'Warehouse Helper'
WHERE skill_code = 'General Labour - Warehouse/Supermarket';

UPDATE public.skill_quiz_configs
SET skill_code = 'Warehouse Helper'
WHERE skill_code = 'General Labour - Warehouse/Supermarket';
