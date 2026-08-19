import { useEffect } from 'react';

const BRAND = 'SafeWork Global';

function formatDocumentTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return BRAND;

  const alreadyBranded = trimmed.replace(/^SafeWorkGlobal\b/i, BRAND);
  if (/^safework\s*global\b/i.test(alreadyBranded)) return alreadyBranded;

  const page = trimmed
    .replace(/\s*[|—–-]\s*SafeWork\s*Global\s*$/i, '')
    .replace(/\s*[|—–-]\s*SafeWorkGlobal\s*$/i, '')
    .trim();

  return page ? `${BRAND} | ${page}` : BRAND;
}

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png',
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    const documentTitle = formatDocumentTitle(title);
    document.title = documentTitle;

    // Update or create meta tags
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
    
    // Open Graph
    updateMeta('og:title', documentTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    if (canonicalUrl) updateMeta('og:url', canonicalUrl, true);

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', documentTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // Structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup on unmount
    return () => {
      // Remove structured data script on unmount
      const ldScript = document.querySelector('script[type="application/ld+json"]');
      if (ldScript) ldScript.remove();
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, structuredData]);

  return null;
}
