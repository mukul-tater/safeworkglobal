/**
 * Palette aligned with src/index.css — primary is an accent, not a page fill.
 * Large surfaces use tinted neutrals (primary/4–10%), matching the web hero.
 */

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export const colors = {
  // Core surfaces
  background: '#F9FAFB',
  foreground: '#1C2033',
  card: '#FFFFFF',
  cardForeground: '#1C2033',

  // Primary — used sparingly (buttons, links, icons)
  primary: '#4A6CF7',
  primaryHover: '#3D5CE0',
  primaryForeground: '#FFFFFF',
  primaryLight: '#EEF2FA',
  primaryMuted: '#DDE4F5',
  primaryTint: hsl(230, 85, 55, 0.06),
  primaryTintMedium: hsl(230, 85, 55, 0.1),
  primarySurface: '#F5F7FC',

  // Secondary — coral accent, rarely as large fills
  secondary: '#E86F45',
  secondaryForeground: '#FFFFFF',
  secondaryLight: '#FBF0EB',
  secondaryTint: hsl(16, 90, 58, 0.08),

  // Neutrals
  muted: '#F2F4F8',
  mutedForeground: '#6E7380',
  accent: '#ECEEF4',
  accentForeground: '#1C2033',

  // Semantic — muted tints for badges/cards
  success: '#2A9D6A',
  successLight: hsl(158, 72, 42, 0.1),
  successBorder: hsl(158, 72, 42, 0.2),
  warning: '#C9920A',
  warningLight: hsl(42, 95, 52, 0.12),
  info: '#3A9EAE',
  infoLight: hsl(192, 95, 48, 0.1),
  infoTint: hsl(192, 95, 48, 0.06),
  destructive: '#DC5246',
  destructiveLight: hsl(0, 84, 60, 0.08),

  // Borders
  border: '#E4E7EC',
  input: '#E4E7EC',
  ring: '#4A6CF7',

  // Portal accents (icons & labels only)
  worker: '#2A9D6A',
  workerLight: hsl(158, 72, 42, 0.1),
  employer: '#4A6CF7',
  employerLight: hsl(230, 85, 55, 0.1),
  partner: '#B8860B',
  partnerLight: hsl(42, 70, 45, 0.1),
  admin: '#6B5BC6',
  adminLight: hsl(260, 45, 55, 0.1),

  // Aliases
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F8',
  text: '#1C2033',
  textMuted: '#6E7380',
  textLight: '#9CA3AF',
  borderLight: '#EEF0F4',

  tabBar: '#FFFFFF',
  overlay: 'rgba(28, 32, 51, 0.45)',
};

export const gradients = {
  /** Subtle page wash — mirrors web `from-primary/[0.04] via-background to-info/[0.04]` */
  pageWash: [colors.primaryTint, colors.background, colors.infoTint],
  /** Text accent only */
  textAccent: [colors.primary, '#6B5BC6'],
};
