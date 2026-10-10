import { useEffect, useState, useCallback } from 'react';

export type NotifPrefs = {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietStart: string; // "HH:mm"
  quietEnd: string;   // "HH:mm"
};

const DEFAULTS: NotifPrefs = {
  enabled: true,
  sound: true,
  vibration: true,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
};

const KEY = 'wf-notif-prefs-v1';

export function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

export function savePrefs(p: NotifPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent('wf-notif-prefs-changed'));
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function isInQuietHours(p: NotifPrefs, now = new Date()) {
  if (!p.quietHoursEnabled) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(p.quietStart);
  const end = toMinutes(p.quietEnd);
  if (start === end) return false;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadPrefs());

  useEffect(() => {
    const handler = () => setPrefs(loadPrefs());
    window.addEventListener('wf-notif-prefs-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('wf-notif-prefs-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = useCallback((patch: Partial<NotifPrefs>) => {
    const next = { ...loadPrefs(), ...patch };
    savePrefs(next);
    setPrefs(next);
  }, []);

  return { prefs, update };
}

/** Play a short notification beep using the Web Audio API (no asset needed). */
export function playNotificationSound() {
  try {
    type WindowWithAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || (window as WindowWithAudio).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch { /* ignore */ }
}

export function vibrate(pattern: number | number[] = [60, 40, 60]) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}
