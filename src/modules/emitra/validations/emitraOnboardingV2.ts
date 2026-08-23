import { z } from 'zod';
import { getIndiaStates } from '@/lib/indiaLocations';

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^[1-9]\d{5}$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const aadhaarRegex = /^\d{12}$/;

function isAdult(iso: string): boolean {
  if (!iso) return false;
  const born = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(born.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return born <= cutoff;
}

const mapsLocationSchema = z
  .string()
  .trim()
  .min(8, 'Paste a Google Maps link or coordinates')
  .max(500)
  .refine((value) => {
    if (/^-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Paste a valid Google Maps URL or lat,lng coordinates');

/** Step 1 — Centre details + owner details */
export const emitraV2BasicSchema = z.object({
  center_name: z.string().trim().min(2, 'Centre / shop name is required').max(150),
  emitra_id: z.string().trim().min(3, 'E-Mitra ID / CSC ID is required').max(50),
  owner_name: z.string().trim().min(2, 'Centre owner / proprietor name is required').max(120),
  address_line1: z.string().trim().min(5, 'Centre address is required').max(400),
  city_town: z.string().trim().min(2, 'Village / town / city is required').max(80),
  district: z.string().trim().min(2, 'District is required').max(80),
  state: z
    .string()
    .min(1, 'State is required')
    .refine((value) => getIndiaStates().includes(value), 'Select a valid state'),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit PIN code'),
  google_maps_url: mapsLocationSchema,
  shop_photo_url: z.string().min(1, 'Upload a centre photograph'),
  mobile: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile'),
  mobile_verified: z.literal(true, {
    errorMap: () => ({ message: 'Verify your mobile with the SMS OTP' }),
  }),
  email: z.string().trim().email('Enter a valid email').max(255),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(isAdult, 'You must be at least 18 years old'),
});

/** Step 2 — Identity, uploads, partner declaration */
export const emitraV2DocumentsSchema = z.object({
  aadhaar_number: z
    .string()
    .trim()
    .regex(aadhaarRegex, 'Aadhaar must be 12 digits')
    .or(z.literal(''))
    .optional(),
  pan_number: z
    .string()
    .trim()
    .regex(panRegex, 'PAN format: ABCDE1234F')
    .or(z.literal(''))
    .optional(),
  aadhaar_url: z.string().min(1, 'Upload ID proof'),
  address_proof_url: z.string().min(1, 'Upload address proof'),
  emitra_certificate_url: z.string().min(1, 'Upload E-Mitra / CSC authorization or ID proof'),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
  no_jobs_promise: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
  agree_no_misrepresentation: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
  no_unauthorized_fees: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
  agree_accurate_info: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
  agree_not_sub_agent: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
});

/** Step 3 — Agreement checkbox + signatory (OTP verified separately) */
export const emitraV2AgreementSchema = z.object({
  agree_partner_agreement: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Partner Agreement' }),
  }),
  owner_name: z.string().trim().min(2, 'Partner name is required').max(120),
  mobile: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile'),
});

export const PARTNER_DECLARATION_ITEMS = [
  {
    key: 'accepted_terms' as const,
    label: 'I have read and understood the Partner Terms.',
  },
  {
    key: 'no_jobs_promise' as const,
    label: 'I will not guarantee jobs or visas to candidates.',
  },
  {
    key: 'agree_no_misrepresentation' as const,
    label: 'I will not misrepresent SafeWork Global, its partners or overseas employers.',
  },
  {
    key: 'no_unauthorized_fees' as const,
    label: 'I will not collect any unauthorized candidate fee.',
  },
  {
    key: 'agree_accurate_info' as const,
    label: 'I will provide candidates with accurate information communicated through the authorized SafeWork process.',
  },
  {
    key: 'agree_not_sub_agent' as const,
    label: 'I understand that I am not automatically a sub-agent of the registered Recruiting Agent merely by becoming a SafeWork onboarding partner.',
  },
] as const;

export const PARTNER_DECLARATION_TEXT =
  "I confirm that the information provided in this application is true and correct. I understand that SafeWork Global's partner role is limited to the activities communicated and authorized by SafeWork Global. I will not independently promise or guarantee any overseas job, visa, salary or employment outcome to any candidate. I will not collect any unauthorized fee from candidates. I agree to follow SafeWork Global's partner SOP, applicable laws and compliance requirements.";
