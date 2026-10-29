import { z } from 'zod';

export const jobApplicantTypeSchema = z.enum(['male', 'female', 'couples', '']).default('');
export type JobApplicantType = z.infer<typeof jobApplicantTypeSchema>;

export function applicantTypeValue(value: unknown): JobApplicantType {
  const parsed = jobApplicantTypeSchema.safeParse(value ?? '');
  return parsed.success ? parsed.data : '';
}