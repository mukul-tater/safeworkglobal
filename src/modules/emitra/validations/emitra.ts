import { z } from 'zod';
import { indianStates } from '@/lib/validations/partner';

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^[1-9]\d{5}$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const accountRegex = /^\d{6,18}$/;

export const emitraPersonalSchema = z.object({
  owner_name: z.string().trim().min(2, 'Full name is required').max(120),
  mobile: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile'),
  email: z.string().trim().email('Enter a valid email').max(255),
});

export const emitraDetailsSchema = z.object({
  emitra_id: z.string().trim().min(3, 'E-Mitra ID is required').max(50),
  center_name: z.string().trim().min(2, 'Kiosk name is required').max(150),
  years_in_operation: z.coerce.number().int().min(0).max(100),
  worker_categories: z.array(z.string()).min(1, 'Select at least one worker category'),
});

export const emitraLocationSchema = z.object({
  address: z.string().trim().min(10, 'Address is required').max(500),
  village_city: z.string().trim().min(2, 'Village/City is required').max(80),
  district: z.string().trim().min(2, 'District is required').max(80),
  state: z.enum(indianStates as unknown as [string, ...string[]], { message: 'State is required' }),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit PIN code'),
});

export const emitraInfrastructureSchema = z.object({
  has_computer: z.boolean(),
  has_scanner: z.boolean(),
  has_printer: z.boolean(),
  has_internet: z.boolean(),
  worker_categories: z.array(z.string()).min(1, 'Select at least one worker category'),
});

export const emitraBankSchema = z.object({
  account_holder: z.string().trim().min(2).max(120),
  account_number: z.string().regex(accountRegex, 'Account number 6–18 digits'),
  ifsc: z.string().regex(ifscRegex, 'IFSC format: ABCD0123456').transform(s => s.toUpperCase()),
  upi_id: z.string().trim().regex(/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID').or(z.literal('')).optional(),
});

export const emitraDocumentsSchema = z.object({
  pan_number: z.string().regex(panRegex, 'PAN format: ABCDE1234F'),
  emitra_certificate_url: z.string().min(1, 'Upload E-Mitra certificate'),
  pan_card_url: z.string().min(1, 'Upload PAN card'),
  address_proof_url: z.string().min(1, 'Upload address proof'),
  shop_photo_url: z.string().min(1, 'Upload kiosk photograph'),
  owner_photo_url: z.string().min(1, 'Upload owner photograph'),
});

export const emitraDeclarationsSchema = z.object({
  accepted_terms: z.literal(true, { errorMap: () => ({ message: 'You must accept Partner Terms' }) }),
  no_jobs_promise: z.literal(true, { errorMap: () => ({ message: 'Required declaration' }) }),
  no_unauthorized_fees: z.literal(true, { errorMap: () => ({ message: 'Required declaration' }) }),
  mobile_verified: z.literal(true, { errorMap: () => ({ message: 'Mobile OTP verification required' }) }),
});

/** Step 1 — personal details only */
export const workerPersonalSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required').max(120),
  mobile: z.string().regex(phoneRegex, 'Valid 10-digit mobile required'),
});

/** Step 2 — job / location details */
export const workerJobInfoSchema = z.object({
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  experience_level: z.string().min(1, 'Select experience'),
  passport_available: z.boolean(),
  preferred_country: z.string().optional(),
  state: z.enum(indianStates as unknown as [string, ...string[]], { message: 'State is required' }),
  district: z.string().trim().min(2, 'District is required').max(80),
});

/** Full worker registration (used on final submit) */
export const workerQuickRegistrationSchema = workerPersonalSchema.merge(workerJobInfoSchema);

export const workerSkillScreeningSchema = z.object({
  skill_level: z.enum(['Helper', 'Semi Skilled', 'Skilled']),
  operator_notes: z.string().trim().min(5, 'Add operator notes (min 5 chars)').max(1000),
});

export const workerMigrationSchema = z.object({
  passport_available: z.boolean(),
  ready_to_relocate: z.boolean(),
  family_consent: z.boolean(),
  previous_gcc_experience: z.boolean(),
  expected_salary: z.union([z.coerce.number().min(0), z.null()]).optional(),
});
