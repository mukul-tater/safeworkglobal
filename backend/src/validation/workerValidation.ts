import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/;
export const experienceLevelSchema = z.enum([
  'FRESHER',
  'ONE_TO_THREE',
  'THREE_TO_FIVE',
  'FIVE_PLUS',
]);

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);

export const workerRegisterSchema = z
  .object({
    email: emailSchema,
    mobileNumber: z
      .string()
      .regex(phoneRegex, 'Mobile number must be 10 digits starting with 6-9'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password is too long')
      .regex(/^[a-zA-Z0-9]+$/, 'Password can only contain letters and numbers'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    otpToken: z.string().min(1, 'Verify your mobile number with OTP'),
    fullName: z.string().trim().min(2).max(120).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const workerLoginSchema = z
  .object({
    mobileNumber: z
      .string()
      .regex(phoneRegex, 'Mobile number must be 10 digits starting with 6-9')
      .optional(),
    email: emailSchema.optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => data.mobileNumber || data.email, {
    message: 'Enter your mobile number or email',
    path: ['mobileNumber'],
  });

export const workerGoogleAuthSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
});

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) errors[key] = [];
    errors[key].push(issue.message);
  }
  return errors;
}
