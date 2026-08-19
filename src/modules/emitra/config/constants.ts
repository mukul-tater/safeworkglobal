export const WORKER_SKILLS = [
  'Electrician',
  'Plumber',
  'Welder',
  'Driver',
  'Mason',
  'Carpenter',
  'Helper',
  'HVAC Technician',
  'Other',
] as const;

export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

export const GCC_COUNTRIES = [
  'UAE',
] as const;

export const SKILL_LEVELS = ['Helper', 'Semi Skilled', 'Skilled'] as const;

export const WORKER_STATUSES = [
  'registered',
  'verified',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'selected',
  'placed',
] as const;

export const WORKER_STATUS_LABELS: Record<string, string> = {
  registered: 'Registered',
  verified: 'Verified',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  selected: 'Selected',
  placed: 'Placed',
};

export const PARTNER_TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export const INCENTIVE_AMOUNTS = {
  verified: 50,
  interview_qualified: 100,
  placement: 750,
} as const;

export const MIGRATION_CATEGORY_LABELS: Record<string, string> = {
  placement_ready: 'Placement Ready',
  needs_preparation: 'Needs Preparation',
  not_ready: 'Not Ready',
};
