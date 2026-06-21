export type OnboardingStage =
  | 'REGISTERED'
  | 'PROFILE_COMPLETE'
  | 'SKILLS_UPLOADED'
  | 'JOB_READY';

export interface WorkerOnboarding {
  id: number;
  workerId: number;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  address: string | null;
  pincode: string | null;
  educationLevel: string | null;
  secondarySkillIds: number[];
  previousEmployer: string | null;
  hasPassport: boolean;
  passportNumber: string | null;
  ecrStatus: string | null;
  preferredCountries: string[];
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
  createdDate: string;
  updatedDate: string;
}
