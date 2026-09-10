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
