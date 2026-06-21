import { z } from 'zod';

const pincodeRegex = /^[1-9]\d{5}$/;

export const onboardingStep1Schema = z.object({
  step: z.literal(1),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Address is required').max(500),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit pincode'),
  stateId: z.coerce.number().int().positive('State is required'),
  districtId: z.coerce.number().int().positive('District is required'),
  educationLevel: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  step: z.literal(2),
  primarySkillId: z.coerce.number().int().positive('Primary skill is required'),
  experienceLevel: z.enum(['FRESHER', 'ONE_TO_THREE', 'THREE_TO_FIVE', 'FIVE_PLUS']),
  preferredGccCountry: z.string().min(1, 'Select a GCC country'),
  preferredGccCity: z.string().trim().min(2, 'City is required'),
  availability: z.enum(['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS', 'WITHIN_60_DAYS']),
  openToRelocation: z.boolean(),
  expectedSalaryMin: z.coerce.number().positive().optional(),
  expectedSalaryCurrency: z.enum(['INR', 'AED', 'SAR', 'QAR', 'USD']).default('AED'),
  languages: z.array(z.string()).min(1),
  secondarySkillIds: z.array(z.number()).max(5).optional(),
  previousEmployer: z.string().optional(),
});

export type OnboardingStep1Values = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Values = z.infer<typeof onboardingStep2Schema>;
