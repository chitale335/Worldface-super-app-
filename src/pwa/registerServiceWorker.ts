/**
 * Single, guarded registration point for the app-shell service worker (/sw.js).
 * Never registers in dev, inside an iframe, or in Lovable preview hosts.
 * Visiting any URL with ?sw=off unregisters it (kill switch).
 */
const SW_URL = '/sw.js';

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === 'undefined') return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  const blockedHost =
    host.startsWith('id-preview--') ||
    host.startsWith('preview--') ||
    host === 'lovableproject.com' ||
    host.endsWith('.lovableproject.com') ||
    host === 'lovableproject-dev.com' ||
    host.endsWith('.lovableproject-dev.com') ||
    host === 'beta.lovable.dev' ||
    host.endsWith('.beta.lovable.dev');
  if (blockedHost) return true;
  return new URLSearchParams(window.location.search).get('sw') === 'off';
}

async function unregisterAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL || r.installing?.scriptURL || '').endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (isBlockedContext()) {
    await unregisterAppServiceWorker().catch(() => {});
    return;
  }
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  } catch {
    /* offline support is optional */
  }
}
