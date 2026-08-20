import { useEffect } from 'react';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_ORIGIN,
  canonicalUrl as toCanonical,
} from '@/lib/seo';

const BRAND = SITE_NAME;

function formatDocumentTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return BRAND;

  const alreadyBranded = trimmed.replace(/^SafeWorkGlobal\b/i, BRAND);
  if (/^safework\s*global\b/i.test(alreadyBranded)) return alreadyBranded;

  const page = trimmed
    .replace(/\s*[|—–-]\s*SafeWork\s*Global\s*$/i, '')
    .replace(/\s*[|—–-]\s*SafeWorkGlobal\s*$/i, '')
    .trim();

  return page ? `${page} | ${BRAND}` : BRAND;
}

interface SEOHeadProps {
  title: string;
  description: string;
  ogDescription?: string;
  twitterDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  ogDescription,
  twitterDescription,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    const documentTitle = formatDocumentTitle(title);
    document.title = documentTitle;
    const socialDescription = ogDescription || description;
    const tweetDescription = twitterDescription || socialDescription;

    const resolvedCanonical = toCanonical(
      canonicalUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    );

    const resolvedOgImage = ogImage.startsWith('http')
      ? ogImage.replace('https://safeworkglobal.com', SITE_ORIGIN)
      : `${SITE_ORIGIN}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;

    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description);
    if (keywords) updateMeta('keywords', keywords);

    updateMeta('og:title', documentTitle, true);
    updateMeta('og:description', socialDescription, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', resolvedCanonical, true);
    updateMeta('og:site_name', BRAND, true);
    updateMeta('og:image', resolvedOgImage, true);
    updateMeta('og:image:width', DEFAULT_OG_IMAGE_WIDTH, true);
    updateMeta('og:image:height', DEFAULT_OG_IMAGE_HEIGHT, true);
    updateMeta('og:image:alt', `${BRAND} — Indian Skills. Global Opportunities.`, true);

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', documentTitle);
    updateMeta('twitter:description', tweetDescription);
    updateMeta('twitter:image', resolvedOgImage);

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', resolvedCanonical);

    if (structuredData) {
      let script = document.querySelector('script[data-seo-jsonld="page"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-seo-jsonld', 'page');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const ldScript = document.querySelector('script[data-seo-jsonld="page"]');
      if (ldScript) ldScript.remove();
    };
  }, [title, description, ogDescription, twitterDescription, keywords, canonicalUrl, ogType, ogImage, structuredData]);

  return null;
}
