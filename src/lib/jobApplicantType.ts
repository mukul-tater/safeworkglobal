import { z } from 'zod';

export const jobApplicantTypeSchema = z.enum(['male', 'female', 'couples', '']).default('');
export type JobApplicantType = z.infer<typeof jobApplicantTypeSchema>;

export function applicantTypeValue(value: unknown): JobApplicantType {
  const parsed = jobApplicantTypeSchema.safeParse(value ?? '');
  return parsed.success ? parsed.data : '';
}

export function formatApplicantTypeLabel(
  value: unknown,
): { en: string; hi: string } | null {
  const parsed = applicantTypeValue(value);
  if (!parsed) return null;
  switch (parsed) {
    case 'male':
      return { en: 'Male only', hi: 'केवल पुरुष' };
    case 'female':
      return { en: 'Female only', hi: 'केवल महिला' };
    case 'couples':
      return { en: 'Couples', hi: 'दंपति' };
    default:
      return null;
  }
}