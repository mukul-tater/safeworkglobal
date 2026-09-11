/** Jobs Mukul asked to keep listed under UAE on Find jobs. */
export const UAE_LISTED_JOBS = [
  'Electrician',
  'Plumber',
  'Welder',
  'Shuttering Carpenter',
  'Mason',
  'Civil Helper',
  'Civil Labour',
  'Pipe Fitter',
] as const;

export type UaeListedJob = (typeof UAE_LISTED_JOBS)[number];

const MATCHERS: Array<{ job: UaeListedJob; needles: string[] }> = [
  { job: 'Shuttering Carpenter', needles: ['shuttering carpenter', 'shuttering', 'formwork carpenter'] },
  { job: 'Civil Helper', needles: ['civil helper'] },
  { job: 'Civil Labour', needles: ['civil labour', 'civil labor', 'civil labourer'] },
  { job: 'Pipe Fitter', needles: ['pipe fitter', 'pipefitter'] },
  { job: 'Electrician', needles: ['electrician', 'electrical'] },
  { job: 'Plumber', needles: ['plumber', 'plumbing'] },
  { job: 'Welder', needles: ['welder', 'welding'] },
  { job: 'Mason', needles: ['mason'] },
];

/** Map a job title/description onto the UAE listed trades. Longest/most specific first. */
export function inferUaeListedJob(title: string, description = ''): UaeListedJob | null {
  const haystack = `${title} ${description}`.toLowerCase();
  const match = MATCHERS.find(({ needles }) => needles.some((needle) => haystack.includes(needle)));
  return match?.job ?? null;
}

/** Role-specific duties shown on public job pages. */
export const UAE_LISTED_JOB_RESPONSIBILITIES: Record<UaeListedJob, string[]> = {
  Electrician: [
    'Read electrical drawings, single-line diagrams and site layouts',
    'Install, terminate and test LV wiring, DBs, MCB/RCCB and lighting circuits',
    'Carry out fault finding on power, lighting and equipment circuits',
    'Follow LOTO, permit-to-work and UAE HSE procedures',
    'Coordinate first-fix and second-fix with civil and finishing teams',
    'Maintain tools, report daily progress and raise material requests',
  ],
  Plumber: [
    'Install PVC, CPVC, PPR and GI pipes for water supply and drainage',
    'Fit sanitary ware, taps, floor traps and bathroom accessories',
    'Pressure-test supply lines and leak-test drainage stacks',
    'Chase walls, set levels and connect to existing risers as per drawings',
    'Clear blockages and close punch-list items before handover',
    'Follow plumbing drawings and site HSE rules',
  ],
  Welder: [
    'Perform ARC, MIG and/or TIG welding as per WPS and drawings',
    'Fit, tack and weld structural steel, plates, pipes or supports',
    'Grind, clean and prepare joints; carry out visual quality checks',
    'Read fabrication drawings and mark cutting lists',
    'Use PPE, screens and fire watch for hot work',
    'Report defects and complete rework as directed',
  ],
  'Shuttering Carpenter': [
    'Erect, align and strike timber, plywood or system formwork',
    'Set shuttering to line, level and plumb from drawings',
    'Install props, walers, ties and working platforms safely',
    'Coordinate pour sequence with civil and steel-fixer teams',
    'Dismantle formwork without damaging concrete',
    'Follow working-at-height and site HSE rules',
  ],
  Mason: [
    'Lay blocks and bricks to line, level and plumb',
    'Mix mortar to the specified ratio and finish joints',
    'Build walls, columns, partitions and openings as marked out',
    'Support plastering, chasing and lintel installation',
    'Maintain workmanship quality against setting-out marks',
    'Keep the work area clean and follow HSE',
  ],
  'Civil Helper': [
    'Assist masons, carpenters, steel fixers and other skilled trades',
    'Shift blocks, cement, tools and materials as directed',
    'Mix mortar or concrete and keep the work area tidy',
    'Help with shuttering, curing and simple site tasks',
    'Follow supervisor instructions and site safety rules',
    'Wear PPE at all times on site',
  ],
  'Civil Labour': [
    'Carry out general civil labour as directed by the supervisor',
    'Support concreting, excavation, backfilling and curing',
    'Load, unload and shift materials around the site',
    'Clear debris, keep access routes open and wet-cure slabs',
    'Assist skilled trades with tools and housekeeping',
    'Follow HSE and permit-to-work instructions',
  ],
  'Pipe Fitter': [
    'Read isometrics and piping drawings for routing and supports',
    'Cut, bevel, fit and align CS/GI/SS pipes and fittings',
    'Install flanges, gaskets, valves and pipe supports',
    'Assist hydrotest / leak test and punch-list close-out',
    'Coordinate with welders and riggers for spool installation',
    'Follow HSE, hot-work and quality procedures',
  ],
};

export function listPublicJobResponsibilities(
  title: string,
  stored?: string | null,
  description = '',
): string[] {
  const listed = inferUaeListedJob(title, description);
  if (listed) return UAE_LISTED_JOB_RESPONSIBILITIES[listed];
  if (!stored?.trim()) return [];
  return stored
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
