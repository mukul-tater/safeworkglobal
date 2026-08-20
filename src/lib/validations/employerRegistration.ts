import { z } from 'zod';
import {
  emailRequired,
  optionalFutureDateString,
  personNameRequired,
  uaeMobileOptional,
  uaeMobileRequired,
} from '@/lib/validations/common';
import {
  BUSINESS_ACTIVITIES,
  COMMUNICATION_CHANNELS,
  COMPANY_TYPES,
  CONTACT_DESIGNATIONS,
  EMPLOYER_TRADES,
  EXPERIENCE_RANGES,
  GENDER_PREFERENCES,
  PROJECT_DURATIONS,
  UAE_EMIRATES,
  skillsForTrade,
} from '@/lib/employerTradeSkills';

const optionalUrl = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^https?:\/\/.+/i.test(v) || /^[\w.-]+\.[a-z]{2,}/i.test(v), 'Enter a valid website URL');

export const employerCompanySchema = z.object({
  companyLegalName: z.string().trim().min(2, 'Company legal name is required').max(160),
  tradeName: z.string().trim().max(160).optional().or(z.literal('')),
  companyType: z
    .string()
    .min(1, 'Company type is required')
    .refine((v) => (COMPANY_TYPES as readonly string[]).includes(v), 'Select a valid company type'),
  businessActivity: z
    .string()
    .min(1, 'Business activity is required')
    .refine((v) => (BUSINESS_ACTIVITIES as readonly string[]).includes(v), 'Select a valid business activity'),
  emirate: z
    .string()
    .min(1, 'Emirate is required')
    .refine((v) => (UAE_EMIRATES as readonly string[]).includes(v), 'Select a valid emirate'),
  website: optionalUrl,
  linkedin: optionalUrl,
  tradeLicencePath: z.string().trim().min(1, 'Trade / commercial licence is required'),
  companyProfilePath: z.string().trim().optional().or(z.literal('')),
});

export const employerContactSchema = z.object({
  fullName: personNameRequired,
  designation: z
    .string()
    .min(1, 'Designation is required')
    .refine((v) => (CONTACT_DESIGNATIONS as readonly string[]).includes(v), 'Select a valid designation'),
  uaeMobile: uaeMobileRequired,
  whatsapp: uaeMobileOptional,
  businessEmail: emailRequired,
  preferredCommunication: z
    .string()
    .min(1, 'Preferred communication is required')
    .refine((v) => (COMMUNICATION_CHANNELS as readonly string[]).includes(v), 'Select a communication channel'),
  additionalContact: uaeMobileOptional,
});

export const manpowerRequirementSchema = z
  .object({
    id: z.string(),
    trade: z.string().min(1, 'Job role / trade is required'),
    customTrade: z.string().trim().max(80).optional().or(z.literal('')),
    numberOfWorkers: z
      .string()
      .trim()
      .min(1, 'Number of workers is required')
      .refine((v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 5000, 'Enter a valid number of workers'),
    experience: z.string().optional().or(z.literal('')),
    location: z.string().trim().min(2, 'Work location is required').max(120),
    projectName: z.string().trim().max(160).optional().or(z.literal('')),
    joiningDate: optionalFutureDateString,
    projectDuration: z.string().optional().or(z.literal('')),
    gender: z
      .string()
      .min(1)
      .refine((v) => (GENDER_PREFERENCES as readonly string[]).includes(v), 'Select a gender preference'),
    technicalSkills: z.array(z.string()),
    additionalRequirements: z.string().trim().max(4000).optional().or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    const known = (EMPLOYER_TRADES as readonly string[]).includes(value.trade);
    if (!known && !value.trade.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Job role / trade is required', path: ['trade'] });
    }
    if (value.trade === 'Other' && !value.customTrade?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the job role / trade',
        path: ['customTrade'],
      });
    }
    if (value.experience && !(EXPERIENCE_RANGES as readonly string[]).includes(value.experience)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a valid experience range', path: ['experience'] });
    }
    if (value.projectDuration && !(PROJECT_DURATIONS as readonly string[]).includes(value.projectDuration)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a valid project duration', path: ['projectDuration'] });
    }
    const allowed = new Set(skillsForTrade(value.trade));
    if (value.technicalSkills.some((skill) => allowed.size > 0 && !allowed.has(skill))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Remove skills that do not match the selected trade',
        path: ['technicalSkills'],
      });
    }
  });

export const employerWorkforceSchema = z.object({
  requirements: z.array(manpowerRequirementSchema).min(1, 'Add at least one manpower requirement'),
});

export const employerPartnershipSchema = z.object({
  partnershipModel: z
    .string()
    .min(1, 'Select a commercial model')
    .refine((v) => v === 'percent_1' || v === 'custom', 'Select a commercial model'),
  commercialNotes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const employerDeclarationsSchema = z.object({
  authorized: z.boolean().refine((v) => v === true, 'Please confirm you are authorized to submit this requirement'),
  accurate: z.boolean().refine((v) => v === true, 'Please confirm the information is accurate'),
  regulations: z
    .boolean()
    .refine((v) => v === true, 'Please confirm you understand selection and deployment conditions'),
  contactOk: z.boolean().refine((v) => v === true, 'Please agree to be contacted about this requirement'),
});

export type EmployerCompanyForm = z.infer<typeof employerCompanySchema>;
export type EmployerContactForm = z.infer<typeof employerContactSchema>;
export type ManpowerRequirementForm = z.infer<typeof manpowerRequirementSchema>;
export type EmployerPartnershipForm = z.infer<typeof employerPartnershipSchema>;
