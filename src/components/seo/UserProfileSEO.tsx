import { useEffect } from 'react';

interface UserProfileSEOProps {
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
}

/**
 * Injects Open Graph + JSON-LD structured data for user profiles
 * so they appear rich on Google, Facebook, X, Telegram, etc.
 */
export const UserProfileSEO = ({ displayName, bio, avatarUrl, username }: UserProfileSEOProps) => {
  useEffect(() => {
    const title = `${displayName} — WorldFace`;
    const description = bio || `${displayName}'s profile on WorldFace – the global super app.`;
    const url = username
      ? `https://worldface-magic-portals.lovable.app/u/${username}`
      : window.location.href;

    document.title = title;

    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        if (prop.startsWith('og:')) el.setAttribute('property', prop);
        else el.setAttribute('name', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', 'profile');
    setMeta('og:url', url);
    if (avatarUrl) setMeta('og:image', avatarUrl);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (avatarUrl) setMeta('twitter:image', avatarUrl);

    // JSON-LD
    let ld = document.getElementById('user-jsonld') as HTMLScriptElement;
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'user-jsonld';
      ld.type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: displayName,
      description: description,
      url,
      ...(avatarUrl ? { image: avatarUrl } : {}),
    });

    return () => {
      document.title = 'WorldFace — Connect Globally';
      ld?.remove();
    };
  }, [displayName, bio, avatarUrl, username]);

  return null;
};
