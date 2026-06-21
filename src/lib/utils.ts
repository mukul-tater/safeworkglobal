import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getJobSalaryDisplay } from "@/lib/jobSalaryUtils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a plain INR amount for filters and inputs. */
export function formatINRAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Null-safe salary formatter. Converts to INR if needed and formats with Indian locale.
 * Handles all combinations of null/undefined min/max gracefully.
 */
export function formatSalaryINR(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR'
): string {
  const { primary, inrLine } = getJobSalaryDisplay(min, max, currency, 'Salary not specified');
  return inrLine ? `${primary} (${inrLine})` : primary;
}

/**
 * Null-safe expected salary formatter for worker profiles.
 */
export function formatExpectedSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'USD'
): string {
  if (min == null && max == null) return 'Not specified';
  const sym = currency || 'USD';
  if (min != null && max != null) return `${sym} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min != null) return `From ${sym} ${min.toLocaleString()}`;
  return `Up to ${sym} ${max!.toLocaleString()}`;
}

/** Formats monthly salary in lakh/crore notation for job listings (INR, converts foreign currency). */
export function formatSalaryLakh(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR'
): string {
  const { primary, inrLine } = getJobSalaryDisplay(min, max, currency);
  return inrLine ? `${primary}\n${inrLine}` : primary;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
