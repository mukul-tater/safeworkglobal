import { supabase } from '@/integrations/supabase/client';

export interface JobPostAutoSaveData {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  responsibilities: string;
  location: string;
  country: string;
  job_type: string;
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  openings: number;
  visa_sponsorship: boolean;
  remote_allowed: boolean;
  expires_at: string;
  skills: string[];
  status?: string;
}

function hasJobContent(data: JobPostAutoSaveData) {
  return (
    data.title.trim() ||
    data.description.trim() ||
    data.location.trim() ||
    data.country.trim() ||
    data.requirements.trim() ||
    data.benefits.trim() ||
    data.responsibilities.trim() ||
    data.skills.length > 0
  );
}

function buildJobPayload(data: JobPostAutoSaveData, options: { forceDraft?: boolean }) {
  return {
    title: data.title.trim() || 'Untitled Job',
    description: data.description.trim() || 'Draft job posting — complete the description to publish.',
    requirements: data.requirements?.trim() || null,
    benefits: data.benefits?.trim() || null,
    responsibilities: data.responsibilities?.trim() || null,
    location: data.location.trim() || 'TBD',
    country: data.country.trim() || 'India',
    job_type: data.job_type || 'FULL_TIME',
    experience_level: data.experience_level || 'INTERMEDIATE',
    salary_min: Number.isFinite(data.salary_min) ? data.salary_min : null,
    salary_max: Number.isFinite(data.salary_max) ? data.salary_max : null,
    currency: data.currency || 'INR',
    openings: Number.isFinite(data.openings) && data.openings > 0 ? data.openings : 1,
    visa_sponsorship: data.visa_sponsorship ?? false,
    remote_allowed: data.remote_allowed ?? false,
    status: options.forceDraft ? 'DRAFT' : (data.status || 'DRAFT'),
    expires_at: data.expires_at || null,
    updated_at: new Date().toISOString(),
  };
}

async function syncJobSkills(jobId: string, skills: string[]) {
  await supabase.from('job_skills').delete().eq('job_id', jobId);
  if (skills.length === 0) return;

  const { error } = await supabase.from('job_skills').insert(
    skills.map((skill_name) => ({ job_id: jobId, skill_name })),
  );
  if (error) throw error;
}

export async function saveJobDraftPartial(
  employerId: string,
  jobId: string | null,
  data: JobPostAutoSaveData,
): Promise<string | null> {
  if (!hasJobContent(data)) return jobId;

  const jobPayload = buildJobPayload(data, { forceDraft: true });
  let savedJobId = jobId;

  if (savedJobId) {
    const { error } = await supabase
      .from('jobs')
      .update(jobPayload)
      .eq('id', savedJobId)
      .eq('employer_id', employerId);
    if (error) throw error;
  } else {
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({ ...jobPayload, employer_id: employerId })
      .select('id')
      .single();
    if (error) throw error;
    savedJobId = job.id;
  }

  await syncJobSkills(savedJobId, data.skills);
  return savedJobId;
}

export async function saveJobPartial(
  employerId: string,
  jobId: string,
  data: JobPostAutoSaveData,
) {
  if (!hasJobContent(data)) return;

  const jobPayload = buildJobPayload(data, { forceDraft: false });
  const { error } = await supabase
    .from('jobs')
    .update(jobPayload)
    .eq('id', jobId)
    .eq('employer_id', employerId);
  if (error) throw error;

  await syncJobSkills(jobId, data.skills);
}
