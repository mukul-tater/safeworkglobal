import type { Response, NextFunction } from 'express';
import { WorkerJobApplicationService } from '../service/WorkerJobApplicationService.js';
import type { ApiSuccessResponseDto } from '../dto/WorkerDto.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ValidationException } from '../exception/AppException.js';

const applicationService = new WorkerJobApplicationService();

export class WorkerJobApplicationController {
  getStatus = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const jobId = String(req.query.jobId ?? '').trim();
      if (!jobId) {
        throw new ValidationException({ jobId: ['Job ID is required'] });
      }
      const data = applicationService.getApplicationStatus(req.workerId!, jobId);
      res.json({ success: true, data } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };

  apply = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const data = applicationService.apply(req.workerId!, {
        jobId: String(req.body?.jobId ?? ''),
        employerId: String(req.body?.employerId ?? ''),
        coverLetter: req.body?.coverLetter ? String(req.body.coverLetter) : undefined,
        resumeUrl: req.body?.resumeUrl ? String(req.body.resumeUrl) : undefined,
      });
      res.status(201).json({
        success: true,
        data,
        message: 'Application submitted',
      } satisfies ApiSuccessResponseDto<typeof data>);
    } catch (err) {
      next(err);
    }
  };
}

export const workerJobApplicationController = new WorkerJobApplicationController();
