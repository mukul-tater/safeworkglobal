import { z } from 'zod';

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/** Strip formatting and optional +91 prefix; keep last 10 digits. */
export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobile(value));
}

export const indianMobileRequired = z
  .string()
  .trim()
  .min(1, 'Mobile number is required')
  .refine(isValidIndianMobile, 'Enter a valid 10-digit Indian mobile number')
  .transform(normalizeIndianMobile);

export const indianMobileOptional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || isValidIndianMobile(v), 'Enter a valid 10-digit Indian mobile number')
  .transform((v) => (v ? normalizeIndianMobile(v) : ''));

export const personNameRequired = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name is too long');

export const emailRequired = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(255);

export function parseDateInput(value: string): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isTodayOrFuture(value: string): boolean {
  const parsed = parseDateInput(value);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

export const requiredFutureDateString = z
  .string()
  .trim()
  .min(1, 'Date is required')
  .refine((v) => parseDateInput(v) !== null, 'Enter a valid date')
  .refine(isTodayOrFuture, 'Date must be today or in the future');

export const optionalFutureDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || parseDateInput(v) !== null, 'Enter a valid date')
  .refine((v) => !v || isTodayOrFuture(v), 'Date must be today or in the future');

export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

export function todayDateInputValue(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
