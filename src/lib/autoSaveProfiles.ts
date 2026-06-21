import { supabase } from '@/integrations/supabase/client';
import type { EmployerProfileFormData, WorkerProfileFormData } from '@/lib/validations/profile';

export type WorkerProfileAutoSaveData = WorkerProfileFormData & {
  nationality: string;
  availability: string;
};

export async function saveWorkerProfilePartial(userId: string, data: WorkerProfileAutoSaveData) {
  const profileUpdate: { full_name?: string; phone?: string | null } = {};
  const trimmedName = data.full_name?.trim();
  if (trimmedName) profileUpdate.full_name = trimmedName;
  if (data.phone !== undefined) profileUpdate.phone = data.phone?.trim() || null;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);
    if (profileError) throw profileError;
  }

  const preferredCountries = data.preferred_countries
    ?.split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const { error: workerError } = await supabase.from('worker_profiles').upsert(
    {
      user_id: userId,
      bio: data.bio?.trim() || null,
      years_of_experience: Number.isFinite(data.experience_years) ? data.experience_years : null,
      expected_salary_min: data.expected_salary_min || null,
      expected_salary_max: data.expected_salary_max || null,
      visa_countries: preferredCountries?.length ? preferredCountries : null,
      nationality: data.nationality || null,
      availability: data.availability || null,
      has_passport: data.has_passport ?? false,
    },
    { onConflict: 'user_id' },
  );

  if (workerError) throw workerError;
}

export async function saveEmployerProfilePartial(userId: string, data: EmployerProfileFormData) {
  const profileUpdate: { full_name?: string; phone?: string | null } = {};
  const trimmedName = data.full_name?.trim();
  if (trimmedName) profileUpdate.full_name = trimmedName;
  if (data.phone !== undefined) profileUpdate.phone = data.phone?.trim() || null;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);
    if (profileError) throw profileError;
  }

  const { error: employerError } = await supabase.from('employer_profiles').upsert(
    {
      user_id: userId,
      bio: data.bio?.trim() || null,
      company_name: data.company_name?.trim() || null,
      company_registration: data.company_registration?.trim() || null,
      industry: data.industry?.trim() || null,
      company_size: data.company_size?.trim() || null,
      website: data.website?.trim() || null,
    },
    { onConflict: 'user_id' },
  );

  if (employerError) throw employerError;
}

export interface CompanyProfileAutoSaveData {
  company_name: string;
  company_registration: string;
  industry: string;
  company_size: string;
  website: string;
  bio: string;
}

export async function saveCompanyProfilePartial(userId: string, data: CompanyProfileAutoSaveData) {
  const { error } = await supabase.from('employer_profiles').upsert(
    {
      user_id: userId,
      company_name: data.company_name?.trim() || null,
      company_registration: data.company_registration?.trim() || null,
      industry: data.industry?.trim() || null,
      company_size: data.company_size?.trim() || null,
      website: data.website?.trim() || null,
      bio: data.bio?.trim() || null,
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}

export interface WorkerOnboardingAutoSaveData {
  fullName: string;
  mobile: string;
  currentCity: string;
  country: string;
  preferredWorkCity: string;
  primaryWorkType: string;
  secondarySkills: string[];
  experienceRange: string;
  skillLevel: string;
  projectTypes: string[];
  availability: string;
  openToRelocation: boolean;
  wageType: string;
  wageAmount: string;
  preferredShift: string;
  workPreference: string;
}

export async function saveWorkerOnboardingPartial(userId: string, data: WorkerOnboardingAutoSaveData) {
  const profileUpdate: { full_name?: string; phone?: string | null } = {};
  if (data.fullName.trim()) profileUpdate.full_name = data.fullName.trim();
  if (data.mobile !== undefined) profileUpdate.phone = data.mobile.trim() || null;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);
    if (profileErr) throw profileErr;
  }

  const { error: wpErr } = await supabase.from('worker_profiles').upsert(
    {
      user_id: userId,
      current_city: data.currentCity || null,
      country: data.country || null,
      preferred_work_city: data.preferredWorkCity || data.currentCity || null,
      primary_work_type: data.primaryWorkType || null,
      secondary_skills: data.secondarySkills.length > 0 ? data.secondarySkills : null,
      experience_range: data.experienceRange || null,
      skill_level: data.skillLevel || null,
      project_types_worked: data.projectTypes.length > 0 ? data.projectTypes : null,
      availability: data.availability || null,
      open_to_relocation: data.openToRelocation,
      expected_wage_type: data.wageType || null,
      expected_wage_amount: data.wageAmount ? Number(data.wageAmount) : null,
      preferred_shift: data.preferredShift || null,
      work_preference: data.workPreference || null,
    },
    { onConflict: 'user_id' },
  );

  if (wpErr) throw wpErr;
}

export interface EmployerOnboardingAutoSaveData {
  fullName: string;
  mobile: string;
  companyName: string;
  country: string;
  employerRole: string;
  businessType: string;
  companySize: string;
  workLocations: string[];
  officeAddress: string;
  officeState: string;
  cinNumber: string;
  taxInfoNumber: string;
  hiringRoles: string[];
  workerTypeNeeded: string;
  workersRequired: string;
  jobType: string;
  preferredCountries: string[];
  expectedStartDate: string;
  salaryType: string;
  salaryAmount: string;
  idType: string;
  idNumber: string;
  paymentMethod: string;
  billingAddress: string;
  gstNumber: string;
  followsSafety: boolean;
  providesPPE: string;
  safetyLevel: string;
}

export async function saveEmployerOnboardingPartial(userId: string, data: EmployerOnboardingAutoSaveData) {
  const profileUpdate: { full_name?: string; phone?: string | null } = {};
  if (data.fullName.trim()) profileUpdate.full_name = data.fullName.trim();
  if (data.mobile !== undefined) profileUpdate.phone = data.mobile.trim() || null;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);
    if (profileErr) throw profileErr;
  }

  const { error: epErr } = await supabase.from('employer_profiles').upsert(
    {
      user_id: userId,
      company_name: data.companyName || null,
      country: data.country || null,
      employer_role: data.employerRole || null,
      business_type: data.businessType || null,
      company_size: data.companySize || null,
      work_locations: data.workLocations.length > 0 ? data.workLocations : [],
      office_address: data.officeAddress || null,
      office_state: data.officeState || null,
      cin_number: data.cinNumber || null,
      tax_info_number: data.taxInfoNumber || null,
      hiring_roles: data.hiringRoles.length > 0 ? data.hiringRoles : [],
      worker_type_needed: data.workerTypeNeeded || null,
      workers_required: data.workersRequired ? Number(data.workersRequired) : null,
      job_type: data.jobType || null,
      preferred_countries: data.preferredCountries.length > 0 ? data.preferredCountries : [],
      expected_start_date: data.expectedStartDate || null,
      salary_type: data.salaryType || null,
      salary_amount: data.salaryAmount ? Number(data.salaryAmount) : null,
      id_type: data.idType || null,
      id_number: data.idNumber || null,
      payment_method_preference: data.paymentMethod || null,
      billing_address: data.billingAddress || null,
      gst_number: data.gstNumber || null,
      follows_safety_standards: data.followsSafety,
      provides_ppe: data.providesPPE || null,
      site_safety_level: data.safetyLevel || null,
    },
    { onConflict: 'user_id' },
  );

  if (epErr) throw epErr;
}
