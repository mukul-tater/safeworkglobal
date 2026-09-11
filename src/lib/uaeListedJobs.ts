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
  'MIG Welder',
  'TIG Welder',
  'Aluminium Fabricator',
  'Industrial Electrician',
  'Finishing Carpenter',
  'Tile Mason',
  'All Round Mason',
  'Block & Plaster Mason',
  'Steel Fixer',
  'Ductman',
  'Mechanical Helper',
  'General Helper',
  'Carpenter',
  'HVAC Technician',
  'AC Technician',
  'Fire Fighting Technician',
  'Painter',
  'Scaffolder',
  'POP / Gypsum Carpenter',
  'Waterproofing Mason',
  'Marble / Granite Mason',
] as const;

export type UaeListedJob = (typeof UAE_LISTED_JOBS)[number];

const MATCHERS: Array<{ job: UaeListedJob; needles: string[] }> = [
  { job: 'Industrial Electrician', needles: ['industrial electrician'] },
  { job: 'MIG Welder', needles: ['mig welder'] },
  { job: 'TIG Welder', needles: ['tig welder'] },
  { job: 'Aluminium Fabricator', needles: ['aluminium fabricator', 'aluminum fabricator'] },
  { job: 'POP / Gypsum Carpenter', needles: ['pop / gypsum', 'pop/gypsum', 'gypsum carpenter', 'pop carpenter', 'false ceiling'] },
  { job: 'Finishing Carpenter', needles: ['finishing carpenter', 'finish carpenter'] },
  { job: 'Tile Mason', needles: ['tile mason', 'tile fixer'] },
  { job: 'All Round Mason', needles: ['all round mason', 'all-round mason', 'allround mason'] },
  { job: 'Block & Plaster Mason', needles: ['block & plaster mason', 'block and plaster mason', 'block plaster mason'] },
  { job: 'Waterproofing Mason', needles: ['waterproofing mason', 'waterproofing'] },
  { job: 'Marble / Granite Mason', needles: ['marble / granite', 'marble/granite', 'marble mason', 'granite mason'] },
  { job: 'Steel Fixer', needles: ['steel fixer', 'rebar fixer'] },
  { job: 'Shuttering Carpenter', needles: ['shuttering carpenter', 'shuttering', 'formwork carpenter'] },
  { job: 'Carpenter', needles: ['carpenter'] },
  { job: 'HVAC Technician', needles: ['hvac technician'] },
  { job: 'AC Technician', needles: ['ac technician', 'air conditioning technician', 'air conditioner technician'] },
  { job: 'Fire Fighting Technician', needles: ['fire fighting technician', 'firefighting technician', 'fire fighting'] },
  { job: 'Painter', needles: ['painter', 'painting'] },
  { job: 'Scaffolder', needles: ['scaffolder', 'scaffolding'] },
  { job: 'Mechanical Helper', needles: ['mechanical helper'] },
  { job: 'General Helper', needles: ['general helper'] },
  { job: 'Ductman', needles: ['ductman', 'duct man', 'duct installer'] },
  { job: 'Civil Helper', needles: ['civil helper'] },
  { job: 'Civil Labour', needles: ['civil labour', 'civil labor', 'civil labourer'] },
  { job: 'Pipe Fitter', needles: ['pipe fitter', 'pipefitter'] },
  { job: 'Electrician', needles: ['electrician', 'electrical'] },
  { job: 'Plumber', needles: ['plumber', 'plumbing'] },
  { job: 'Welder', needles: ['welder', 'welding'] },
  { job: 'Mason', needles: ['mason'] },
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
const DUCTMAN_BAND = inrFromAedGrade(1360, 1460);
const MECHANICAL_HELPER_BAND = inrFromAedGrade(1158, 1208);
const GENERAL_HELPER_BAND = inrFromAedGrade(1158, 1158);

/** Monthly INR from the Dubai interview-drive Grade C–A AED table. */
export const UAE_LISTED_JOB_SALARIES: Record<UaeListedJob, ReturnType<typeof inrFromAedGrade>> = {
  'MIG Welder': WELDER_BAND,
  'TIG Welder': WELDER_BAND,
  Welder: WELDER_BAND,
  'Aluminium Fabricator': WELDER_BAND,
  'Industrial Electrician': INDUSTRIAL_ELECTRICIAN_BAND,
  Electrician: INDUSTRIAL_ELECTRICIAN_BAND,
  'Finishing Carpenter': FINISHING_CARPENTER_BAND,
  'Shuttering Carpenter': SHUTTERING_BAND,
  'Tile Mason': MASON_BAND,
  'All Round Mason': MASON_BAND,
  'Block & Plaster Mason': MASON_BAND,
  'Steel Fixer': MASON_BAND,
  Mason: MASON_BAND,
  Plumber: PLUMBER_BAND,
  'Pipe Fitter': PLUMBER_BAND,
  Ductman: DUCTMAN_BAND,
  'Mechanical Helper': MECHANICAL_HELPER_BAND,
  'Civil Helper': MECHANICAL_HELPER_BAND,
  'General Helper': GENERAL_HELPER_BAND,
  'Civil Labour': GENERAL_HELPER_BAND,
  Carpenter: FINISHING_CARPENTER_BAND,
  'HVAC Technician': INDUSTRIAL_ELECTRICIAN_BAND,
  'AC Technician': DUCTMAN_BAND,
  'Fire Fighting Technician': INDUSTRIAL_ELECTRICIAN_BAND,
  Painter: MASON_BAND,
  Scaffolder: SHUTTERING_BAND,
  'POP / Gypsum Carpenter': FINISHING_CARPENTER_BAND,
  'Waterproofing Mason': MASON_BAND,
  'Marble / Granite Mason': MASON_BAND,
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
  'MIG Welder': [
    'Set up MIG / MAG plant, wire, gas and parameters as per WPS',
    'MIG-weld structural steel, plates, ducts and fabrication spools',
    'Fit, tack and weld joints to drawings; grind and clean between passes',
    'Carry out visual checks for undercut, porosity and incomplete fusion',
    'Use screens, fire watch and PPE for hot work',
    'Report defects and complete rework as directed',
  ],
  'TIG Welder': [
    'Set up TIG plant, tungsten, filler and argon as per WPS',
    'TIG-weld stainless, aluminium or carbon-steel pipe and sheet',
    'Run root and fill passes on pipe, tanks and precision joints',
    'Keep the purge and gas shield; inspect for oxidation and undercut',
    'Read isometric and fabrication drawings',
    'Follow hot-work, PPE and UAE HSE procedures',
  ],
  'Aluminium Fabricator': [
    'Read fabrication drawings and mark cutting lists for aluminium sections',
    'Cut, mill, drill and assemble aluminium frames, cladding and joinery',
    'Fit, tack and weld or mechanically join aluminium components',
    'Install windows, doors, curtain-wall and shop-front frames as directed',
    'File, grind and prepare surfaces for powder coat or anodising',
    'Follow workshop and site HSE, including hot-work controls',
  ],
  'Industrial Electrician': [
    'Install, terminate and test industrial LV/MV power, motors and control circuits',
    'Read SLDs, control schematics and equipment GA drawings',
    'Wire MCCs, VFDs, field instruments and plant lighting',
    'Carry out fault finding on motors, starters and process equipment',
    'Follow LOTO, permit-to-work and plant HSE procedures',
    'Coordinate shutdowns, megger tests and punch-list close-out',
  ],
  'Finishing Carpenter': [
    'Install doors, frames, architraves, skirting and wooden joinery',
    'Set cabinets, wardrobes, panelling and false-ceiling timber as per drawings',
    'Cut, fit and finish timber to line, level and consistent gaps',
    'Hang ironmongery, locks and door closers; adjust for smooth operation',
    'Protect finished surfaces and close snag lists before handover',
    'Follow site HSE and working-at-height rules',
  ],
  'Tile Mason': [
    'Set out floor and wall tiles from drawings, levels and datum lines',
    'Prepare substrate, mix adhesive and bed tiles to line and level',
    'Cut tiles around openings, edges and sanitary fittings',
    'Grout joints, clean tiles and complete movement joints as specified',
    'Fix skirting, dado and wet-area tiles to the required fall',
    'Keep the work area clean and follow HSE',
  ],
  'All Round Mason': [
    'Carry out block work, plastering, tiling and finishing as directed',
    'Lay blocks and bricks to line, level and plumb',
    'Apply internal and external plaster to the specified thickness',
    'Support tiling, chasing, lintels and small concrete repairs',
    'Mix mortar to the specified ratio and maintain workmanship quality',
    'Follow supervisor instructions and site HSE',
  ],
  'Block & Plaster Mason': [
    'Lay AAC / concrete blocks to line, level and plumb',
    'Build walls, columns, partitions and openings as marked out',
    'Apply scratch and finish plaster coats to walls and soffits',
    'Mix mortar and plaster to the specified ratio',
    'Install lintels, mesh and corner beads as required',
    'Keep joints, corners and surfaces within tolerance and follow HSE',
  ],
  'Steel Fixer': [
    'Read bar-bending schedules and rebar drawings',
    'Cut, bend, place and tie reinforcement for slabs, beams, columns and walls',
    'Maintain cover, laps, chairs and spacers as specified',
    'Fix starter bars, couplers and extra steel at openings',
    'Coordinate pour sequence with shuttering and civil teams',
    'Follow working-at-height, lifting and site HSE rules',
  ],
  Ductman: [
    'Fabricate, hang and connect GI / PI / flexible ducts as per drawings',
    'Install hangers, supports, fire dampers and volume control dampers',
    'Seal joints, insulate ducts and close openings after first-fix',
    'Assist balancing, leak tests and punch-list close-out',
    'Read HVAC layouts and coordinate with electrical and false-ceiling teams',
    'Follow working-at-height and site HSE rules',
  ],
  'Mechanical Helper': [
    'Assist pipe fitters, welders, HVAC and mechanical crews',
    'Shift pipes, ducts, fittings, tools and gas cylinders as directed',
    'Help with grinding, tacking, insulation and housekeeping',
    'Support hydrotest, hot-work and equipment positioning',
    'Follow supervisor instructions and permit-to-work rules',
    'Wear PPE at all times on site',
  ],
  'General Helper': [
    'Support skilled trades with materials, tools and housekeeping',
    'Load, unload and shift materials around the site',
    'Mix mortar or concrete and keep access routes clear',
    'Help with simple site tasks as directed by the supervisor',
    'Follow site safety rules and permit-to-work instructions',
    'Wear PPE at all times on site',
  ],
  Carpenter: [
    'Cut, fit and fix timber for frames, doors, joinery and site carpentry',
    'Read drawings and mark out work to line, level and plumb',
    'Install wooden fixtures, supports and finishing items as directed',
    'Use hand and power tools safely; keep a tidy work area',
    'Coordinate with civil, finishing and MEP teams',
    'Follow site HSE and working-at-height rules',
  ],
  'HVAC Technician': [
    'Install, test and maintain HVAC plant, AHUs, FCUs and package units',
    'Read HVAC drawings, duct and pipe layouts',
    'Charge, vacuum and leak-test refrigerant circuits as directed',
    'Balance airflow, check controls and close punch-list items',
    'Coordinate with ductmen, electricians and false-ceiling teams',
    'Follow LOTO, permit-to-work and UAE HSE procedures',
  ],
  'AC Technician': [
    'Install, service and repair split, window and package AC units',
    'Run copper piping, drain lines and indoor/outdoor connections',
    'Vacuum, charge and leak-test refrigerant circuits',
    'Diagnose cooling faults and replace filters, capacitors and fans',
    'Keep plant rooms and work areas clean',
    'Follow electrical isolation and site HSE rules',
  ],
  'Fire Fighting Technician': [
    'Install fire hydrants, hose reels, sprinklers and fire-alarm first-fix',
    'Read fire-fighting drawings and coordinate with MEP and civil teams',
    'Fit pipes, valves, pumps and detection devices as specified',
    'Assist pressure tests, flushing and commissioning',
    'Follow NFPA / UAE civil-defence and permit-to-work rules',
    'Maintain tools and report daily progress',
  ],
  Painter: [
    'Prepare surfaces: filling, sanding, priming and masking',
    'Apply emulsion, enamel and texture paint to walls, ceilings and steel',
    'Spray or roll to an even finish as per the specification',
    'Protect adjacent finishes and clean up after each area',
    'Touch up snags before handover',
    'Follow site HSE including working-at-height and solvent controls',
  ],
  Scaffolder: [
    'Erect, alter and dismantle tube-and-coupler or system scaffold',
    'Set base plates, standards, ledgers, braces, platforms and ties',
    'Install guardrails, toe boards, ladders and working platforms',
    'Inspect components and tag incomplete or unsafe scaffold',
    'Follow working-at-height, lifting and site HSE rules',
    'Coordinate with civil and finishing trades for access',
  ],
  'POP / Gypsum Carpenter': [
    'Set out and install gypsum / POP false ceilings, partitions and bulkheads',
    'Fix channels, studs, boards and access panels to drawings',
    'Cut, measure and finish joints, beads and openings for lights and AC',
    'Coordinate with MEP first-fix before closing ceilings',
    'Protect finished boards and close punch-list items',
    'Follow working-at-height and site HSE rules',
  ],
  'Waterproofing Mason': [
    'Prepare surfaces and apply cementitious or membrane waterproofing',
    'Treat wet areas, tanks, roofs, retaining walls and expansion joints',
    'Install fillets, corners, drains and protection layers',
    'Flood-test / pond-test and repair leaks as directed',
    'Follow manufacturer method statements and site HSE',
    'Keep the work area clean and protect completed work',
  ],
  'Marble / Granite Mason': [
    'Set out and fix marble, granite and stone flooring and cladding',
    'Cut, drill, bed and grout stone to line, level and consistent joints',
    'Install skirting, treads, counters and wall cladding as specified',
    'Polish, protect and clean finished stonework',
    'Coordinate with wet-area and finishing trades',
    'Follow site HSE and material-handling rules',
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
  Plumber: {
    youtubeId: '49x3n08ZcvI',
    caption: 'How plumber work is done — PVC / CPVC pipe fitting like on UAE sites.',
  },
  Welder: {
    youtubeId: 'N4Vn1QbS1Nk',
    caption: 'How welder work is done — stick (ARC) welding used on construction and fabrication.',
  },
  'Shuttering Carpenter': {
    youtubeId: 'JAhCaIqtflM',
    caption: 'How shuttering carpenter work is done — formwork erection and striking.',
  },
  Mason: {
    youtubeId: 'rWofXXWOhck',
    caption: 'How mason work is done — block laying to line and level.',
  },
  'Civil Helper': {
    youtubeId: 'o2kiA5ItiJw',
    caption: 'How civil helper work is done — supporting skilled trades on a live site.',
  },
  'Civil Labour': {
    youtubeId: 'e8RgNqmSh2c',
    caption: 'How civil labour work is done — concreting and general site labour.',
  },
  'Pipe Fitter': {
    youtubeId: 'KIZurpeGMoM',
    caption: 'How pipe fitter work is done — fitting, aligning and tacking pipes on site.',
  },
  'MIG Welder': {
    youtubeId: 'gc9fBVq9NlE',
    caption: 'How MIG welder work is done — wire-feed welding used in fabrication shops and sites.',
  },
  'TIG Welder': {
    youtubeId: 'tNYmo2_DI6c',
    caption: 'How TIG welder work is done — precision TIG welding on pipe and sheet.',
  },
  'Aluminium Fabricator': {
    youtubeId: 'ovEDLzbAWpg',
    caption: 'How aluminium fabricator work is done — cutting, fitting and joining metal sections.',
  },
  'Industrial Electrician': {
    youtubeId: 'R-e2OCC8i6c',
    caption: 'How industrial electrician work is done — power, trays and equipment wiring on site.',
  },
  'Finishing Carpenter': {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How finishing carpenter work is done — doors, frames and joinery fitting.',
  },
  'Tile Mason': {
    youtubeId: 'UawZD4KHS3k',
    caption: 'How tile mason work is done — wall and floor tiling to line and level.',
  },
  'All Round Mason': {
    youtubeId: 'rWofXXWOhck',
    caption: 'How all-round mason work is done — block work plus plaster and finishing support.',
  },
  'Block & Plaster Mason': {
    youtubeId: 'rWofXXWOhck',
    caption: 'How block and plaster mason work is done — block laying and plastering.',
  },
  'Steel Fixer': {
    youtubeId: 'NT2IeAdO7eg',
    caption: 'How steel fixer work is done — cutting, placing and tying reinforcement.',
  },
  Ductman: {
    youtubeId: 'sRy3zy84hwg',
    caption: 'How ductman work is done — HVAC duct hanging and first-fix on a live build.',
  },
  'Mechanical Helper': {
    youtubeId: 'o2kiA5ItiJw',
    caption: 'How mechanical helper work is done — supporting fitters and welders on site.',
  },
  'General Helper': {
    youtubeId: 'e8RgNqmSh2c',
    caption: 'How general helper work is done — materials, housekeeping and trade support.',
  },
  Carpenter: {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How carpenter work is done — cutting, fitting and fixing timber on site.',
  },
  'HVAC Technician': {
    youtubeId: 'sRy3zy84hwg',
    caption: 'How HVAC technician work is done — plant, duct and first-fix on a live build.',
  },
  'AC Technician': {
    youtubeId: 'sRy3zy84hwg',
    caption: 'How AC technician work is done — installing and servicing air-conditioning units.',
  },
  'Fire Fighting Technician': {
    youtubeId: 'R-e2OCC8i6c',
    caption: 'How fire-fighting technician work is done — site MEP first-fix for life-safety systems.',
  },
  Painter: {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How painter work is done — surface preparation and finishing on interiors.',
  },
  Scaffolder: {
    youtubeId: 'veF4uSUtrEY',
    caption: 'How scaffolder work is done — erecting platforms, ties and guardrails.',
  },
  'POP / Gypsum Carpenter': {
    youtubeId: 'WJI_EBc3Cyo',
    caption: 'How POP / gypsum carpenter work is done — false ceilings and board partitions.',
  },
  'Waterproofing Mason': {
    youtubeId: 'rWofXXWOhck',
    caption: 'How waterproofing mason work is done — wet-area and membrane treatment on site.',
  },
  'Marble / Granite Mason': {
    youtubeId: 'UawZD4KHS3k',
    caption: 'How marble / granite mason work is done — setting stone floors and cladding.',
  },
};

export function getPublicJobVideo(title: string, description = '') {
  const listed = inferUaeListedJob(title, description);
  return listed ? UAE_LISTED_JOB_VIDEOS[listed] : null;
}
