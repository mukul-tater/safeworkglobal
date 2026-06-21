export type OnboardingStage =
  | 'REGISTERED'
  | 'PROFILE_COMPLETE'
  | 'SKILLS_UPLOADED'
  | 'JOB_READY';

export interface WorkerSkillProof {
  id: number;
  skillId: number;
  skillName: string;
  experienceYears: number | null;
  photoUrls: string[];
  videoUrls: string[];
}

export interface WorkerOnboardingData {
  workerId: number;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  address: string | null;
  pincode: string | null;
  educationLevel: string | null;
  stateId: number;
  stateName: string;
  districtId: number;
  districtName: string;
  primarySkillId: number;
  primarySkillName: string;
  experienceLevel: string;
  secondarySkillIds: number[];
  secondarySkillNames: string[];
  previousEmployer: string | null;
  preferredGccCountry: string | null;
  preferredGccCity: string | null;
  availability: string | null;
  openToRelocation: boolean;
  expectedSalaryMin: number | null;
  expectedSalaryCurrency: string;
  languages: string[];
  onboardingStage: OnboardingStage;
  currentStep: number;
  onboardingCompleted: boolean;
  skillProofs: WorkerSkillProof[];
  skillsWithMediaCount: number;
  canBrowseJobs: boolean;
  canApplyToJobs: boolean;
}

export interface OnboardingCompleteResult {
  worker: import('./worker.types').WorkerProfile;
  onboarding: WorkerOnboardingData;
}

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const EDUCATION_OPTIONS = [
  { value: 'NONE', label: 'No formal schooling' },
  { value: 'BELOW_10TH', label: 'Below 10th pass' },
  { value: '10TH', label: '10th pass' },
  { value: '12TH', label: '12th pass' },
  { value: 'GRADUATE', label: 'Graduate' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'WITHIN_15_DAYS', label: 'Within 15 days' },
  { value: 'WITHIN_30_DAYS', label: 'Within 30 days' },
  { value: 'WITHIN_60_DAYS', label: 'Within 60 days' },
] as const;

export const SALARY_CURRENCIES = [
  { value: 'AED', label: 'AED' },
  { value: 'SAR', label: 'SAR' },
  { value: 'QAR', label: 'QAR' },
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
] as const;

export const GCC_COUNTRIES = [
  'UAE',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Oman',
  'Bahrain',
] as const;

export const GCC_CITIES: Record<(typeof GCC_COUNTRIES)[number], string[]> = {
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Al Ain'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
  Qatar: ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail'],
  Kuwait: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya'],
  Oman: ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  Bahrain: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town'],
};

export const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Arabic', 'Tamil', 'Telugu', 'Malayalam',
  'Bengali', 'Punjabi', 'Marathi', 'Urdu', 'Nepali', 'Tagalog',
] as const;

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Personal & Location', stage: 'REGISTERED' },
  { id: 2, title: 'Work & GCC Jobs', stage: 'PROFILE_COMPLETE' },
  { id: 3, title: 'Skills & Proof', stage: 'SKILLS_UPLOADED' },
  { id: 4, title: 'Review & Finish', stage: 'JOB_READY' },
] as const;

export const STAGE_LABELS: Record<OnboardingStage, string> = {
  REGISTERED: 'Registered',
  PROFILE_COMPLETE: 'Profile complete',
  SKILLS_UPLOADED: 'Skills uploaded',
  JOB_READY: 'Job-ready',
};
