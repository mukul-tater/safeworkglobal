export interface JobEligibilityRequirements {
  minimum_height_inches?: number | null;
  driving_license?: boolean;
}

export function parseJobEligibilityRequirements(value: unknown): JobEligibilityRequirements {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const height = Number(input.minimum_height_inches);
  return {
    ...(Number.isFinite(height) && height > 0 ? { minimum_height_inches: height } : {}),
    ...(input.driving_license === true ? { driving_license: true } : {}),
  };
}

export function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
}
