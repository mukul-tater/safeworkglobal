export const VIDEO_KYC_STEP_SECONDS = 5;

export const VIDEO_KYC_CHALLENGES = [
  {
    id: 'blink',
    label: 'Blink both eyes',
    instruction: 'Look straight at the camera. Blink both eyes slowly, twice, so the assessor can see it.',
    startSec: 0,
  },
  {
    id: 'turn_left',
    label: 'Turn head left',
    instruction: 'Keep your shoulders still. Slowly turn your head to the left, pause, then return to centre.',
    startSec: VIDEO_KYC_STEP_SECONDS,
  },
  {
    id: 'turn_right',
    label: 'Turn head right',
    instruction: 'Keep your shoulders still. Slowly turn your head to the right, pause, then return to centre.',
    startSec: VIDEO_KYC_STEP_SECONDS * 2,
  },
] as const;

export type VideoKycChallengeId = (typeof VIDEO_KYC_CHALLENGES)[number]['id'];

export const VIDEO_KYC_MEDIA_TYPE = 'kyc_video' as const;
export const VIDEO_KYC_LABEL = 'Blink, turn left, turn right';

export const MIN_PRACTICAL_PHOTOS = 3;
export const MIN_PRACTICAL_VIDEOS = 3;
export const MIN_PRACTICAL_VIDEO_SECONDS = 30;
export const MIN_KYC_VIDEO_SECONDS = VIDEO_KYC_STEP_SECONDS * VIDEO_KYC_CHALLENGES.length;

export function videoKycLogLabel(challenge: string): string {
  if (challenge === 'liveness') return VIDEO_KYC_LABEL;
  const spec = VIDEO_KYC_CHALLENGES.find((c) => c.id === challenge);
  return spec?.label ?? challenge.replace(/_/g, ' ');
}

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
