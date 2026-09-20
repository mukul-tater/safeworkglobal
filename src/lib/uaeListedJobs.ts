/** Categories we currently list under UAE on Find jobs / Choose a job. */
export const UAE_LISTED_JOBS = [
  'Electrician',
  'Welder',
  'Plumber',
  'Shuttering Carpenter',
  'Mason (tiles/marble)',
  'Construction Labour/Helper',
  'Pipe Fitter',
  'Furniture Carpenter - Finishing, All Rounder',
  'Steel Fixer',
  'AC Technician',
  'Warehouse Helper',
  'Scaffolder',
  'Painter',
  'Aluminium Fixer/Fabricator',
] as const;

export type UaeListedJob = (typeof UAE_LISTED_JOBS)[number];

/** Card title: English / Hindi, shown next to each other on Find jobs. */
export const UAE_LISTED_JOB_LABELS: Record<UaeListedJob, { en: string; hi: string }> = {
  Electrician: { en: 'Electrician', hi: 'इलेक्ट्रीशियन' },
  Welder: { en: 'Welder', hi: 'वेल्डर' },
  Plumber: { en: 'Plumber', hi: 'प्लंबर' },
  'Shuttering Carpenter': { en: 'Shuttering Carpenter', hi: 'शटरिंग कारपेंटर' },
  'Mason (tiles/marble)': { en: 'Mason (tiles/marble)', hi: 'मेसन (टाइल/मारबल)' },
  'Construction Labour/Helper': { en: 'Construction Labour', hi: 'निर्माण मजदूर' },
  'Pipe Fitter': { en: 'Pipe Fitter', hi: 'पाइप फिटर' },
  'Furniture Carpenter - Finishing, All Rounder': {
    en: 'Furniture Carpenter',
    hi: 'फर्नीचर कारपेंटर',
  },
  'Steel Fixer': { en: 'Steel Fixer', hi: 'स्टील फिक्सर' },
  'AC Technician': { en: 'AC Technician', hi: 'AC तकनीशियन' },
  'Warehouse Helper': { en: 'Warehouse Helper', hi: 'वेयरहाउस हेल्पर' },
  Scaffolder: { en: 'Scaffolder', hi: 'स्कैफोल्डर' },
  Painter: { en: 'Painter', hi: 'पेंटर' },
  'Aluminium Fixer/Fabricator': { en: 'Aluminium Fixer', hi: 'एल्युमिनियम फिक्सर' },
};

const MATCHERS: Array<{ job: UaeListedJob; needles: string[] }> = [
  { job: 'Aluminium Fixer/Fabricator', needles: ['aluminium fixer', 'aluminum fixer', 'aluminium fabricator', 'aluminum fabricator', 'glazing fabricator'] },
  { job: 'Shuttering Carpenter', needles: ['shuttering carpenter', 'shuttering', 'formwork carpenter', 's. carpenter'] },
  { job: 'Mason (tiles/marble)', needles: ['mason (tiles/marble)', 'tiles/marble', 'tile mason', 'tile fixer', 'marble mason', 'granite mason', 'marble / granite', 'marble/granite'] },
  { job: 'Warehouse Helper', needles: ['warehouse helper', 'supermarket helper', 'warehouse/supermarket', 'general labour - warehouse', 'warehouse'] },
  { job: 'Construction Labour/Helper', needles: ['construction labour', 'construction labor', 'construction helper', 'civil helper', 'civil labour', 'civil labor', 'mechanical helper', 'general helper'] },
  { job: 'Pipe Fitter', needles: ['pipe fitter', 'pipefitter'] },
  { job: 'Steel Fixer', needles: ['steel fixer', 'rebar fixer'] },
  { job: 'AC Technician', needles: ['ac technician', 'air conditioning technician', 'air conditioner technician', 'hvac technician'] },
  { job: 'Scaffolder', needles: ['scaffolder', 'scaffolding'] },
  { job: 'Painter', needles: ['painter', 'painting'] },
  { job: 'Furniture Carpenter - Finishing, All Rounder', needles: ['furniture carpenter', 'finishing, all rounder', 'finishing all rounder', 'finishing carpenter', 'pop / gypsum', 'pop/gypsum', 'gypsum carpenter', 'pop carpenter'] },
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

/** Public-facing title: listed trade name when we can infer one. */
export function getPublicJobTitle(title: string, description = ''): string {
  return inferUaeListedJob(title, description) ?? title;
}

/** Generic Carpenter listing — removed from Find jobs; shuttering / furniture stay. */
export function isHiddenPublicJob(title: string, slug?: string | null): boolean {
  if (slug === 'uae-listed-carpenter') return true;
  return title.trim().toLowerCase() === 'carpenter';
}

function inrBand(salary_min: number, salary_max: number): {
  salary_min: number;
  salary_max: number;
  salary_display: string;
} {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return {
    salary_min,
    salary_max,
    salary_display: salary_min === salary_max ? fmt(salary_min) : `${fmt(salary_min)} – ${fmt(salary_max)}`,
  };
}

/** Monthly INR salary ranges for the public UAE listings. */
export const UAE_LISTED_JOB_SALARIES: Record<UaeListedJob, ReturnType<typeof inrBand>> = {
  Electrician: inrBand(35000, 42000),
  Welder: inrBand(39000, 42000),
  Plumber: inrBand(35000, 41000),
  'Shuttering Carpenter': inrBand(36000, 42000),
  'Mason (tiles/marble)': inrBand(35000, 41000),
  'Construction Labour/Helper': inrBand(30000, 32000),
  'Pipe Fitter': inrBand(35000, 41000),
  'Furniture Carpenter - Finishing, All Rounder': inrBand(37000, 41000),
  'Steel Fixer': inrBand(35000, 41000),
  'AC Technician': inrBand(39000, 50000),
  'Warehouse Helper': inrBand(30000, 32000),
  Scaffolder: inrBand(36000, 42000),
  Painter: inrBand(36000, 42000),
  'Aluminium Fixer/Fabricator': inrBand(39000, 42000),
};

export function getPublicJobSalary(title: string, description = '') {
  const listed = inferUaeListedJob(title, description);
  return listed ? UAE_LISTED_JOB_SALARIES[listed] : null;
}

/** Unique “About the Role” copy on public job pages. */
export const UAE_LISTED_JOB_ABOUT: Record<UaeListedJob, string> = {
  Electrician:
    'UAE sites need electricians for LV wiring, distribution boards, lighting circuits and fault-finding on construction and facilities packages. You will work from drawings and single-line diagrams, terminate DBs/MCBs, and follow LOTO and permit-to-work. Visa sponsorship for shortlisted candidates.',
  Welder:
    'Structural and fabrication welding openings in the UAE for ARC, MIG and TIG work on steel, plates, pipes and supports. You will fit, tack and weld to WPS and drawings, grind joints, and complete visual quality checks with hot-work controls. Visa sponsorship for shortlisted candidates.',
  Plumber:
    'Residential and commercial plumbing packages in the UAE covering PVC, CPVC, PPR and GI supply and drainage. You will fit sanitary ware, pressure-test lines, leak-test stacks and close punch-list items before handover. Visa sponsorship for shortlisted candidates.',
  'Shuttering Carpenter':
    'Formwork / shuttering carpenter openings for UAE high-rise and infrastructure pours. You will erect, align and strike timber, plywood or system formwork to line and level, install props and ties, and coordinate pour sequence with civil and steel-fixer teams. Visa sponsorship for shortlisted candidates.',
  'Mason (tiles/marble)':
    'Tile, marble and granite mason openings for UAE finishing packages. You will set out floors and walls, bed tiles and stone to falls, cut around fittings, grout joints and fix skirting, dado and cladding. Visa sponsorship for shortlisted candidates.',
  'Construction Labour/Helper':
    'Construction labour and helper openings supporting masons, carpenters, steel fixers and site gangs. You will shift materials, mix mortar or concrete, keep the work area tidy and follow supervisor instructions and site HSE. Visa sponsorship for shortlisted candidates.',
  'Pipe Fitter':
    'Pipe fitter openings for UAE mechanical and plumbing packages. You will read isometrics, cut and align CS/GI/SS pipe, install flanges, valves and supports, and assist hydrotest and punch-list close-out with welders and riggers. Visa sponsorship for shortlisted candidates.',
  'Furniture Carpenter - Finishing, All Rounder':
    'Furniture and finishing carpentry openings for UAE interiors. You will build cabinets, wardrobes and wooden joinery, install doors, frames, panelling and fittings, and handle sanding, polish and snag close-out as an all-rounder. Visa sponsorship for shortlisted candidates.',
  'Steel Fixer':
    'Steel fixer openings for UAE high-rise and infrastructure. You will read bar-bending schedules, cut, bend, place and tie reinforcement for slabs, beams, columns and walls, and keep cover, laps and chairs as specified. Visa sponsorship for shortlisted candidates.',
  'AC Technician':
    'AC technician openings for UAE facilities and residential packages. You will install, service and repair split, window and package units, run copper and drain lines, vacuum and charge circuits, and diagnose cooling faults. Visa sponsorship for shortlisted candidates.',
  'Warehouse Helper':
    'Warehouse helper openings for UAE warehouses and stores. You will load, unload, pick, pack, stack and replenish stock, keep aisles and docks clear, and help with receiving and simple inventory counts. Visa sponsorship for shortlisted candidates.',
  Scaffolder:
    'Scaffolder openings for UAE high-rise and industrial access. You will erect, alter and dismantle tube-and-coupler or system scaffold, set standards, ledgers, braces and platforms, and tag incomplete or unsafe work. Visa sponsorship for shortlisted candidates.',
  Painter:
    'Painter openings for UAE interiors and structural steel. You will prepare surfaces, apply emulsion, enamel and texture finishes by brush, roller or spray, protect adjacent work and close snags before handover. Visa sponsorship for shortlisted candidates.',
  'Aluminium Fixer/Fabricator':
    'Aluminium fixer and fabricator openings for UAE windows, doors, cladding and shop-fronts. You will cut, mill, assemble and install aluminium frames from fabrication drawings, join sections and prepare surfaces for powder coat or anodising. Visa sponsorship for shortlisted candidates.',
};

export function getPublicJobAbout(title: string, stored?: string | null, description = ''): string {
  const listed = inferUaeListedJob(title, description || stored || '');
  if (listed) return UAE_LISTED_JOB_ABOUT[listed];
  return stored?.trim() || '';
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
  'Furniture Carpenter - Finishing, All Rounder': [
    'Build and finish furniture, cabinets, wardrobes and wooden joinery',
    'Cut, assemble, sand and fix timber to drawings and site measures',
    'Install doors, frames, panelling, skirting and furniture fittings',
    'Handle finishing, polish and snag-list close-out before handover',
    'Work as an all-rounder across furniture and finishing carpentry as directed',
    'Follow site HSE and protect completed interiors',
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
  'Warehouse Helper': [
    'Load, unload and shift goods in warehouses and stores',
    'Pick, pack, stack and replenish stock as directed',
    'Keep aisles, docks and storage areas clean and clear',
    'Help with receiving, put-away and simple inventory counts',
    'Follow supervisor instructions and warehouse safety rules',
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

export type ListedJobVideo = { youtubeId: string; startSeconds?: number };

/** YouTube clips Mukul sent for each trade. Each ID is shown as its own embed. */
export const UAE_LISTED_JOB_VIDEOS: Record<UaeListedJob, ListedJobVideo[]> = {
  Electrician: [
    { youtubeId: 'y4mS3RU2fdk', startSeconds: 17 },
    { youtubeId: 'YqLV_kT8KFs' },
    { youtubeId: '5cNVMHiDZ7I' },
    { youtubeId: 'mc4XG2D05uI' },
    { youtubeId: 'dXck9UX9eVc' },
    { youtubeId: 'KSFF77dhFQQ' },
    { youtubeId: 'hIg3ulllRPQ' },
    { youtubeId: 'zL5yjxgPoCA' },
  ],
  Welder: [
    { youtubeId: 'd2YeclasnjI' },
    { youtubeId: 'PzrHWzNsJyE' },
    { youtubeId: 'mbpPz2vdjLM' },
    { youtubeId: 'av-5yUbu6WU' },
    { youtubeId: 'bFNDpgbB9P4' },
    { youtubeId: 'IsZuZdE99T4' },
    { youtubeId: 'uE0yq1BUeYk' },
  ],
  Plumber: [
    { youtubeId: 'gWUtDhS3-SY' },
    { youtubeId: '28BXeowy8Ik' },
    { youtubeId: '6QzM_HhKO-M' },
    { youtubeId: 'sQxCfztlRvM' },
    { youtubeId: 'Di4eJO39KB8' },
    { youtubeId: 'f72wv4A9oYA' },
    { youtubeId: 'oywhmEenRhs' },
  ],
  'Shuttering Carpenter': [
    { youtubeId: '7tHqE8uD1WY' },
    { youtubeId: 'jfoIdlaiUsQ' },
    { youtubeId: 'BEFRlLUkjgs' },
    { youtubeId: 'ROdYO2yzDeU' },
    { youtubeId: '-v5AlV_td1w' },
    { youtubeId: 'ndurB3hkWOY' },
  ],
  'Mason (tiles/marble)': [
    { youtubeId: 'zc6oD3xhleE' },
    { youtubeId: 'kv4RoL-5sjE' },
    { youtubeId: '94n8_jm6-lE' },
    { youtubeId: 'H4iBocERDRs' },
    { youtubeId: '0wJ68LNU_EI' },
  ],
  'Construction Labour/Helper': [
    { youtubeId: '5-WAwzGtJbQ' },
    { youtubeId: 'EN0RKQBIUSM' },
    { youtubeId: 'dgxM2qpuRh0' },
    { youtubeId: 'XI1o-C-1MK4' },
  ],
  'Pipe Fitter': [
    { youtubeId: '1-ngwzGeq8Q' },
    { youtubeId: 'FdCbRTSWH7g' },
    { youtubeId: 'xAsKpckUj6g' },
    { youtubeId: 'aUtzmTsSOUg' },
    { youtubeId: 'N5_h1kTq7Yk' },
    { youtubeId: '_nKpUYXYjKI' },
    { youtubeId: '0ljxKfplUgo' },
    { youtubeId: '_JNm3nBHVwo' },
  ],
  'Furniture Carpenter - Finishing, All Rounder': [
    { youtubeId: 'piL7_XJG0k4' },
    { youtubeId: 'YXkruBOAMD8' },
    { youtubeId: 'fcuod3D9v_s' },
  ],
  'Steel Fixer': [{ youtubeId: 'NT2IeAdO7eg' }],
  'AC Technician': [{ youtubeId: 'sRy3zy84hwg' }],
  'Warehouse Helper': [{ youtubeId: 'e8RgNqmSh2c' }],
  Scaffolder: [
    { youtubeId: '87oUrUvPaNg' },
    { youtubeId: 'vxUSsnpUM18' },
    { youtubeId: 'Q77bEb6dAls' },
    { youtubeId: 'HRduiZsbdv0' },
    { youtubeId: 'mCijicwSucA' },
    { youtubeId: 'jm7MfSSUOj0' },
  ],
  Painter: [
    { youtubeId: '1J55ifnYB5k' },
    { youtubeId: 'FPzHpVRiNE8' },
    { youtubeId: 'vgaRcs22Q1A' },
    { youtubeId: 'mmsn1S2Ojks' },
  ],
  'Aluminium Fixer/Fabricator': [{ youtubeId: 'ovEDLzbAWpg' }],
};

export function getPublicJobVideos(title: string, description = ''): ListedJobVideo[] {
  const listed = inferUaeListedJob(title, description);
  return listed ? UAE_LISTED_JOB_VIDEOS[listed] : [];
}
