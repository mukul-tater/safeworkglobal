/** Flatten worker API validation errors into a user-facing message. */
export function formatWorkerApiError(err: unknown, fallback = 'Request failed'): string {
  if (!(err instanceof Error)) return fallback;

  const apiErr = err as Error & { errors?: Record<string, string[]> };
  if (apiErr.errors) {
    const messages = Object.values(apiErr.errors).flat();
    if (messages.length > 0) return messages.join('. ');
  }

  return apiErr.message || fallback;
}

export function mapWorkerApiFieldErrors(
  err: unknown
): Record<string, string> | null {
  if (!(err instanceof Error)) return null;
  const apiErr = err as Error & { errors?: Record<string, string[]> };
  if (!apiErr.errors) return null;

  const mapped: Record<string, string> = {};
  for (const [field, messages] of Object.entries(apiErr.errors)) {
    if (messages[0]) mapped[field] = messages[0];
  }
  return Object.keys(mapped).length > 0 ? mapped : null;
}
