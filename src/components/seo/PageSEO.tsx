import { useEffect } from 'react';

interface PageSEOProps {
  title: string;
  description: string;
  /** Absolute canonical URL for this route */
  url: string;
  /** Absolute https URL of the share image (1200x630 recommended) */
  image?: string;
  imageAlt?: string;
  siteName?: string;
}

/**
 * Sets per-route title, description, canonical and Open Graph tags.
 * Note: this runs client-side, so JS-executing crawlers (Googlebot) see it,
 * while social-preview crawlers read the static index.html head.
 */
export const PageSEO = ({ title, description, url, image, imageAlt, siteName = 'WorldFace' }: PageSEOProps) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (key: string, content: string, asProperty: boolean) => {
      const selector = asProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(asProperty ? 'property' : 'name', key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description, false);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('og:url', url, true);
    setMeta('og:site_name', siteName, true);
    setMeta('og:locale', 'sw_TZ', true);
    setMeta('twitter:card', 'summary_large_image', false);
    setMeta('twitter:title', title, false);
    setMeta('twitter:description', description, false);
    if (image) {
      setMeta('og:image', image, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
      setMeta('twitter:image', image, false);
      if (imageAlt) {
        setMeta('og:image:alt', imageAlt, true);
        setMeta('twitter:image:alt', imageAlt, false);
      }
    }


    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.href;
    canonical.href = url;

    return () => {
      document.title = prevTitle;
      if (createdCanonical) canonical?.remove();
      else if (canonical) canonical.href = prevHref;
    };
  }, [title, description, url, image, imageAlt, siteName]);

  return null;
};
