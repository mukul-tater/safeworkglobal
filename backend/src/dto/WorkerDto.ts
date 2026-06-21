import type { ExperienceLevel } from '../entity/Worker.js';

export interface WorkerRegisterRequestDto {
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  otpToken: string;
  fullName?: string;
}

export interface WorkerLoginRequestDto {
  mobileNumber?: string;
  email?: string;
  password: string;
}

export interface WorkerGoogleAuthRequestDto {
  email: string;
  fullName: string;
}

export interface WorkerGoogleAuthResponseDto {
  needsRegistration: true;
  email: string;
  fullName: string;
}

export interface WorkerAuthResponseDto {
  token: string;
  worker: WorkerProfileResponseDto;
}

export interface WorkerProfileResponseDto {
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

export interface ApiErrorResponseDto {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponseDto<T> {
  success: true;
  data: T;
  message?: string;
}
