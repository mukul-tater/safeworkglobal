import { describe, expect, test } from 'bun:test';
import { applicantTypeValue, jobApplicantTypeSchema } from './jobApplicantType';

describe('admin job applicant groups', () => {
  test('allows male jobs', () => expect(jobApplicantTypeSchema.parse('male')).toBe('male'));
  test('allows female jobs', () => expect(jobApplicantTypeSchema.parse('female')).toBe('female'));
  test('allows couples jobs', () => expect(jobApplicantTypeSchema.parse('couples')).toBe('couples'));
  test('existing unspecified jobs stay unset', () => expect(applicantTypeValue(null)).toBe(''));
  test('rejects unsupported groups', () => expect(jobApplicantTypeSchema.safeParse('other').success).toBe(false));
});