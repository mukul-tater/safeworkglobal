import type { Response, NextFunction } from 'express';
import { WorkerOnboardingService } from '../service/WorkerOnboardingService.js';
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  skillProofCreateSchema,
  formatZodErrors,
} from '../validation/onboardingValidation.js';
import { ValidationException } from '../exception/AppException.js';
import type { ApiSuccessResponseDto } from '../dto/WorkerDto.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { relativeUploadPath } from '../middleware/uploadMiddleware.js';

const onboardingService = new WorkerOnboardingService();

function baseUrl(req: AuthenticatedRequest): string {
  return `${req.protocol}://${req.get('host')}`;
}

export class WorkerOnboardingController {
  getOnboarding = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const data = onboardingService.getOnboarding(req.workerId!, baseUrl(req));
      const body: ApiSuccessResponseDto<typeof data> = { success: true, data };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  saveStep = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const step = Number(req.body?.step);
      if (step === 1) {
        const parsed = onboardingStep1Schema.safeParse(req.body);
        if (!parsed.success) throw new ValidationException(formatZodErrors(parsed.error));
        const data = onboardingService.saveStep(req.workerId!, parsed.data, baseUrl(req));
        res.json({ success: true, data, message: 'Step 1 saved' } satisfies ApiSuccessResponseDto<typeof data>);
        return;
      }
      if (step === 2) {
        const parsed = onboardingStep2Schema.safeParse(req.body);
        if (!parsed.success) throw new ValidationException(formatZodErrors(parsed.error));
        const data = onboardingService.saveStep(req.workerId!, parsed.data, baseUrl(req));
        res.json({ success: true, data, message: 'Step 2 saved' } satisfies ApiSuccessResponseDto<typeof data>);
        return;
      }
      throw new ValidationException({ step: ['Step must be 1 or 2'] });
    } catch (err) {
      next(err);
    }
  };

  listSkillProofs = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const data = onboardingService.listSkillProofs(req.workerId!, baseUrl(req));
      res.json({ success: true, data } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  addSkillProof = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const parsed = skillProofCreateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException(formatZodErrors(parsed.error));
      const data = onboardingService.addSkillProof(
        req.workerId!,
        parsed.data.skillId,
        parsed.data.experienceYears,
        baseUrl(req)
      );
      res.json({ success: true, data, message: 'Skill added' } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  uploadPhoto = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const proofId = Number(req.params.proofId);
      const file = req.file;
      if (!file) throw new ValidationException({ file: ['Photo file is required'] });

      const data = onboardingService.uploadSkillMedia(
        req.workerId!,
        proofId,
        'photo',
        relativeUploadPath(file.filename),
        baseUrl(req)
      );
      res.json({ success: true, data, message: 'Photo uploaded' } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  uploadVideo = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const proofId = Number(req.params.proofId);
      const file = req.file;
      if (!file) throw new ValidationException({ file: ['Video file is required'] });

      const data = onboardingService.uploadSkillMedia(
        req.workerId!,
        proofId,
        'video',
        relativeUploadPath(file.filename),
        baseUrl(req)
      );
      res.json({ success: true, data, message: 'Video uploaded' } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  deleteSkillProof = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const proofId = Number(req.params.proofId);
      const data = onboardingService.removeSkillProof(req.workerId!, proofId, baseUrl(req));
      res.json({ success: true, data, message: 'Skill removed' } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  advanceToReview = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const data = onboardingService.markReviewReady(req.workerId!, baseUrl(req));
      res.json({ success: true, data, message: 'Ready to review' } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  complete = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const result = onboardingService.complete(req.workerId!, baseUrl(req));
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Onboarding completed successfully',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };
}

export const workerOnboardingController = new WorkerOnboardingController();
