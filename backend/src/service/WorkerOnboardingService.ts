import {
  WorkerRepository,
  LocationRepository,
  SkillRepository,
} from '../repository/WorkerRepository.js';
import { WorkerOnboardingRepository } from '../repository/WorkerOnboardingRepository.js';
import { WorkerSkillProofRepository } from '../repository/WorkerSkillProofRepository.js';
import type {
  WorkerOnboardingResponseDto,
  SaveOnboardingStepDto,
} from '../dto/WorkerOnboardingDto.js';
import { mapSkillProof as mapProof } from '../dto/WorkerOnboardingDto.js';
import type { WorkerProfileResponseDto } from '../dto/WorkerDto.js';
import type { ExperienceLevel, WorkerStatus } from '../entity/Worker.js';
import type { OnboardingStage } from '../entity/WorkerOnboarding.js';
import { NotFoundException, ValidationException } from '../exception/AppException.js';

const STEP_COMPLETION: Record<1 | 2, number> = {
  1: 35,
  2: 60,
};

export class WorkerOnboardingService {
  constructor(
    private readonly workerRepo = new WorkerRepository(),
    private readonly onboardingRepo = new WorkerOnboardingRepository(),
    private readonly skillProofRepo = new WorkerSkillProofRepository(),
    private readonly locationRepo = new LocationRepository(),
    private readonly skillRepo = new SkillRepository()
  ) {}

  getOnboarding(workerId: number, baseUrl = ''): WorkerOnboardingResponseDto {
    this.ensureWorkerExists(workerId);
    let record = this.onboardingRepo.findByWorkerId(workerId);
    if (!record) {
      record = this.onboardingRepo.createEmpty(workerId);
    }
    return this.toResponse(workerId, record, baseUrl);
  }

  saveStep(workerId: number, dto: SaveOnboardingStepDto, baseUrl = ''): WorkerOnboardingResponseDto {
    this.ensureWorkerExists(workerId);

    if (dto.step === 1) {
      if (!dto.stateId || !dto.districtId) {
        throw new ValidationException({ stateId: ['State and district are required'] });
      }
      if (!this.locationRepo.districtBelongsToState(dto.districtId, dto.stateId)) {
        throw new ValidationException({ districtId: ['District does not belong to selected state'] });
      }

      this.workerRepo.updateProfileFields(workerId, {
        stateId: dto.stateId,
        districtId: dto.districtId,
      });

      const record = this.onboardingRepo.upsert({
        workerId,
        dateOfBirth: dto.dateOfBirth ?? null,
        gender: dto.gender ?? null,
        email: dto.email || null,
        address: dto.address ?? null,
        pincode: dto.pincode ?? null,
        educationLevel: dto.educationLevel || null,
        currentStep: 2,
        onboardingStage: 'PROFILE_COMPLETE',
      });

      this.workerRepo.updateProgress(workerId, STEP_COMPLETION[1], 'PROFILE_INCOMPLETE');
      return this.toResponse(workerId, record, baseUrl);
    }

    if (dto.step === 2) {
      if (!dto.primarySkillId) {
        throw new ValidationException({ primarySkillId: ['Primary skill is required'] });
      }
      if (!this.skillRepo.findById(dto.primarySkillId)) {
        throw new NotFoundException('Invalid primary skill');
      }
      if (dto.secondarySkillIds?.length) {
        for (const skillId of dto.secondarySkillIds) {
          if (!this.skillRepo.findById(skillId)) {
            throw new NotFoundException(`Invalid skill id: ${skillId}`);
          }
        }
      }

      this.workerRepo.updateProfileFields(workerId, {
        primarySkillId: dto.primarySkillId,
        experienceLevel: dto.experienceLevel as ExperienceLevel,
      });

      const record = this.onboardingRepo.upsert({
        workerId,
        secondarySkillIds: dto.secondarySkillIds ?? [],
        previousEmployer: dto.previousEmployer || null,
        preferredGccCountry: dto.preferredGccCountry ?? null,
        preferredGccCity: dto.preferredGccCity ?? null,
        preferredCountries: dto.preferredGccCountry ? [dto.preferredGccCountry] : [],
        availability: dto.availability ?? null,
        openToRelocation: dto.openToRelocation ?? true,
        expectedSalaryMin: dto.expectedSalaryMin ?? null,
        expectedSalaryCurrency: dto.expectedSalaryCurrency ?? 'AED',
        languages: dto.languages ?? [],
        currentStep: 3,
        onboardingStage: 'PROFILE_COMPLETE',
      });

      this.workerRepo.updateProgress(workerId, STEP_COMPLETION[2], 'PROFILE_INCOMPLETE');
      return this.toResponse(workerId, record, baseUrl);
    }

    throw new ValidationException({ step: ['Invalid step'] });
  }

  listSkillProofs(workerId: number, baseUrl = '') {
    this.ensureWorkerExists(workerId);
    return this.skillProofRepo.findByWorkerId(workerId).map((p) => mapProof(p, baseUrl));
  }

  addSkillProof(workerId: number, skillId: number, experienceYears?: number, baseUrl = '') {
    this.ensureWorkerExists(workerId);
    if (!this.skillRepo.findById(skillId)) {
      throw new NotFoundException('Invalid skill');
    }
    const proof = this.skillProofRepo.upsert(workerId, skillId, experienceYears ?? null);
    this.syncSkillsStage(workerId);
    return mapProof(proof, baseUrl);
  }

  uploadSkillMedia(
    workerId: number,
    proofId: number,
    type: 'photo' | 'video',
    relativePath: string,
    baseUrl = ''
  ) {
    this.ensureWorkerExists(workerId);
    const updated = this.skillProofRepo.appendMedia(proofId, workerId, type, relativePath);
    if (!updated) throw new NotFoundException('Skill proof not found');
    this.syncSkillsStage(workerId);
    return mapProof(updated, baseUrl);
  }

  removeSkillProof(workerId: number, proofId: number, baseUrl = '') {
    this.ensureWorkerExists(workerId);
    const deleted = this.skillProofRepo.delete(proofId, workerId);
    if (!deleted) throw new NotFoundException('Skill proof not found');
    this.syncSkillsStage(workerId);
    return this.getOnboarding(workerId, baseUrl);
  }

  removeSkillMedia(
    workerId: number,
    proofId: number,
    type: 'photo' | 'video',
    mediaUrl: string,
    baseUrl = ''
  ) {
    this.ensureWorkerExists(workerId);
    const proof = this.skillProofRepo.findById(proofId, workerId);
    if (!proof) throw new NotFoundException('Skill proof not found');

    const paths = type === 'photo' ? proof.photoPaths : proof.videoPaths;
    const relativePath = this.resolveMediaPath(paths, mediaUrl, baseUrl);
    if (!relativePath) {
      throw new NotFoundException('Media not found on this skill');
    }

    const updated = this.skillProofRepo.removeMedia(proofId, workerId, type, relativePath);
    if (!updated) throw new NotFoundException('Skill proof not found');
    this.syncSkillsStage(workerId);
    return mapProof(updated, baseUrl);
  }

  private resolveMediaPath(storedPaths: string[], mediaUrl: string, baseUrl: string): string | null {
    const normalizedUrl = mediaUrl.trim();
    const prefix = baseUrl.replace(/\/$/, '');

    for (const path of storedPaths) {
      const fullUrl = path.startsWith('http') ? path : `${prefix}${path}`;
      if (fullUrl === normalizedUrl || normalizedUrl.endsWith(path)) {
        return path;
      }
    }

    try {
      const pathname = new URL(normalizedUrl).pathname;
      return storedPaths.find((path) => pathname.endsWith(path) || pathname === path) ?? null;
    } catch {
      return null;
    }
  }

  markReviewReady(workerId: number, baseUrl = ''): WorkerOnboardingResponseDto {
    this.ensureWorkerExists(workerId);
    if (!this.skillProofRepo.hasValidSkillProof(workerId)) {
      throw new ValidationException({
        skillProofs: ['Add at least one skill with a photo or video before continuing'],
      });
    }
    const record = this.onboardingRepo.upsert({ workerId, currentStep: 4 });
    return this.toResponse(workerId, record, baseUrl);
  }

  complete(workerId: number, baseUrl = ''): {
    onboarding: WorkerOnboardingResponseDto;
    worker: WorkerProfileResponseDto;
  } {
    this.ensureWorkerExists(workerId);

    if (!this.skillProofRepo.hasValidSkillProof(workerId)) {
      throw new ValidationException({
        skillProofs: ['Upload at least one skill with a photo or video before completing'],
      });
    }

    const record = this.onboardingRepo.upsert({
      workerId,
      currentStep: 4,
      onboardingStage: 'JOB_READY',
      onboardingCompleted: true,
    });

    this.workerRepo.updateProgress(workerId, 100, 'JOB_READY');

    return {
      onboarding: this.toResponse(workerId, record, baseUrl),
      worker: this.buildWorkerProfile(workerId),
    };
  }

  private syncSkillsStage(workerId: number): void {
    const hasMedia = this.skillProofRepo.hasValidSkillProof(workerId);
    const stage: OnboardingStage = hasMedia ? 'SKILLS_UPLOADED' : 'PROFILE_COMPLETE';
    const completion = hasMedia ? 85 : STEP_COMPLETION[2];
    const status: WorkerStatus = hasMedia ? 'PROFILE_COMPLETED' : 'PROFILE_INCOMPLETE';

    this.onboardingRepo.upsert({ workerId, onboardingStage: stage });
    if (!this.onboardingRepo.findByWorkerId(workerId)?.onboardingCompleted) {
      this.workerRepo.updateProgress(workerId, completion, status);
    }
  }

  private toResponse(
    workerId: number,
    record: import('../entity/WorkerOnboarding.js').WorkerOnboarding,
    baseUrl: string
  ): WorkerOnboardingResponseDto {
    const worker = this.workerRepo.findById(workerId)!;
    const state = this.locationRepo.findStateById(worker.stateId);
    const district = this.locationRepo.findDistrictById(worker.districtId);
    const primarySkill = this.skillRepo.findById(worker.primarySkillId);

    const secondarySkillNames = record.secondarySkillIds
      .map((id) => this.skillRepo.findById(id)?.name)
      .filter((name): name is string => !!name);

    const skillProofs = this.skillProofRepo.findByWorkerId(workerId).map((p) => mapProof(p, baseUrl));
    const skillsWithMediaCount = this.skillProofRepo.countWithMedia(workerId);

    const profileComplete =
      !!record.dateOfBirth &&
      !!record.gender &&
      !!record.address &&
      !!record.pincode &&
      worker.stateId > 0 &&
      worker.districtId > 0;

    const workPrefsComplete =
      !!record.preferredGccCountry &&
      !!record.preferredGccCity &&
      !!record.availability &&
      record.languages.length > 0 &&
      worker.primarySkillId > 0;

    return {
      workerId,
      dateOfBirth: record.dateOfBirth,
      gender: record.gender,
      email: record.email,
      address: record.address,
      pincode: record.pincode,
      educationLevel: record.educationLevel,
      stateId: worker.stateId,
      stateName: state?.name ?? '',
      districtId: worker.districtId,
      districtName: district?.name ?? '',
      primarySkillId: worker.primarySkillId,
      primarySkillName: primarySkill?.name ?? '',
      experienceLevel: worker.experienceLevel,
      secondarySkillIds: record.secondarySkillIds,
      secondarySkillNames,
      previousEmployer: record.previousEmployer,
      preferredGccCountry: record.preferredGccCountry,
      preferredGccCity: record.preferredGccCity,
      availability: record.availability,
      openToRelocation: record.openToRelocation,
      expectedSalaryMin: record.expectedSalaryMin,
      expectedSalaryCurrency: record.expectedSalaryCurrency,
      languages: record.languages,
      onboardingStage: record.onboardingStage,
      currentStep: record.currentStep,
      onboardingCompleted: record.onboardingCompleted,
      skillProofs,
      skillsWithMediaCount,
      canBrowseJobs: profileComplete && workPrefsComplete,
      canApplyToJobs: record.onboardingCompleted && skillsWithMediaCount > 0,
    };
  }

  private buildWorkerProfile(workerId: number): WorkerProfileResponseDto {
    const worker = this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker not found');

    const state = this.locationRepo.findStateById(worker.stateId);
    const district = this.locationRepo.findDistrictById(worker.districtId);
    const skill = this.skillRepo.findById(worker.primarySkillId);
    const onboarding = this.onboardingRepo.findByWorkerId(workerId);

    return {
      id: worker.id,
      workerCode: worker.workerCode,
      fullName: worker.fullName,
      email: worker.email,
      mobileNumber: worker.mobileNumber,
      aadhaarNumber: worker.aadhaarNumber,
      stateId: worker.stateId,
      stateName: state?.name ?? '',
      districtId: worker.districtId,
      districtName: district?.name ?? '',
      primarySkillId: worker.primarySkillId,
      primarySkillName: skill?.name ?? '',
      experienceLevel: worker.experienceLevel,
      profileCompletionPercentage: worker.profileCompletionPercentage,
      registrationSource: worker.registrationSource,
      status: worker.status,
      onboardingCompleted: onboarding?.onboardingCompleted ?? false,
      onboardingStage: onboarding?.onboardingStage ?? 'REGISTERED',
      skillsWithMediaCount: this.skillProofRepo.countWithMedia(workerId),
      createdDate: worker.createdDate,
      updatedDate: worker.updatedDate,
    };
  }

  private ensureWorkerExists(workerId: number): void {
    if (!this.workerRepo.findById(workerId)) {
      throw new NotFoundException('Worker not found');
    }
  }
}
