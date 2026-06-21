import { z } from 'zod';
import {
  indianMobileRequired,
  optionalFutureDateString,
  personNameRequired,
} from '@/lib/validations/common';

export const workerOnboardingStep1Schema = z.object({
  fullName: personNameRequired,
  mobile: indianMobileRequired,
  currentCity: z.string().trim().min(2, 'Current city is required').max(80),
  country: z.string().min(1, 'Country is required'),
  preferredWorkCity: z.string().trim().max(80).optional().or(z.literal('')),
});

export const workerOnboardingStep2Schema = z.object({
  primaryWorkType: z.string().min(1, 'Primary work type is required'),
  experienceRange: z.string().min(1, 'Experience range is required'),
  skillLevel: z.string().min(1, 'Skill level is required'),
});

export const employerOnboardingStep1Schema = z.object({
  fullName: personNameRequired,
  mobile: indianMobileRequired,
  companyName: z.string().trim().min(2, 'Company name is required').max(100),
  country: z.string().min(1, 'Country is required'),
  employerRole: z.string().min(1, 'Your role is required'),
});

export const employerOnboardingStep2Schema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  companySize: z.string().min(1, 'Company size is required'),
});

export const employerOnboardingStep3Schema = z.object({
  hiringRoles: z.array(z.string()).min(1, 'Select at least one hiring role'),
  workerTypeNeeded: z.string().min(1, 'Worker type is required'),
  workersRequired: z
    .string()
    .trim()
    .min(1, 'Workers required is required')
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'Enter a valid number of workers'),
  expectedStartDate: optionalFutureDateString,
});

export const quickWorkerSignupSchema = z.object({
  name: personNameRequired,
  country: z.string().min(1, 'Please select your country'),
  mobile: indianMobileRequired,
});

export const quickEmployerSignupSchema = z.object({
  fullName: personNameRequired,
  email: z.string().trim().email('Enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
