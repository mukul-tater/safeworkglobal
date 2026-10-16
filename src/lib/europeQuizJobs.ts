/** Czech listings that have their own Test 1 paper. */
export const EUROPE_QUIZ_JOBS = [
  'Automotive Sewing Machine Operator / Seamstress',
  'Automobile Factory – Production & Quality Control Worker',
  'Automotive Seat Belt Production Worker',
] as const;

export type EuropeQuizJob = (typeof EUROPE_QUIZ_JOBS)[number];

const EUROPE_QUIZ_MATCHERS: Array<{ job: EuropeQuizJob; needles: string[] }> = [
  { job: 'Automotive Seat Belt Production Worker', needles: ['seat belt', 'seatbelt'] },
  {
    job: 'Automotive Sewing Machine Operator / Seamstress',
    needles: ['sewing machine', 'seamstress', 'automatic sewing', 'automotive sewing'],
  },
  {
    job: 'Automobile Factory – Production & Quality Control Worker',
    needles: ['quality control worker', 'production & quality', 'production and quality'],
  },
];

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

/** Map a Czech job title onto its Test 1 paper. Title only, so duties text cannot cross-match. */
export function inferEuropeQuizJob(title: string): EuropeQuizJob | null {
  const titleNorm = normalizeTitle(title);
  if (!titleNorm) return null;
  const exact = EUROPE_QUIZ_JOBS.find((job) => normalizeTitle(job) === titleNorm);
  if (exact) return exact;
  const match = EUROPE_QUIZ_MATCHERS.find(({ needles }) =>
    needles.some((needle) => titleNorm.includes(needle)),
  );
  return match?.job ?? null;
}

export function isEuropeQuizJob(skill: string): skill is EuropeQuizJob {
  return (EUROPE_QUIZ_JOBS as readonly string[]).includes(skill);
}
