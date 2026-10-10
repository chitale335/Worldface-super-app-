import { useEffect, useRef } from 'react';

/**
 * Renders an unread-count badge on top of the favicon and updates the
 * document title. Falls back to title-only on browsers that block canvas
 * favicon updates. Uses the App Badge API on supported PWAs.
 */
export function useAppBadge(count: number, baseTitle = 'WorldFace') {
  const originalHrefRef = useRef<string | null>(null);

  useEffect(() => {
    // Title
    document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${baseTitle}` : baseTitle;

    // PWA App Badging API
    type NavWithBadge = Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    const nav = navigator as NavWithBadge;
    try {
      if (count > 0) nav.setAppBadge?.(count).catch(() => {});
      else nav.clearAppBadge?.().catch(() => {});
    } catch { /* ignore */ }

    // Favicon canvas badge
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) return;
    if (originalHrefRef.current === null) originalHrefRef.current = link.href;

    if (count <= 0) {
      link.href = originalHrefRef.current;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        // badge
        const r = 18;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(size - r, r, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count > 9 ? '9+' : String(count), size - r, r + 1);
        link.href = canvas.toDataURL('image/png');
      } catch { /* ignore CORS */ }
    };
    img.src = originalHrefRef.current;
  }, [count, baseTitle]);
}
