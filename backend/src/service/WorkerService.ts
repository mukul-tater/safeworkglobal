import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  WorkerRepository,
  LocationRepository,
  SkillRepository,
} from '../repository/WorkerRepository.js';
import { WorkerOnboardingRepository } from '../repository/WorkerOnboardingRepository.js';
import type {
  WorkerRegisterRequestDto,
  WorkerLoginRequestDto,
  WorkerGoogleAuthRequestDto,
  WorkerGoogleAuthResponseDto,
  WorkerProfileResponseDto,
  WorkerAuthResponseDto,
} from '../dto/WorkerDto.js';
import { ConflictException, NotFoundException, UnauthorizedException } from '../exception/AppException.js';
import { otpService } from './OtpService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gigbridge-worker-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export class WorkerService {
  constructor(
    private readonly workerRepo = new WorkerRepository(),
    private readonly locationRepo = new LocationRepository(),
    private readonly skillRepo = new SkillRepository(),
    private readonly onboardingRepo = new WorkerOnboardingRepository()
  ) {}

  async register(dto: WorkerRegisterRequestDto): Promise<WorkerAuthResponseDto> {
    otpService.consumeRegistrationToken(dto.mobileNumber, dto.otpToken);

    const existingMobile = this.workerRepo.findByMobile(dto.mobileNumber);
    if (existingMobile) {
      throw new ConflictException('Mobile number is already registered', {
        mobileNumber: ['This mobile number is already registered'],
      });
    }

    const existingEmail = this.workerRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered', {
        email: ['This email is already registered'],
      });
    }

    const defaults = this.resolveRegistrationDefaults();
    const fullName =
      dto.fullName?.trim() ||
      dto.email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ||
      `Worker ${dto.mobileNumber.slice(-4)}`;

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const workerCode = this.workerRepo.getNextWorkerCode();

    const worker = this.workerRepo.create({
      workerCode,
      fullName,
      email: dto.email.trim().toLowerCase(),
      mobileNumber: dto.mobileNumber,
      passwordHash,
      aadhaarNumber: 'PENDING',
      stateId: defaults.stateId,
      districtId: defaults.districtId,
      primarySkillId: defaults.primarySkillId,
      experienceLevel: 'FRESHER',
      mobileVerified: true,
      profileCompletionPercentage: 10,
      status: 'PROFILE_INCOMPLETE',
    });

    const profile = this.toProfileResponse(worker.id)!;
    const token = this.generateToken(worker.id, worker.mobileNumber);

    return { token, worker: profile };
  }

  async login(dto: WorkerLoginRequestDto): Promise<WorkerAuthResponseDto> {
    const worker = dto.email
      ? this.workerRepo.findByEmail(dto.email)
      : this.workerRepo.findByMobile(dto.mobileNumber!);

    if (!worker) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, worker.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const profile = this.toProfileResponse(worker.id)!;
    const token = this.generateToken(worker.id, worker.mobileNumber);

    return { token, worker: profile };
  }

  async googleAuth(
    dto: WorkerGoogleAuthRequestDto
  ): Promise<WorkerAuthResponseDto | WorkerGoogleAuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const existing = this.workerRepo.findByEmail(email);

    if (!existing) {
      return {
        needsRegistration: true,
        email,
        fullName: dto.fullName.trim(),
      };
    }

    const profile = this.toProfileResponse(existing.id)!;
    const token = this.generateToken(existing.id, existing.mobileNumber);
    return { token, worker: profile };
  }

  getProfile(id: number): WorkerProfileResponseDto {
    const profile = this.toProfileResponse(id);
    if (!profile) {
      throw new NotFoundException('Worker not found');
    }
    return profile;
  }

  getReferenceData() {
    return {
      states: this.locationRepo.findAllStates(),
      skills: this.skillRepo.findAll(),
    };
  }

  getDistrictsByState(stateId: number) {
    const state = this.locationRepo.findStateById(stateId);
    if (!state) {
      throw new NotFoundException('State not found');
    }
    return this.locationRepo.findDistrictsByStateId(stateId);
  }

  private toProfileResponse(id: number): WorkerProfileResponseDto | null {
    const worker = this.workerRepo.findById(id);
    if (!worker) return null;

    const state = this.locationRepo.findStateById(worker.stateId);
    const district = this.locationRepo.findDistrictById(worker.districtId);
    const skill = this.skillRepo.findById(worker.primarySkillId);
    const onboarding = this.onboardingRepo.findByWorkerId(id);

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
      createdDate: worker.createdDate,
      updatedDate: worker.updatedDate,
    };
  }

  private resolveRegistrationDefaults(): { stateId: number; districtId: number; primarySkillId: number } {
    const states = this.locationRepo.findAllStates();
    const state = states[0];
    if (!state) {
      throw new NotFoundException('Reference data not available. Contact support.');
    }

    const districts = this.locationRepo.findDistrictsByStateId(state.id);
    const district = districts[0];
    if (!district) {
      throw new NotFoundException('Reference data not available. Contact support.');
    }

    const skills = this.skillRepo.findAll();
    const skill = skills[0];
    if (!skill) {
      throw new NotFoundException('Reference data not available. Contact support.');
    }

    return { stateId: state.id, districtId: district.id, primarySkillId: skill.id };
  }

  private generateToken(workerId: number, mobileNumber: string): string {
    return jwt.sign({ sub: workerId, mobileNumber, type: 'worker' }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): { workerId: number } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: number };
      return { workerId: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
