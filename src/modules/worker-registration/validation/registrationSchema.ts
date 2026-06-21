import { z } from 'zod';
import { INDIAN_MOBILE_REGEX } from '@/lib/validations/common';

const phoneRegex = INDIAN_MOBILE_REGEX;

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);

export const workerRegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(120, 'Name is too long'),
    email: emailSchema,
    mobileNumber: z
      .string()
      .regex(phoneRegex, 'Enter a valid 10-digit mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    otpToken: z.string().min(1, 'Verify your mobile number with OTP'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const workerLoginSchema = z
  .object({
    loginMethod: z.enum(['mobile', 'email']).default('mobile'),
    mobileNumber: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .superRefine((data, ctx) => {
    if (data.loginMethod === 'mobile') {
      if (!data.mobileNumber || !phoneRegex.test(data.mobileNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid 10-digit mobile number',
          path: ['mobileNumber'],
        });
      }
    } else if (!data.email || !emailSchema.safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email address',
        path: ['email'],
      });
    }
  });

export type WorkerRegisterFormValues = z.infer<typeof workerRegisterSchema>;
export type WorkerLoginFormValues = z.infer<typeof workerLoginSchema>;
