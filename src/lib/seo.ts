/** Production origin used for canonical URLs, Open Graph, and structured data. */
export const SITE_ORIGIN = 'https://www.safeworkglobal.com';

export const SITE_NAME = 'SafeWork Global';

export const DEFAULT_TITLE = 'SafeWork Global | Indian Skills. Global Opportunities.';

export const DEFAULT_DESCRIPTION =
  "SafeWork Global is a technology and workforce mobility platform connecting India's skilled workforce with global employment opportunities through worker onboarding, skill verification and transparent workforce mobility.";

export const DEFAULT_OG_DESCRIPTION =
  "India's skilled workforce. Global opportunities. SafeWork Global connects skilled workers with global employment opportunities through technology, skill verification and workforce mobility.";

export const DEFAULT_OG_IMAGE_PATH = '/safework-social-preview.png';

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`;

export const DEFAULT_OG_IMAGE_WIDTH = '1200';
export const DEFAULT_OG_IMAGE_HEIGHT = '630';

export const LOGO_URL = `${SITE_ORIGIN}/safework-global-logo.png`;

export function canonicalUrl(path = '/'): string {
  const normalized = path.startsWith('http')
    ? new URL(path).pathname
    : path;
  const clean = (normalized.replace(/\/+$/, '') || '/') as string;
  return clean === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${clean}`;
}

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  logo: LOGO_URL,
  description:
    'SafeWork Global is a technology and workforce mobility platform connecting India\'s skilled workforce with global employment opportunities.',
} as const;
