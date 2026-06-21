import type { WorkerSkillProof } from '../entity/WorkerSkillProof.js';

export interface WorkerSkillProofResponseDto {
  id: number;
  skillId: number;
  skillName: string;
  experienceYears: number | null;
  photoUrls: string[];
  videoUrls: string[];
}

export interface WorkerOnboardingResponseDto {
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
  onboardingStage: string;
  currentStep: number;
  onboardingCompleted: boolean;
  skillProofs: WorkerSkillProofResponseDto[];
  skillsWithMediaCount: number;
  canBrowseJobs: boolean;
  canApplyToJobs: boolean;
}

export interface SaveOnboardingStepDto {
  step: 1 | 2;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  address?: string;
  pincode?: string;
  stateId?: number;
  districtId?: number;
  educationLevel?: string;
  primarySkillId?: number;
  experienceLevel?: string;
  preferredGccCountry?: string;
  preferredGccCity?: string;
  availability?: string;
  openToRelocation?: boolean;
  expectedSalaryMin?: number;
  expectedSalaryCurrency?: string;
  languages?: string[];
  secondarySkillIds?: number[];
  previousEmployer?: string;
}

export interface OnboardingCompleteResponseDto {
  worker: import('./WorkerDto.js').WorkerProfileResponseDto;
  onboarding: WorkerOnboardingResponseDto;
}

export function mapSkillProof(proof: WorkerSkillProof, baseUrl = ''): WorkerSkillProofResponseDto {
  const prefix = baseUrl.replace(/\/$/, '');
  const toUrl = (path: string) => (path.startsWith('http') ? path : `${prefix}${path}`);

  return {
    id: proof.id,
    skillId: proof.skillId,
    skillName: proof.skillName ?? '',
    experienceYears: proof.experienceYears,
    photoUrls: proof.photoPaths.map(toUrl),
    videoUrls: proof.videoPaths.map(toUrl),
  };
}
