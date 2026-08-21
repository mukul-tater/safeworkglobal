import { parseDateInput } from '@/lib/validations/common';

export const PASSPORT_NUMBER_REGEX = /^[A-Z0-9]{6,9}$/;
export const PASSPORT_MIN_VALIDITY_MONTHS = 6;

export function normalizePassportNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
}

export function isValidPassportNumber(value: string): boolean {
  return PASSPORT_NUMBER_REGEX.test(normalizePassportNumber(value));
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addCalendarMonths(date: Date, months: number): Date {
  const base = startOfLocalDay(date);
  const day = base.getDate();
  const next = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

export function minPassportExpiryDate(from = new Date()): Date {
  return addCalendarMonths(from, PASSPORT_MIN_VALIDITY_MONTHS);
}

export function formatMinPassportExpiryDate(from = new Date()): string {
  return minPassportExpiryDate(from).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Same helper shown on Identity (KYC) and the passport info popup. */
export function passportMinValidityHintEn(from = new Date()): string {
  return `Must not be expired, and must stay valid until at least ${formatMinPassportExpiryDate(from)} (6 months from today).`;
}

export function passportMinValidityHintHi(from = new Date()): string {
  return `समाप्त नहीं होना चाहिए, और कम से कम ${formatMinPassportExpiryDate(from)} तक वैध रहना चाहिए (आज से 6 महीने)।`;
}

export function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY-MM-DD` date-only values from Postgres. */
export function toDateInputValueFromIso(value: string | null | undefined): string {
  if (!value) return '';
  const ymd = value.slice(0, 10);
  return parseDateInput(ymd) ? ymd : '';
}

export function passportExpiryIssue(expiryYmd: string, from = new Date()): string | null {
  const expiry = parseDateInput(expiryYmd);
  if (!expiry) return 'Enter your passport expiry date';
  const today = startOfLocalDay(from);
  if (expiry < today) {
    return 'This passport has expired. Use a passport that is still valid.';
  }
  const minExpiry = minPassportExpiryDate(from);
  if (expiry < minExpiry) {
    return 'Passport must be valid for at least 6 months from today.';
  }
  return null;
}

export function assertValidPassportKyc(opts: { number: string; expiry: string }): {
  passportNumber: string;
  passportExpiry: string;
} {
  const passportNumber = normalizePassportNumber(opts.number);
  if (!isValidPassportNumber(passportNumber)) {
    throw new Error('Enter a valid passport number (6–9 letters and digits)');
  }
  const issue = passportExpiryIssue(opts.expiry);
  if (issue) throw new Error(issue);
  return { passportNumber, passportExpiry: opts.expiry.trim().slice(0, 10) };
}
