/** Email labels describe the applied job, not its broader quiz skill bucket. */
export function journeyEmailTrade(jobTitle?: string | null, primarySkill?: string | null): string {
  return jobTitle?.trim() || primarySkill?.trim() || ''
}