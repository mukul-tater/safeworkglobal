import { describe, expect, test } from 'bun:test';
import { getPublicJobVideos, listPublicJobResponsibilities } from './uaeListedJobs';
import { resolveQuizSkillCode } from '@/modules/worker-verification/quiz-data/quizSkill';
import { jobBrowseCategory } from './jobBrowseCategory';

describe('Security Guard and Nanny jobs', () => {
  test('Security Guard is reachable through its UAE trade choice', () => {
    expect(jobBrowseCategory('Security Guard', '', 'UAE', 'Other')).toBe('Security Guard');
  });
  test('Security Guard job uses the Security Guard Test 1 paper', () => {
    expect(resolveQuizSkillCode({ jobTitle: 'Security Guard', country: 'UAE' })).toBe('Security Guard');
  });
  test('Security Guard job shows its 3 videos and 6 responsibilities', () => {
    expect(getPublicJobVideos('Security Guard', '', 'UAE').map((v) => v.youtubeId)).toEqual(['W-v_bbPeq6Q', 'Xo_8xaVkSCQ', 'h_A5SotBhuc']);
    expect(listPublicJobResponsibilities('Security Guard', null, '', 'UAE')).toHaveLength(6);
  });
  test('Nanny job shows its 2 videos', () => {
    expect(getPublicJobVideos('Nanny / House Maid', '', 'UAE').map((v) => v.youtubeId)).toEqual(['RRO5WlOKHEY', '_2KfkWREdwc']);
  });
});
