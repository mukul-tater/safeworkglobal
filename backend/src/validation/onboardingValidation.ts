import { z } from 'zod';

const pincodeRegex = /^[1-9]\d{5}$/;

export const GCC_COUNTRIES = [
  'UAE',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Oman',
  'Bahrain',
] as const;

export const EDUCATION_LEVELS = [
  'NONE',
  'BELOW_10TH',
  '10TH',
  '12TH',
  'GRADUATE',
  'OTHER',
] as const;

export const onboardingStep1Schema = z.object({
  step: z.literal(1),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Address is required').max(500),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit pincode'),
  stateId: z.coerce.number().int().positive('State is required'),
  districtId: z.coerce.number().int().positive('District is required'),
  educationLevel: z.enum(EDUCATION_LEVELS).optional().or(z.literal('')),
});

export const onboardingStep2Schema = z.object({
  step: z.literal(2),
  primarySkillId: z.coerce.number().int().positive('Primary skill is required'),
  experienceLevel: z.enum(['FRESHER', 'ONE_TO_THREE', 'THREE_TO_FIVE', 'FIVE_PLUS'], {
    required_error: 'Experience is required',
  }),
  preferredGccCountry: z.enum(GCC_COUNTRIES, { required_error: 'Select a GCC country' }),
  preferredGccCity: z.string().trim().min(2, 'City is required').max(80),
  availability: z.enum(['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS', 'WITHIN_60_DAYS'], {
    required_error: 'Availability is required',
  }),
  openToRelocation: z.boolean(),
  expectedSalaryMin: z.coerce.number().positive('Expected salary must be positive').optional(),
  expectedSalaryCurrency: z.enum(['INR', 'AED', 'SAR', 'QAR', 'USD']).default('AED'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  secondarySkillIds: z.array(z.number().int().positive()).max(5).optional(),
  previousEmployer: z.string().trim().max(150).optional().or(z.literal('')),
});

export const skillProofCreateSchema = z.object({
  skillId: z.coerce.number().int().positive('Skill is required'),
  experienceYears: z.coerce.number().min(0).max(50).optional(),
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
