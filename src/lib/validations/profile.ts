import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
});

export const workerProfileSchema = profileSchema.extend({
  skills: z.string()
    .max(200, 'Skills must be less than 200 characters')
    .optional(),
  experience_years: z.number()
    .min(0, 'Experience years must be positive')
    .max(50, 'Experience years must be less than 50')
    .optional(),
  certifications: z.string()
    .max(500, 'Certifications must be less than 500 characters')
    .optional(),
  has_passport: z.boolean().optional(),
  preferred_countries: z.string()
    .max(200, 'Preferred countries must be less than 200 characters')
    .optional(),
  expected_salary_min: z.number()
    .min(0, 'Salary must be positive')
    .optional(),
  expected_salary_max: z.number()
    .min(0, 'Salary must be positive')
    .optional(),
});

export const employerProfileSchema = profileSchema.extend({
  company_name: z.string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  company_registration: z.string()
    .max(50, 'Registration number must be less than 50 characters')
    .optional(),
  industry: z.string()
    .max(100, 'Industry must be less than 100 characters')
    .optional(),
  company_size: z.string()
    .max(50, 'Company size must be less than 50 characters')
    .optional(),
  website: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type WorkerProfileFormData = z.infer<typeof workerProfileSchema>;
export type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;
