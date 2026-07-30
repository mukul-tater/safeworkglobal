import { z } from 'zod';
import { indianStates } from '@/lib/validations/partner';

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^[1-9]\d{5}$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const aadhaarRegex = /^\d{12}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const accountRegex = /^\d{6,18}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** Step 1 — Basic / business information */
export const emitraV2BasicSchema = z.object({
  center_name: z.string().trim().min(2, 'E-Mitra / CSC name is required').max(150),
  owner_name: z.string().trim().min(2, 'Owner full name is required').max(120),
  mobile: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile'),
  whatsapp: z.string().regex(phoneRegex, 'Enter a valid WhatsApp number'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .max(255)
    .or(z.literal(''))
    .optional(),
  aadhaar_number: z.string().regex(aadhaarRegex, 'Enter a valid 12-digit Aadhaar'),
  pan_number: z.string().regex(panRegex, 'PAN format: ABCDE1234F'),
  gst_number: z
    .string()
    .trim()
    .regex(gstRegex, 'Enter a valid GST number')
    .or(z.literal(''))
    .optional(),
  emitra_id: z.string().trim().min(3, 'E-Mitra ID is required').max(50),
  csc_id: z.string().trim().max(50).optional().or(z.literal('')),
});

/** Step 2 — Location + infrastructure */
export const emitraV2LocationSchema = z.object({
  shop_name: z.string().trim().max(150).optional().or(z.literal('')),
  address_line1: z.string().trim().min(5, 'Address line 1 is required').max(200),
  address_line2: z.string().trim().max(200).optional().or(z.literal('')),
  village: z.string().trim().max(80).optional().or(z.literal('')),
  panchayat: z.string().trim().max(80).optional().or(z.literal('')),
  city_town: z.string().trim().max(80).optional().or(z.literal('')),
  district: z.string().trim().min(2, 'District is required').max(80),
  state: z.enum(indianStates as unknown as [string, ...string[]], { message: 'State is required' }),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit PIN code'),
  has_internet: z.boolean(),
  has_computer: z.boolean(),
  has_printer: z.boolean(),
  has_webcam: z.boolean(),
});

/** Step 3 — Banking */
export const emitraV2BankSchema = z.object({
  account_holder: z.string().trim().min(2, 'Account holder name is required').max(120),
  bank_name: z.string().trim().min(2, 'Bank name is required').max(120),
  account_number: z.string().regex(accountRegex, 'Account number 6–18 digits'),
  ifsc: z.string().regex(ifscRegex, 'IFSC format: ABCD0123456').transform((s) => s.toUpperCase()),
  upi_id: z
    .string()
    .trim()
    .regex(/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID')
    .or(z.literal(''))
    .optional(),
  cancelled_cheque_url: z.string().min(1, 'Upload cancelled cheque'),
});

/** Step 4 — Documents + declarations */
export const emitraV2DocumentsSchema = z.object({
  aadhaar_url: z.string().min(1, 'Upload Aadhaar'),
  pan_card_url: z.string().min(1, 'Upload PAN'),
  emitra_certificate_url: z.string().min(1, 'Upload E-Mitra certificate'),
  shop_photo_url: z.string().min(1, 'Upload shop front photo'),
  owner_photo_url: z.string().min(1, 'Upload owner photo'),
  inside_shop_photo_url: z.string().min(1, 'Upload inside shop photo'),
  training_declaration: z.literal(true, {
    errorMap: () => ({ message: 'Training declaration is required' }),
  }),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept Partner Terms' }),
  }),
  agree_mea_guidelines: z.literal(true, {
    errorMap: () => ({ message: 'MEA guidelines agreement is required' }),
  }),
  no_unauthorized_fees: z.literal(true, {
    errorMap: () => ({ message: 'Required declaration' }),
  }),
  agree_platform_only: z.literal(true, {
    errorMap: () => ({ message: 'Required declaration' }),
  }),
  agree_confidentiality: z.literal(true, {
    errorMap: () => ({ message: 'Confidentiality agreement is required' }),
  }),
});
