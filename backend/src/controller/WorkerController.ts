import type { Request, Response, NextFunction } from 'express';
import { WorkerService } from '../service/WorkerService.js';
import { otpService } from '../service/OtpService.js';
import {
  workerRegisterSchema,
  workerLoginSchema,
  workerGoogleAuthSchema,
  formatZodErrors,
} from '../validation/workerValidation.js';
import { sendOtpSchema, verifyOtpSchema, verifyFirebaseOtpSchema } from '../validation/otpValidation.js';
import { verifyPhoneIdToken } from '../service/FirebaseAdminService.js';
import { ValidationException } from '../exception/AppException.js';
import type { ApiSuccessResponseDto } from '../dto/WorkerDto.js';

const workerService = new WorkerService();

export class WorkerController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = workerRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await workerService.register(parsed.data);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Registration successful',
      };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = workerLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await workerService.login(parsed.data);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Login successful',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  getProfile = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        throw new ValidationException({ id: ['Invalid worker id'] });
      }

      const profile = workerService.getProfile(id);
      const body: ApiSuccessResponseDto<typeof profile> = {
        success: true,
        data: profile,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  getReferenceData = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = workerService.getReferenceData();
      const body: ApiSuccessResponseDto<typeof data> = {
        success: true,
        data,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = workerGoogleAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await workerService.googleAuth(parsed.data);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'needsRegistration' in result ? 'Complete registration' : 'Google sign-in successful',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = sendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await otpService.sendOtp(parsed.data.mobileNumber);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: result.message,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = otpService.verifyOtp(parsed.data.mobileNumber, parsed.data.otp);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Mobile number verified',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  verifyFirebaseOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyFirebaseOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      await verifyPhoneIdToken(parsed.data.idToken, parsed.data.mobileNumber);
      const result = otpService.issueRegistrationToken(parsed.data.mobileNumber);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Mobile number verified via Firebase',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  sendGuarantorOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = sendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await otpService.sendGuarantorOtp(parsed.data.mobileNumber);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: result.message,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  verifyGuarantorOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException(formatZodErrors(parsed.error));
      }

      const result = await otpService.verifyGuarantorOtp(parsed.data.mobileNumber, parsed.data.otp);
      const body: ApiSuccessResponseDto<typeof result> = {
        success: true,
        data: result,
        message: 'Guarantor mobile verified',
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };

  getDistricts = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const stateId = Number(req.params.stateId);
      if (Number.isNaN(stateId)) {
        throw new ValidationException({ stateId: ['Invalid state id'] });
      }

      const districts = workerService.getDistrictsByState(stateId);
      const body: ApiSuccessResponseDto<typeof districts> = {
        success: true,
        data: districts,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  };
}

export const workerController = new WorkerController();
