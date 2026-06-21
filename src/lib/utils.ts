import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatJobSalaryNative } from "@/lib/jobSalaryUtils";

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
  if (currency !== 'INR') {
    return formatJobSalaryNative(min, max, currency, 'Salary not specified');
  }

  if (min == null && max == null) return 'Salary not specified';
  if (min != null && max != null) {
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  }
  if (min != null) return `From ₹${min.toLocaleString('en-IN')}`;
  return `Up to ₹${max!.toLocaleString('en-IN')}`;
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
  if (currency !== 'INR') {
    return formatJobSalaryNative(min, max, currency);
  }

  const toLakhLabel = (inr: number) => {
    const lakhs = inr / 100_000;
    if (lakhs >= 1) {
      const rounded = Math.round(lakhs * 10) / 10;
      const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
      return `₹${text}L`;
    }
    return `₹${Math.round(inr / 1000)}K`;
  };

  if (min == null && max == null) return 'Salary on application';
  if (min != null && max != null) {
    return `${toLakhLabel(min)} – ${toLakhLabel(max)}`;
  }
  if (min != null) return `From ${toLakhLabel(min)}`;
  return `Up to ${toLakhLabel(max!)}`;
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
