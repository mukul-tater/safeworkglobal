/** Categories we currently list under UAE on Find jobs / Choose a job. */
export const UAE_LISTED_JOBS = [
  'Electrician',
  'Welder',
  'Plumber',
  'Shuttering Carpenter',
  'Mason (tiles/marble)',
  'Construction Labour/Helper',
  'Pipe Fitter',
  'Carpenter',
  'Steel Fixer',
  'AC Technician',
  'General Labour - Warehouse/Supermarket',
  'Scaffolder',
  'Painter',
  'Aluminium Fixer/Fabricator',
] as const;

export type UaeListedJob = (typeof UAE_LISTED_JOBS)[number];

const MATCHERS: Array<{ job: UaeListedJob; needles: string[] }> = [
  { job: 'Aluminium Fixer/Fabricator', needles: ['aluminium fixer', 'aluminum fixer', 'aluminium fabricator', 'aluminum fabricator', 'glazing fabricator'] },
  { job: 'Shuttering Carpenter', needles: ['shuttering carpenter', 'shuttering', 'formwork carpenter', 's. carpenter'] },
  { job: 'Mason (tiles/marble)', needles: ['mason (tiles/marble)', 'tiles/marble', 'tile mason', 'tile fixer', 'marble mason', 'granite mason', 'marble / granite', 'marble/granite'] },
  { job: 'General Labour - Warehouse/Supermarket', needles: ['warehouse', 'supermarket'] },
  { job: 'Construction Labour/Helper', needles: ['construction labour', 'construction labor', 'construction helper', 'civil helper', 'civil labour', 'civil labor', 'mechanical helper', 'general helper'] },
  { job: 'Pipe Fitter', needles: ['pipe fitter', 'pipefitter'] },
  { job: 'Steel Fixer', needles: ['steel fixer', 'rebar fixer'] },
  { job: 'AC Technician', needles: ['ac technician', 'air conditioning technician', 'air conditioner technician', 'hvac technician'] },
  { job: 'Scaffolder', needles: ['scaffolder', 'scaffolding'] },
  { job: 'Painter', needles: ['painter', 'painting'] },
  { job: 'Carpenter', needles: ['finishing carpenter', 'pop / gypsum', 'pop/gypsum', 'gypsum carpenter', 'pop carpenter', 'carpenter'] },
  { job: 'Electrician', needles: ['electrician', 'electrical'] },
  { job: 'Plumber', needles: ['plumber', 'plumbing'] },
  { job: 'Welder', needles: ['welder', 'welding'] },
  { job: 'Mason (tiles/marble)', needles: ['mason'] },
  { job: 'Construction Labour/Helper', needles: ['helper', 'labour', 'labor'] },
];

/** Map a job title/description onto the UAE listed trades. Exact title, then specific needles. */
export function inferUaeListedJob(title: string, description = ''): UaeListedJob | null {
  const titleLower = title.toLowerCase().trim();
  const exact = UAE_LISTED_JOBS.find((job) => job.toLowerCase() === titleLower);
  if (exact) return exact;

  const titleMatch = MATCHERS.find(({ needles }) =>
    needles.some((needle) => titleLower.includes(needle)),
  );
  if (titleMatch) return titleMatch.job;

  const haystack = `${title} ${description}`.toLowerCase();
  const match = MATCHERS.find(({ needles }) => needles.some((needle) => haystack.includes(needle)));
  return match?.job ?? null;
}

/** 1 AED ≈ ₹23 — same band as jobSalaryUtils. Flyer grades are Grade C (min) to Grade A (max). */
const AED_TO_INR = 23;

function inrFromAedGrade(minAed: number, maxAed: number): {
  salary_min: number;
  salary_max: number;
  salary_display: string;
} {
  const roundThousand = (aed: number) => Math.round((aed * AED_TO_INR) / 1000) * 1000;
  const salary_min = roundThousand(minAed);
  const salary_max = roundThousand(maxAed);
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return {
    salary_min,
    salary_max,
    salary_display: salary_min === salary_max ? fmt(salary_min) : `${fmt(salary_min)} – ${fmt(salary_max)}`,
  };
}

const WELDER_BAND = inrFromAedGrade(1512, 1712);
const INDUSTRIAL_ELECTRICIAN_BAND = inrFromAedGrade(1360, 1610);
const FINISHING_CARPENTER_BAND = inrFromAedGrade(1412, 1662);
const MASON_BAND = inrFromAedGrade(1360, 1560);
const SHUTTERING_BAND = inrFromAedGrade(1412, 1612);
const PLUMBER_BAND = inrFromAedGrade(1360, 1560);
const AC_BAND = inrFromAedGrade(1360, 1460);
const HELPER_BAND = inrFromAedGrade(1158, 1208);

/** Monthly INR from the Dubai interview-drive Grade C–A AED table. */
export const UAE_LISTED_JOB_SALARIES: Record<UaeListedJob, ReturnType<typeof inrFromAedGrade>> = {
  Welder: WELDER_BAND,
  'Aluminium Fixer/Fabricator': WELDER_BAND,
  Electrician: INDUSTRIAL_ELECTRICIAN_BAND,
  'Shuttering Carpenter': SHUTTERING_BAND,
  Carpenter: FINISHING_CARPENTER_BAND,
  'Mason (tiles/marble)': MASON_BAND,
  'Steel Fixer': MASON_BAND,
  Plumber: PLUMBER_BAND,
  'Pipe Fitter': PLUMBER_BAND,
  'AC Technician': AC_BAND,
  Painter: MASON_BAND,
  Scaffolder: SHUTTERING_BAND,
  'Construction Labour/Helper': HELPER_BAND,
  'General Labour - Warehouse/Supermarket': HELPER_BAND,
};

export function getPublicJobSalary(title: string, description = '') {
  const listed = inferUaeListedJob(title, description);
  return listed ? UAE_LISTED_JOB_SALARIES[listed] : null;
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
  Welder: [
    'Perform ARC, MIG and/or TIG welding as per WPS and drawings',
    'Fit, tack and weld structural steel, plates, pipes or supports',
    'Grind, clean and prepare joints; carry out visual quality checks',
    'Read fabrication drawings and mark cutting lists',
    'Use PPE, screens and fire watch for hot work',
    'Report defects and complete rework as directed',
  ],
  Plumber: [
    'Install PVC, CPVC, PPR and GI pipes for water supply and drainage',
    'Fit sanitary ware, taps, floor traps and bathroom accessories',
    'Pressure-test supply lines and leak-test drainage stacks',
    'Chase walls, set levels and connect to existing risers as per drawings',
    'Clear blockages and close punch-list items before handover',
    'Follow plumbing drawings and site HSE rules',
  ],
  'Shuttering Carpenter': [
    'Erect, align and strike timber, plywood or system formwork',
    'Set shuttering to line, level and plumb from drawings',
    'Install props, walers, ties and working platforms safely',
    'Coordinate pour sequence with civil and steel-fixer teams',
    'Dismantle formwork without damaging concrete',
    'Follow working-at-height and site HSE rules',
  ],
  'Mason (tiles/marble)': [
    'Set out floor and wall tiles, marble and stone from drawings and datum lines',
    'Prepare substrate, mix adhesive and bed tiles or stone to line and level',
    'Cut tiles and stone around openings, edges and sanitary fittings',
    'Grout joints, polish stone and complete movement joints as specified',
    'Fix skirting, dado, wet-area tiles and marble / granite cladding',
    'Keep the work area clean and follow HSE',
  ],
  'Construction Labour/Helper': [
    'Assist masons, carpenters, steel fixers and other skilled trades',
    'Shift blocks, cement, tools and materials as directed',
    'Mix mortar or concrete and keep the work area tidy',
    'Help with shuttering, curing and simple site tasks',
    'Follow supervisor instructions and site safety rules',
    'Wear PPE at all times on site',
  ],
  'Pipe Fitter': [
    'Read isometrics and piping drawings for routing and supports',
    'Cut, bevel, fit and align CS/GI/SS pipes and fittings',
    'Install flanges, gaskets, valves and pipe supports',
    'Assist hydrotest / leak test and punch-list close-out',
    'Coordinate with welders and riggers for spool installation',
    'Follow HSE, hot-work and quality procedures',
  ],
  Carpenter: [
    'Cut, fit and fix timber for frames, doors, joinery and site carpentry',
    'Read drawings and mark out work to line, level and plumb',
    'Install wooden fixtures, supports and finishing items as directed',
    'Use hand and power tools safely; keep a tidy work area',
    'Coordinate with civil, finishing and MEP teams',
    'Follow site HSE and working-at-height rules',
  ],
  'Steel Fixer': [
    'Read bar-bending schedules and rebar drawings',
    'Cut, bend, place and tie reinforcement for slabs, beams, columns and walls',
    'Maintain cover, laps, chairs and spacers as specified',
    'Fix starter bars, couplers and extra steel at openings',
    'Coordinate pour sequence with shuttering and civil teams',
    'Follow working-at-height, lifting and site HSE rules',
  ],
  'AC Technician': [
    'Install, service and repair split, window and package AC units',
    'Run copper piping, drain lines and indoor/outdoor connections',
    'Vacuum, charge and leak-test refrigerant circuits',
    'Diagnose cooling faults and replace filters, capacitors and fans',
    'Keep plant rooms and work areas clean',
    'Follow electrical isolation and site HSE rules',
  ],
  'General Labour - Warehouse/Supermarket': [
    'Load, unload and shift goods in warehouses, stores and supermarket back-of-house',
    'Pick, pack, stack and replenish stock as directed',
    'Keep aisles, docks and storage areas clean and clear',
    'Help with receiving, put-away and simple inventory counts',
    'Follow supervisor instructions and warehouse / store safety rules',
    'Wear PPE at all times on site',
  ],
  Scaffolder: [
    'Erect, alter and dismantle tube-and-coupler or system scaffold',
    'Set base plates, standards, ledgers, braces, platforms and ties',
    'Install guardrails, toe boards, ladders and working platforms',
    'Inspect components and tag incomplete or unsafe scaffold',
    'Follow working-at-height, lifting and site HSE rules',
    'Coordinate with civil and finishing trades for access',
  ],
  Painter: [
    'Prepare surfaces: filling, sanding, priming and masking',
    'Apply emulsion, enamel and texture paint to walls, ceilings and steel',
    'Spray or roll to an even finish as per the specification',
    'Protect adjacent finishes and clean up after each area',
    'Touch up snags before handover',
    'Follow site HSE including working-at-height and solvent controls',
  ],
  'Aluminium Fixer/Fabricator': [
    'Read fabrication drawings and mark cutting lists for aluminium sections',
    'Cut, mill, drill and assemble aluminium frames, cladding and joinery',
    'Fit, tack and weld or mechanically join aluminium components',
    'Install windows, doors, curtain-wall and shop-front frames as directed',
    'File, grind and prepare surfaces for powder coat or anodising',
    'Follow workshop and site HSE, including hot-work controls',
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

/** YouTube clips showing how each listed trade works on a construction site. */
export const UAE_LISTED_JOB_VIDEOS: Record<UaeListedJob, { youtubeId: string; caption: string }> = {
  Electrician: {
    youtubeId: 'R-e2OCC8i6c',
    caption: 'How electrician work is done — cable tray and site electrical installation.',
  },
  Welder: {
    youtubeId: 'N4Vn1QbS1Nk',
    caption: 'How welder work is done — stick (ARC) welding used on construction and fabrication.',
  },
  Plumber: {
    youtubeId: '49x3n08ZcvI',
    caption: 'How plumber work is done — PVC / CPVC pipe fitting like on UAE sites.',
  },
  'Shuttering Carpenter': {
    youtubeId: 'JAhCaIqtflM',
    caption: 'How shuttering carpenter work is done — formwork erection and striking.',
  },
  'Mason (tiles/marble)': {
    youtubeId: 'UawZD4KHS3k',
    caption: 'How mason (tiles/marble) work is done — wall and floor tiling and stone setting.',
  },
  'Construction Labour/Helper': {
    youtubeId: 'o2kiA5ItiJw',
    caption: 'How construction labour / helper work is done — supporting skilled trades on a live site.',
  },
  'Pipe Fitter': {
    youtubeId: 'KIZurpeGMoM',
    caption: 'How pipe fitter work is done — fitting, aligning and tacking pipes on site.',
  },
  Carpenter: {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How carpenter work is done — cutting, fitting and fixing timber on site.',
  },
  'Steel Fixer': {
    youtubeId: 'NT2IeAdO7eg',
    caption: 'How steel fixer work is done — cutting, placing and tying reinforcement.',
  },
  'AC Technician': {
    youtubeId: 'sRy3zy84hwg',
    caption: 'How AC technician work is done — installing and servicing air-conditioning units.',
  },
  'General Labour - Warehouse/Supermarket': {
    youtubeId: 'e8RgNqmSh2c',
    caption: 'How general labour work is done — materials handling, stacking and warehouse support.',
  },
  Scaffolder: {
    youtubeId: 'veF4uSUtrEY',
    caption: 'How scaffolder work is done — erecting platforms, ties and guardrails.',
  },
  Painter: {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How painter work is done — surface preparation and finishing on interiors.',
  },
  'Aluminium Fixer/Fabricator': {
    youtubeId: 'ovEDLzbAWpg',
    caption: 'How aluminium fixer / fabricator work is done — cutting, fitting and joining metal sections.',
  },
};

export function getPublicJobVideo(title: string, description = '') {
  const listed = inferUaeListedJob(title, description);
  return listed ? UAE_LISTED_JOB_VIDEOS[listed] : null;
}
