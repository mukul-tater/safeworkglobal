export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_HINT = 'Letters and numbers only, at least 6 characters';

export function passwordSignupIssue(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'Password is too long';
  }
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return 'Password can only contain letters and numbers';
  }
  return null;
}

export function sanitizePasswordInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, PASSWORD_MAX_LENGTH);
}
