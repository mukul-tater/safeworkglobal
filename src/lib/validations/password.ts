import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72;
export const ALPHANUMERIC_PASSWORD_REGEX = /^[a-zA-Z0-9]+$/;
export const PASSWORD_HINT = 'Letters and numbers only, at least 6 characters';
export const PASSWORD_PATTERN = `[A-Za-z0-9]{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}`;

export const WEAK_PASSWORD_MESSAGE =
  'Use letters and numbers only, at least 6 characters. No spaces or symbols.';

export function isWeakPasswordAuthError(message: string): boolean {
  return /weak|easy to guess|pwned|leaked password|not strong enough/i.test(message);
}

/** Shared rule for signup, reset, and change-password. Login stays unrestricted. */
export function passwordSignupIssue(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'Password is too long';
  }
  if (!ALPHANUMERIC_PASSWORD_REGEX.test(password)) {
    return 'Password can only contain letters and numbers';
  }
  return null;
}

export function sanitizePasswordInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, PASSWORD_MAX_LENGTH);
}

export const alphanumericPasswordSchema = z.string().superRefine((val, ctx) => {
  const issue = passwordSignupIssue(val);
  if (issue) ctx.addIssue({ code: 'custom', message: issue });
});
