export type ExperienceLevel =
  | 'FRESHER'
  | 'ONE_TO_THREE'
  | 'THREE_TO_FIVE'
  | 'FIVE_PLUS';

export interface State {
  id: number;
  name: string;
}

export interface District {
  id: number;
  stateId: number;
  name: string;
}

export interface Skill {
  id: number;
  name: string;
}

export interface WorkerProfile {
  id: number;
  workerCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  aadhaarNumber: string;
  stateId: number;
  stateName: string;
  districtId: number;
  districtName: string;
  primarySkillId: number;
  primarySkillName: string;
  experienceLevel: ExperienceLevel;
  profileCompletionPercentage: number;
  registrationSource: string;
  status: string;
  onboardingCompleted: boolean;
  onboardingStage?: string;
  skillsWithMediaCount?: number;
  createdDate: string;
  updatedDate: string;
}

export interface WorkerRegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  otpToken: string;
}

export interface SendOtpResponse {
  demo?: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  otpToken: string;
  expiresInSeconds: number;
}

export interface WorkerLoginPayload {
  mobileNumber?: string;
  email?: string;
  password: string;
}

export interface WorkerGoogleAuthPayload {
  email: string;
  fullName: string;
}

export type WorkerGoogleAuthResponse =
  | WorkerAuthResponse
  | { needsRegistration: true; email: string; fullName: string };

export interface WorkerAuthResponse {
  token: string;
  worker: WorkerProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'ONE_TO_THREE', label: '1-3 Years' },
  { value: 'THREE_TO_FIVE', label: '3-5 Years' },
  { value: 'FIVE_PLUS', label: '5+ Years' },
];
