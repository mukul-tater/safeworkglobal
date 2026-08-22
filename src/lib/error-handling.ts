import { toast } from 'sonner';

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

// Error code mapping for consistent messages
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email. Please sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password can only contain letters and numbers, at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'invalid_credentials': 'Invalid email or password. Please try again.',
  
  // Database errors
  'PGRST116': 'Record not found.',
  '23505': 'This record already exists.',
  '23503': 'Cannot delete - this record is referenced elsewhere.',
  '42501': 'You do not have permission to perform this action.',
  '22P02': 'Invalid data format provided.',
  
  // File upload errors
  'file/too-large': 'File is too large. Maximum size is 10MB.',
  'file/invalid-type': 'Invalid file type. Please upload a valid document.',
  'storage/unauthorized': 'You are not authorized to upload files.',
  
  // Network errors
  'network/offline': 'You appear to be offline. Please check your connection.',
  'network/timeout': 'Request timed out. Please try again.',
  
  // Generic
  'unknown': 'Something went wrong. Please try again.',
};

export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.unknown;

  // Handle Supabase AuthError
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Check for Supabase error code
    if (err.code && typeof err.code === 'string') {
      return ERROR_MESSAGES[err.code] || (err.message as string) || ERROR_MESSAGES.unknown;
    }
    
    // Check for PostgreSQL error code
    if (err.code && typeof err.code === 'string' && ERROR_MESSAGES[err.code]) {
      return ERROR_MESSAGES[err.code];
    }

    // Check for error message
    if (err.message && typeof err.message === 'string') {
      // Check if the message matches a known pattern
      const lowerMessage = err.message.toLowerCase();
      
      if (lowerMessage.includes('invalid login credentials')) {
        return ERROR_MESSAGES.invalid_credentials;
      }
      if (lowerMessage.includes('email not confirmed')) {
        return 'Please verify your email before logging in.';
      }
      if (lowerMessage.includes('network')) {
        return ERROR_MESSAGES['network/offline'];
      }
      
      return err.message as string;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.unknown;
}

export function showError(error: unknown, fallbackMessage?: string): void {
  const message = getErrorMessage(error);
  toast.error(fallbackMessage || message);
}

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showWarning(message: string): void {
  toast.warning(message);
}

export function showInfo(message: string): void {
  toast.info(message);
}

// Async operation wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    if (options?.showSuccessToast && options?.successMessage) {
      showSuccess(options.successMessage);
    }
    return result;
  } catch (error) {
    showError(error, options?.errorMessage);
    return null;
  }
}

// Validation error formatter
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages = Object.values(errors).flat();
  return messages.join(', ');
}
