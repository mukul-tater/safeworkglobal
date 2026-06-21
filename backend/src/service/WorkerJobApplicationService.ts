import { WorkerJobApplicationRepository } from '../repository/WorkerJobApplicationRepository.js';
import { WorkerOnboardingService } from './WorkerOnboardingService.js';
import { ConflictException, ValidationException } from '../exception/AppException.js';

export class WorkerJobApplicationService {
  constructor(
    private readonly applicationRepo = new WorkerJobApplicationRepository(),
    private readonly onboardingService = new WorkerOnboardingService()
  ) {}

  getApplicationStatus(workerId: number, jobId: string): { applied: boolean; applicationId?: number } {
    const existing = this.applicationRepo.findByWorkerAndJob(workerId, jobId);
    return existing ? { applied: true, applicationId: existing.id } : { applied: false };
  }

  apply(
    workerId: number,
    input: { jobId: string; employerId: string; coverLetter?: string; resumeUrl?: string }
  ): { id: number } {
    if (!input.jobId?.trim()) {
      throw new ValidationException({ jobId: ['Job ID is required'] });
    }
    if (!input.employerId?.trim()) {
      throw new ValidationException({ employerId: ['Employer ID is required'] });
    }

    const onboarding = this.onboardingService.getOnboarding(workerId);
    if (!onboarding.canApplyToJobs) {
      throw new ValidationException({
        profile: ['Complete your profile and add skill proof before applying'],
      });
    }

    const existing = this.applicationRepo.findByWorkerAndJob(workerId, input.jobId);
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    const application = this.applicationRepo.create({
      workerId,
      jobId: input.jobId,
      employerId: input.employerId,
      coverLetter: input.coverLetter?.trim() || 'Application submitted through platform',
      resumeUrl: input.resumeUrl ?? null,
    });

    return { id: application.id };
  }
}
