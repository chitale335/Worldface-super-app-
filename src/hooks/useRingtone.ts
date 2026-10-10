import { useEffect, useRef } from 'react';

/**
 * Plays a synthesized ringtone (incoming) or ringback (outgoing) using Web Audio.
 * No audio file needed. Loops until `active` becomes false.
 */
export function useRingtone(active: boolean, mode: 'incoming' | 'outgoing' = 'incoming') {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      return;
    }

    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const playPulse = (freq: number, duration: number, when: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + when);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + when + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + when + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + duration + 0.05);
    };

    const ring = () => {
      if (mode === 'incoming') {
        // Classic two-tone "brrring brrring"
        for (let i = 0; i < 2; i++) {
          const base = i * 0.6;
          playPulse(480, 0.25, base);
          playPulse(620, 0.25, base + 0.25);
        }
      } else {
        // Outgoing ringback: long single tone
        playPulse(440, 1.0, 0);
      }
    };

    ring();
    intervalRef.current = window.setInterval(ring, mode === 'incoming' ? 2200 : 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctx.close().catch(() => {});
    };
  }, [active, mode]);
}
