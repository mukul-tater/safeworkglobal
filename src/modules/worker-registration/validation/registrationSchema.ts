import { z } from 'zod';
import { INDIAN_MOBILE_REGEX } from '@/lib/validations/common';
import { alphanumericPasswordSchema } from '@/lib/validations/password';

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
      .regex(phoneRegex, 'Enter a valid 10-digit mobile number')
      .optional()
      .or(z.literal('')),
    password: alphanumericPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    otpToken: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const workerLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type WorkerRegisterFormValues = z.infer<typeof workerRegisterSchema>;
export type WorkerLoginFormValues = z.infer<typeof workerLoginSchema>;
