import { supabase } from '@/integrations/supabase/client';

/** Publishable VAPID public key (safe in client code). */
export const VAPID_PUBLIC_KEY =
  'BNtSjWChP2VCXiRGgPq9eRJnib7UjJJ_8k9r0YBZ8MAzzkhs42i3BcYhk-Nl8L3pMFexdGmsneqZsXqM82kg5kI';

const PUSH_SW_URL = '/push-sw.js';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function getPushRegistration() {
  return navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' });
}

/** Ask permission and store this device's subscription. Safe to call repeatedly. */
export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: permission };

  const registration = await getPushRegistration();
  await navigator.serviceWorker.ready.catch(() => {});

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, reason: 'signed_out' };

  const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return { ok: false, reason: 'invalid' };

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: auth.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 300),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) return { ok: false, reason: error.message };

  return { ok: true };
}

export async function disablePushNotifications() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    await subscription.unsubscribe().catch(() => {});
  }
}

export async function pushEnabledOnThisDevice() {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}

type PushEventPayload =
  | { event: 'message'; conversation_id: string; title: string; body: string; url?: string }
  | { event: 'gift'; recipient_id: string; title: string; body: string; url?: string }
  | { event: 'live'; title: string; body: string; url?: string };

/** Fire-and-forget push delivery. Recipients are resolved server-side. */
export async function sendPush(payload: PushEventPayload) {
  try {
    await supabase.functions.invoke('send-push', { body: payload });
  } catch {
    /* notifications are best-effort */
  }
}
