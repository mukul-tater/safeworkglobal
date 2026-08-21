export const VIDEO_KYC_CHALLENGES = [
  {
    id: 'blink',
    mediaType: 'video_kyc_blink',
    label: 'Blink both eyes',
    instruction: 'Look straight at the camera. Blink both eyes slowly, twice, so the assessor can see it.',
  },
  {
    id: 'turn_left',
    mediaType: 'video_kyc_turn_left',
    label: 'Turn head left',
    instruction: 'Keep your shoulders still. Slowly turn your head to the left, pause, then return to centre.',
  },
  {
    id: 'turn_right',
    mediaType: 'video_kyc_turn_right',
    label: 'Turn head right',
    instruction: 'Keep your shoulders still. Slowly turn your head to the right, pause, then return to centre.',
  },
] as const;

export type VideoKycChallengeId = (typeof VIDEO_KYC_CHALLENGES)[number]['id'];

export const MIN_PRACTICAL_PHOTOS = 3;
export const MIN_PRACTICAL_VIDEOS = 3;
export const MIN_PRACTICAL_VIDEO_SECONDS = 30;
export const MIN_KYC_VIDEO_SECONDS = 5;

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
