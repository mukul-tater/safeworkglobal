-- Convert listed UAE jobs to INR salaries and role-specific responsibilities.
-- UI also maps these by job title, so workers see the new copy even before this runs.

UPDATE public.jobs AS j
SET
  salary_min = s.salary_min,
  salary_max = s.salary_max,
  currency = 'INR',
  salary_display = s.salary_display,
  responsibilities = s.responsibilities
FROM (
  VALUES
    (
      'uae-listed-electrician',
      41000,
      58000,
      '₹41,000 – ₹58,000',
      'Read electrical drawings, single-line diagrams and site layouts' || chr(10) ||
      'Install, terminate and test LV wiring, DBs, MCB/RCCB and lighting circuits' || chr(10) ||
      'Carry out fault finding on power, lighting and equipment circuits' || chr(10) ||
      'Follow LOTO, permit-to-work and UAE HSE procedures' || chr(10) ||
      'Coordinate first-fix and second-fix with civil and finishing teams' || chr(10) ||
      'Maintain tools, report daily progress and raise material requests'
    ),
    (
      'uae-listed-plumber',
      37000,
      51000,
      '₹37,000 – ₹51,000',
      'Install PVC, CPVC, PPR and GI pipes for water supply and drainage' || chr(10) ||
      'Fit sanitary ware, taps, floor traps and bathroom accessories' || chr(10) ||
      'Pressure-test supply lines and leak-test drainage stacks' || chr(10) ||
      'Chase walls, set levels and connect to existing risers as per drawings' || chr(10) ||
      'Clear blockages and close punch-list items before handover' || chr(10) ||
      'Follow plumbing drawings and site HSE rules'
    ),
    (
      'uae-listed-welder',
      41000,
      64000,
      '₹41,000 – ₹64,000',
      'Perform ARC, MIG and/or TIG welding as per WPS and drawings' || chr(10) ||
      'Fit, tack and weld structural steel, plates, pipes or supports' || chr(10) ||
      'Grind, clean and prepare joints; carry out visual quality checks' || chr(10) ||
      'Read fabrication drawings and mark cutting lists' || chr(10) ||
      'Use PPE, screens and fire watch for hot work' || chr(10) ||
      'Report defects and complete rework as directed'
    ),
    (
      'uae-listed-shuttering-carpenter',
      35000,
      51000,
      '₹35,000 – ₹51,000',
      'Erect, align and strike timber, plywood or system formwork' || chr(10) ||
      'Set shuttering to line, level and plumb from drawings' || chr(10) ||
      'Install props, walers, ties and working platforms safely' || chr(10) ||
      'Coordinate pour sequence with civil and steel-fixer teams' || chr(10) ||
      'Dismantle formwork without damaging concrete' || chr(10) ||
      'Follow working-at-height and site HSE rules'
    ),
    (
      'uae-listed-mason',
      35000,
      51000,
      '₹35,000 – ₹51,000',
      'Lay blocks and bricks to line, level and plumb' || chr(10) ||
      'Mix mortar to the specified ratio and finish joints' || chr(10) ||
      'Build walls, columns, partitions and openings as marked out' || chr(10) ||
      'Support plastering, chasing and lintel installation' || chr(10) ||
      'Maintain workmanship quality against setting-out marks' || chr(10) ||
      'Keep the work area clean and follow HSE'
    ),
    (
      'uae-listed-civil-helper',
      28000,
      37000,
      '₹28,000 – ₹37,000',
      'Assist masons, carpenters, steel fixers and other skilled trades' || chr(10) ||
      'Shift blocks, cement, tools and materials as directed' || chr(10) ||
      'Mix mortar or concrete and keep the work area tidy' || chr(10) ||
      'Help with shuttering, curing and simple site tasks' || chr(10) ||
      'Follow supervisor instructions and site safety rules' || chr(10) ||
      'Wear PPE at all times on site'
    ),
    (
      'uae-listed-civil-labour',
      25000,
      35000,
      '₹25,000 – ₹35,000',
      'Carry out general civil labour as directed by the supervisor' || chr(10) ||
      'Support concreting, excavation, backfilling and curing' || chr(10) ||
      'Load, unload and shift materials around the site' || chr(10) ||
      'Clear debris, keep access routes open and wet-cure slabs' || chr(10) ||
      'Assist skilled trades with tools and housekeeping' || chr(10) ||
      'Follow HSE and permit-to-work instructions'
    ),
    (
      'uae-listed-pipe-fitter',
      41000,
      58000,
      '₹41,000 – ₹58,000',
      'Read isometrics and piping drawings for routing and supports' || chr(10) ||
      'Cut, bevel, fit and align CS/GI/SS pipes and fittings' || chr(10) ||
      'Install flanges, gaskets, valves and pipe supports' || chr(10) ||
      'Assist hydrotest / leak test and punch-list close-out' || chr(10) ||
      'Coordinate with welders and riggers for spool installation' || chr(10) ||
      'Follow HSE, hot-work and quality procedures'
    )
) AS s(slug, salary_min, salary_max, salary_display, responsibilities)
WHERE j.slug = s.slug;
