import { JOB_CATEGORIES } from '@/lib/constants';
import { normalizeSalaryForJob } from '@/lib/jobSalaryUtils';

export const MIN_JOBS_PER_CATEGORY = 5;

export const JOB_SEED_LOCATIONS = [
  { city: 'Dubai', country: 'UAE' },
  { city: 'Abu Dhabi', country: 'UAE' },
  { city: 'Sharjah', country: 'UAE' },
  { city: 'Riyadh', country: 'Saudi Arabia' },
  { city: 'Jeddah', country: 'Saudi Arabia' },
  { city: 'Dammam', country: 'Saudi Arabia' },
  { city: 'Doha', country: 'Qatar' },
  { city: 'Al Wakrah', country: 'Qatar' },
  { city: 'Kuwait City', country: 'Kuwait' },
  { city: 'Muscat', country: 'Oman' },
  { city: 'Salalah', country: 'Oman' },
  { city: 'Manama', country: 'Bahrain' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'London', country: 'UK' },
  { city: 'Seoul', country: 'South Korea' },
] as const;

const EXPERIENCE_LEVELS = ['ENTRY', 'INTERMEDIATE', 'SENIOR', 'EXPERT', 'INTERMEDIATE'] as const;
const JOB_TYPES = ['FULL_TIME', 'CONTRACT', 'FULL_TIME', 'CONTRACT', 'FULL_TIME'] as const;

export interface CategorySeedDefinition {
  titles: string[];
  skills: string[];
}

const CATEGORY_DEFINITIONS: Record<string, CategorySeedDefinition> = {
  Construction: {
    titles: ['Site Supervisor', 'Mason', 'Concrete Finisher', 'Formwork Carpenter', 'Construction Foreman', 'Civil Helper'],
    skills: ['Blueprint Reading', 'Concrete Work', 'Safety Compliance', 'Scaffolding'],
  },
  Electrical: {
    titles: ['Industrial Electrician', 'Commercial Electrician', 'Maintenance Electrician', 'Solar Technician', 'Panel Installer'],
    skills: ['Electrical Systems', 'Panel Installation', 'Troubleshooting', 'Code Compliance'],
  },
  Welding: {
    titles: ['MIG Welder', 'TIG Welder', 'Pipeline Welder', 'Structural Welder', 'Fabrication Welder'],
    skills: ['MIG Welding', 'TIG Welding', 'Arc Welding', 'Blueprint Reading'],
  },
  Plumbing: {
    titles: ['Master Plumber', 'Pipefitter', 'HVAC Plumber', 'Service Plumber', 'Industrial Plumber'],
    skills: ['Pipe Fitting', 'Plumbing Codes', 'Troubleshooting', 'HVAC Basics'],
  },
  HVAC: {
    titles: ['HVAC Technician', 'AC Technician', 'Chiller Operator', 'Ducting Specialist', 'Refrigeration Mechanic'],
    skills: ['HVAC Systems', 'Refrigeration', 'Duct Installation', 'Preventive Maintenance'],
  },
  Manufacturing: {
    titles: ['CNC Operator', 'Assembly Line Worker', 'Quality Inspector', 'Machine Operator', 'Production Supervisor'],
    skills: ['CNC Programming', 'Quality Control', 'Lean Manufacturing', 'Machine Operation'],
  },
  Carpentry: {
    titles: ['Finish Carpenter', 'Formwork Carpenter', 'Furniture Carpenter', 'Joinery Specialist', 'Wood Frame Installer'],
    skills: ['Woodworking', 'Blueprint Reading', 'Finishing', 'Measurement'],
  },
  Painting: {
    titles: ['Industrial Painter', 'Spray Painter', 'Decorative Painter', 'Coating Specialist', 'Surface Prep Technician'],
    skills: ['Spray Painting', 'Surface Preparation', 'Safety Equipment', 'Color Matching'],
  },
  Masonry: {
    titles: ['Brick Mason', 'Block Mason', 'Stone Mason', 'Tile Setter', 'Masonry Foreman'],
    skills: ['Brick Laying', 'Block Work', 'Tile Setting', 'Mortar Mixing'],
  },
  'Steel Fixing': {
    titles: ['Steel Fixer', 'Rebar Installer', 'Structural Steel Worker', 'Bar Bending Operator', 'Steel Supervisor'],
    skills: ['Rebar Tying', 'Blueprint Reading', 'Structural Steel', 'Safety Harness'],
  },
  Scaffolding: {
    titles: ['Scaffolder', 'Scaffolding Supervisor', 'Tube & Fitting Specialist', 'System Scaffold Erector', 'Scaffold Inspector'],
    skills: ['Scaffold Erection', 'Safety Inspection', 'Load Calculation', 'Fall Protection'],
  },
  'Heavy Equipment Operation': {
    titles: ['Excavator Operator', 'Bulldozer Operator', 'Loader Operator', 'Grader Operator', 'Heavy Plant Operator'],
    skills: ['Excavator Operation', 'Site Safety', 'Equipment Maintenance', 'GPS Machine Control'],
  },
  'Crane Operation': {
    titles: ['Tower Crane Operator', 'Mobile Crane Operator', 'Overhead Crane Operator', 'Rigger', 'Crane Signalman'],
    skills: ['Crane Operation', 'Rigging', 'Load Charts', 'Signal Communication'],
  },
  'Delivery & Logistics': {
    titles: ['Delivery Driver', 'Warehouse Supervisor', 'Forklift Operator', 'Logistics Coordinator', 'Fleet Dispatcher'],
    skills: ['Route Planning', 'Forklift Operation', 'Inventory Management', 'Fleet Coordination'],
  },
  Hospitality: {
    titles: ['Hotel Housekeeper', 'Room Attendant', 'Kitchen Helper', 'Bell Captain', 'Laundry Supervisor'],
    skills: ['Guest Service', 'Housekeeping Standards', 'Food Safety', 'Team Coordination'],
  },
  Healthcare: {
    titles: ['Healthcare Assistant', 'Ward Attendant', 'Patient Care Aide', 'Medical Equipment Technician', 'Hospital Porter'],
    skills: ['Patient Care', 'Hygiene Protocols', 'Basic Life Support', 'Equipment Handling'],
  },
  'IT & Technology': {
    titles: ['Data Center Technician', 'Network Cable Installer', 'IT Support Assistant', 'Hardware Technician', 'AV Installer'],
    skills: ['Cable Management', 'Hardware Troubleshooting', 'Network Basics', 'Documentation'],
  },
  Engineering: {
    titles: ['Site Engineer Assistant', 'QA/QC Inspector', 'Surveyor Helper', 'Drafting Technician', 'Commissioning Technician'],
    skills: ['Quality Inspection', 'Technical Drawings', 'Site Reporting', 'Measurement Tools'],
  },
  Security: {
    titles: ['Security Guard', 'CCTV Operator', 'Access Control Officer', 'Patrol Supervisor', 'Event Security Staff'],
    skills: ['Surveillance', 'Access Control', 'Incident Reporting', 'Crowd Management'],
  },
  'Cleaning & Maintenance': {
    titles: ['Facility Cleaner', 'Janitorial Supervisor', 'Industrial Cleaner', 'Maintenance Helper', 'Sanitation Worker'],
    skills: ['Cleaning Protocols', 'Chemical Safety', 'Equipment Operation', 'Waste Disposal'],
  },
  'Food & Beverage': {
    titles: ['Line Cook', 'Kitchen Steward', 'Barista', 'Food Prep Worker', 'Catering Assistant'],
    skills: ['Food Preparation', 'Kitchen Hygiene', 'HACCP Basics', 'Customer Service'],
  },
  Agriculture: {
    titles: ['Greenhouse Worker', 'Farm Machine Operator', 'Irrigation Technician', 'Harvest Worker', 'Livestock Handler'],
    skills: ['Crop Handling', 'Irrigation Systems', 'Equipment Operation', 'Safety Practices'],
  },
  'Oil & Gas': {
    titles: ['Rig Helper', 'Pipefitter', 'Instrument Technician', 'Mechanical Fitter', 'HSE Officer Assistant'],
    skills: ['Pipe Fitting', 'Safety Procedures', 'Mechanical Assembly', 'HSE Compliance'],
  },
  Mining: {
    titles: ['Mine Operator', 'Underground Miner', 'Blasting Helper', 'Mineral Processing Operator', 'Mine Maintenance Worker'],
    skills: ['Heavy Machinery', 'Underground Safety', 'Mineral Handling', 'Ventilation Awareness'],
  },
};

function defaultDefinition(category: string): CategorySeedDefinition {
  return {
    titles: [
      `${category} Technician`,
      `Senior ${category} Worker`,
      `${category} Supervisor`,
      `Junior ${category} Assistant`,
      `Lead ${category} Specialist`,
      `${category} Operator`,
    ],
    skills: ['Safety Compliance', 'Team Coordination', 'Quality Standards', 'Communication'],
  };
}

export function getSeedableCategories(): string[] {
  return JOB_CATEGORIES.filter((c) => c !== 'All Categories');
}

export interface JobSeedInsert {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  location: string;
  country: string;
  job_type: string;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  salary_display: string;
  currency: string;
  openings: number;
  status: string;
  visa_sponsorship: boolean;
  remote_allowed: boolean;
  employer_id: string;
  posted_at: string;
  expires_at: string;
  category: string;
}

export interface JobSkillSeed {
  category: string;
  jobIndex: number;
  skill_name: string;
}

function experienceYears(level: string): string {
  switch (level) {
    case 'ENTRY':
      return '1–2';
    case 'INTERMEDIATE':
      return '3–5';
    case 'SENIOR':
      return '5–8';
    case 'EXPERT':
      return '8+';
    default:
      return '3–5';
  }
}

function pickLocations(categoryIndex: number, count: number, jobOffset = 0) {
  const locations = [...JOB_SEED_LOCATIONS];
  const start = (categoryIndex * 3 + jobOffset * 2) % locations.length;
  const picked: (typeof JOB_SEED_LOCATIONS)[number][] = [];
  for (let i = 0; i < count; i++) {
    picked.push(locations[(start + i * 2) % locations.length]);
  }
  return picked;
}

export function buildCategoryJobSeeds(
  categoryName: string,
  employerId: string,
  categoryIndex: number,
  minJobs = MIN_JOBS_PER_CATEGORY,
  jobOffset = 0
): { jobs: JobSeedInsert[]; skills: JobSkillSeed[] } {
  const def = CATEGORY_DEFINITIONS[categoryName] ?? defaultDefinition(categoryName);
  const locations = pickLocations(categoryIndex, minJobs, jobOffset);
  const jobs: JobSeedInsert[] = [];
  const skills: JobSkillSeed[] = [];

  for (let i = 0; i < minJobs; i++) {
    const title = def.titles[i % def.titles.length];
    const location = locations[i];
    const experienceLevel = EXPERIENCE_LEVELS[i % EXPERIENCE_LEVELS.length];
    const jobType = JOB_TYPES[i % JOB_TYPES.length];
    const salary = normalizeSalaryForJob(experienceLevel, categoryIndex * 1000 + i * 137);
    const years = experienceYears(experienceLevel);
    const postedDaysAgo = 2 + ((categoryIndex * MIN_JOBS_PER_CATEGORY + jobOffset + i) % 28);
    const expiresDays = 45 + ((categoryIndex + jobOffset + i) % 45);

    jobs.push({
      title: `${title} - ${categoryName}`,
      description: `Reputed employer hiring experienced ${title.toLowerCase()} for a ${categoryName.toLowerCase()} project in ${location.city}, ${location.country}. Indian workers with relevant GCC or overseas experience preferred. Free accommodation, medical insurance, and annual leave included. Visa sponsorship available for shortlisted candidates.`,
      requirements: `${years} years of ${categoryName.toLowerCase()} experience\nValid passport with minimum 2 years validity\nRelevant trade certification (preferred)\nWillingness to work in ${location.country}\nBasic English communication`,
      responsibilities: `Execute ${categoryName.toLowerCase()} tasks as per site specifications\nFollow HSE and quality standards\nCoordinate with supervisors and team members\nComplete daily work logs and safety checks\nMaintain tools and work area`,
      benefits: `Monthly salary ${salary.salary_display}\nFree accommodation or allowance\nMedical insurance\nAnnual home leave ticket\nOvertime as per local labour law`,
      location: location.city,
      country: location.country,
      job_type: jobType,
      experience_level: experienceLevel,
      salary_min: salary.salary_min,
      salary_max: salary.salary_max,
      salary_display: salary.salary_display,
      currency: salary.currency,
      openings: 2 + (i % 8),
      status: 'ACTIVE',
      visa_sponsorship: true,
      remote_allowed: false,
      employer_id: employerId,
      posted_at: new Date(Date.now() - postedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString(),
      category: categoryName,
    });

    const selectedSkills = def.skills.slice(0, 2 + (i % 2));
    for (const skill of selectedSkills) {
      skills.push({ category: categoryName, jobIndex: i, skill_name: skill });
    }
  }

  return { jobs, skills };
}

export function buildAllJobSeeds(
  employerId: string,
  minJobsPerCategory = MIN_JOBS_PER_CATEGORY
): { jobs: JobSeedInsert[]; skills: JobSkillSeed[] } {
  const categories = getSeedableCategories();
  const allJobs: JobSeedInsert[] = [];
  const allSkills: JobSkillSeed[] = [];

  categories.forEach((category, index) => {
    const { jobs, skills } = buildCategoryJobSeeds(category, employerId, index, minJobsPerCategory);
    allJobs.push(...jobs);
    allSkills.push(...skills);
  });

  return { jobs: allJobs, skills: allSkills };
}
