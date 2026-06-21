#!/usr/bin/env node
/**
 * Seed realistic jobs for every job category (min 5 per category).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.
 *
 * Usage: node scripts/seed-jobs.mjs
 *        node scripts/seed-jobs.mjs --force   # insert even if category already has 5+ jobs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const force = process.argv.includes('--force');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env\n' +
      'Log in as employer and use /seed-data, or add the service role key locally.'
  );
  process.exit(1);
}

const MIN_JOBS_PER_CATEGORY = 5;

const JOB_CATEGORIES = [
  'Construction', 'Electrical', 'Welding', 'Plumbing', 'HVAC', 'Manufacturing',
  'Carpentry', 'Painting', 'Masonry', 'Steel Fixing', 'Scaffolding',
  'Heavy Equipment Operation', 'Crane Operation', 'Delivery & Logistics',
  'Hospitality', 'Healthcare', 'IT & Technology', 'Engineering', 'Security',
  'Cleaning & Maintenance', 'Food & Beverage', 'Agriculture', 'Oil & Gas', 'Mining',
];

const JOB_SEED_LOCATIONS = [
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
];

const CATEGORY_DEFINITIONS = {
  Construction: {
    titles: ['Site Supervisor', 'Mason', 'Concrete Finisher', 'Formwork Carpenter', 'Construction Foreman'],
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

const EXPERIENCE_LEVELS = ['ENTRY', 'INTERMEDIATE', 'SENIOR', 'EXPERT', 'INTERMEDIATE'];
const JOB_TYPES = ['FULL_TIME', 'CONTRACT', 'FULL_TIME', 'CONTRACT', 'FULL_TIME'];
const LEVEL_OFFSET = { ENTRY: 0, INTERMEDIATE: 3_000, SENIOR: 6_000, EXPERT: 9_000 };
const SALARY_FLOOR = 50_000;
const SALARY_CEILING = 100_000;

function formatAmount(n) {
  if (n >= 100_000) {
    const lakhs = n / 100_000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return `₹${Math.round(n / 1000)}K`;
}

function normalizeSalary(experienceLevel, seed) {
  const offset = LEVEL_OFFSET[experienceLevel] ?? 3_000;
  const jitter = seed % 5_000;
  const salary_min = Math.min(SALARY_FLOOR + offset + jitter, SALARY_CEILING - 15_000);
  const salary_max = Math.min(SALARY_CEILING, salary_min + 5_000 + (seed % 10_000));
  const max = Math.max(salary_max, salary_min + 5_000);
  return {
    salary_min,
    salary_max: max,
    currency: 'INR',
    salary_display: `${formatAmount(salary_min)} – ${formatAmount(max)}`,
  };
}

function experienceYears(level) {
  if (level === 'ENTRY') return '1–2';
  if (level === 'INTERMEDIATE') return '3–5';
  if (level === 'SENIOR') return '5–8';
  return '8+';
}

function defaultDefinition(category) {
  return {
    titles: [
      `${category} Technician`,
      `Senior ${category} Worker`,
      `${category} Supervisor`,
      `Junior ${category} Assistant`,
      `Lead ${category} Specialist`,
    ],
    skills: ['Safety Compliance', 'Team Coordination', 'Quality Standards', 'Communication'],
  };
}

function pickLocations(categoryIndex, count, jobOffset = 0) {
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(
      JOB_SEED_LOCATIONS[(categoryIndex * 3 + jobOffset * 2 + i * 2) % JOB_SEED_LOCATIONS.length]
    );
  }
  return picked;
}

function buildCategoryJobs(categoryName, employerId, categoryIndex, count = MIN_JOBS_PER_CATEGORY, jobOffset = 0) {
  const def = CATEGORY_DEFINITIONS[categoryName] ?? defaultDefinition(categoryName);
  const locations = pickLocations(categoryIndex, count, jobOffset);
  const jobs = [];
  const skills = [];

  for (let i = 0; i < count; i++) {
    const title = def.titles[i % def.titles.length];
    const location = locations[i];
    const experienceLevel = EXPERIENCE_LEVELS[i];
    const jobType = JOB_TYPES[i];
    const salary = normalizeSalary(experienceLevel, categoryIndex * 1000 + i * 137);
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
    });

    for (const skill of def.skills.slice(0, 2 + (i % 2))) {
      skills.push({ categoryName, jobIndex: i, skill_name: skill });
    }
  }

  return { jobs, skills };
}

const sb = createClient(url, key);

async function resolveEmployerId() {
  const demoEmails = ['employer@safeworkglobal.demo', 'employer2@safeworkglobal.demo'];

  for (const email of demoEmails) {
    const { data } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: profile } = await sb.from('employer_profiles').select('user_id').limit(1).maybeSingle();
  if (profile?.user_id) return profile.user_id;

  return null;
}

async function ensureEmployerProfile(employerId) {
  const { data: existing } = await sb
    .from('employer_profiles')
    .select('user_id')
    .eq('user_id', employerId)
    .maybeSingle();

  if (existing) return;

  const { error } = await sb.from('employer_profiles').insert({
    user_id: employerId,
    company_name: 'Gulf Workforce Partners',
    industry: 'Construction & Infrastructure',
    company_size: '100-500',
  });

  if (error) throw new Error(`Failed to create employer profile: ${error.message}`);
}

async function countJobsByCategory() {
  const { data, error } = await sb.from('jobs').select('title').eq('status', 'ACTIVE');
  if (error) throw new Error(error.message);

  const counts = Object.fromEntries(JOB_CATEGORIES.map((c) => [c, 0]));
  for (const job of data ?? []) {
    for (const cat of JOB_CATEGORIES) {
      if (job.title?.endsWith(` - ${cat}`)) {
        counts[cat]++;
        break;
      }
    }
  }
  return counts;
}

async function main() {
  const employerId = await resolveEmployerId();
  if (!employerId) {
    console.error('No employer account found. Create a demo employer first (/seed-data) or add an employer_profiles row.');
    process.exit(1);
  }

  await ensureEmployerProfile(employerId);
  const existingCounts = await countJobsByCategory();

  const allJobs = [];
  const allSkills = [];
  const skipped = [];

  JOB_CATEGORIES.forEach((category, index) => {
    const existing = existingCounts[category] ?? 0;
    if (!force && existing >= MIN_JOBS_PER_CATEGORY) {
      skipped.push(category);
      return;
    }

    const needed = force ? MIN_JOBS_PER_CATEGORY : MIN_JOBS_PER_CATEGORY - existing;
    const { jobs, skills } = buildCategoryJobs(category, employerId, index, needed, force ? 0 : existing);
    allJobs.push(...jobs);
    allSkills.push(...skills);
  });

  if (allJobs.length === 0) {
    console.log(`All ${JOB_CATEGORIES.length} categories already have at least ${MIN_JOBS_PER_CATEGORY} jobs. Use --force to add more.`);
    process.exit(0);
  }

  console.log(`Inserting ${allJobs.length} jobs across ${JOB_CATEGORIES.length - skipped.length} categories...`);
  if (skipped.length) {
    console.log(`Skipped (already seeded): ${skipped.join(', ')}`);
  }

  const inserted = [];
  const batchSize = 25;

  for (let i = 0; i < allJobs.length; i += batchSize) {
    const batch = allJobs.slice(i, i + batchSize);
    const { data, error } = await sb.from('jobs').insert(batch).select('id, title');
    if (error) {
      console.error('Insert failed:', error.message);
      process.exit(1);
    }
    inserted.push(...(data ?? []));
  }

  const skillRows = [];
  let skillCursor = 0;
  for (let j = 0; j < inserted.length; j++) {
    const job = inserted[j];
    const category = JOB_CATEGORIES.find((c) => job.title.endsWith(` - ${c}`));
    if (!category) continue;
    const def = CATEGORY_DEFINITIONS[category] ?? defaultDefinition(category);
    const skillCount = 2 + (j % 2);
    for (const skill of def.skills.slice(0, skillCount)) {
      skillRows.push({ job_id: job.id, skill_name: skill });
    }
    skillCursor++;
  }

  if (skillRows.length > 0) {
    for (let i = 0; i < skillRows.length; i += 50) {
      const batch = skillRows.slice(i, i + 50);
      const { error } = await sb.from('job_skills').insert(batch);
      if (error) console.warn('Skills insert warning:', error.message);
    }
  }

  const finalCounts = await countJobsByCategory();
  const summary = JOB_CATEGORIES.map((c) => `${c}: ${finalCounts[c]}`).join('\n  ');

  console.log(`\nDone. Inserted ${inserted.length} jobs with ${skillRows.length} skills.`);
  console.log(`Jobs per category:\n  ${summary}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
