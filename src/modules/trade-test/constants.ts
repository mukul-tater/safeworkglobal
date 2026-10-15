export const MIN_PRACTICAL_PHOTOS = 3;
export const MIN_PRACTICAL_VIDEOS = 3;
export const MIN_PRACTICAL_VIDEO_SECONDS = 30;

export const TEST_ANGLES = [
  { id: 'front_face', label: 'Front — face clearly visible' },
  { id: 'left_angle', label: 'Left angle — face clearly visible' },
  { id: 'right_angle', label: 'Right angle — face clearly visible' },
] as const;

export type TestAngleId = (typeof TEST_ANGLES)[number]['id'];

export const IDENTITY_DOC_TYPES = [
  'pan',
  'aadhaar',
  'aadhaar_front',
  'aadhaar_back',
  'passport',
  'passport_front',
  'passport_last',
  'id_proof',
] as const;

export function formatAuditTs(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
