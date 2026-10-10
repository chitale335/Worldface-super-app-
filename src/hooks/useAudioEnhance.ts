import { useEffect, useRef } from 'react';

/**
 * Studio-quality audio enhancement for <video>/<audio> elements.
 * Pipeline: source → highpass → low-shelf → high-shelf → compressor → makeup gain → destination
 * - Cleans low rumble, adds warmth + sparkle, evens loudness, prevents clipping.
 * Safe: uses WebAudio; falls back silently when unsupported.
 */
export function useAudioEnhance(
  ref: React.RefObject<HTMLMediaElement>,
  enabled: boolean = true,
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const wiredRef = useRef<WeakSet<HTMLMediaElement>>(new WeakSet());

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (wiredRef.current.has(el)) return;

    const AC: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;

    let ctx: AudioContext;
    try {
      ctx = ctxRef.current ?? new AC();
      ctxRef.current = ctx;
    } catch {
      return;
    }

    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(el);
    } catch {
      // already connected (HMR / re-mount) — skip
      return;
    }
    wiredRef.current.add(el);

    // Remove sub-bass rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 40;

    // Add warmth
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 120;
    lowShelf.gain.value = 2.5;

    // Vocal presence
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3000;
    presence.Q.value = 1;
    presence.gain.value = 2;

    // Air / sparkle
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 9000;
    highShelf.gain.value = 1.5;

    // Loudness compressor — even out volume across clips
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 28;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.18;

    // Makeup gain (safe boost, < 1.5x to avoid distortion)
    const makeup = ctx.createGain();
    makeup.gain.value = 1.25;

    source
      .connect(highpass)
      .connect(lowShelf)
      .connect(presence)
      .connect(highShelf)
      .connect(comp)
      .connect(makeup)
      .connect(ctx.destination);

    const resume = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    };
    el.addEventListener('play', resume);

    return () => {
      el.removeEventListener('play', resume);
      try {
        source.disconnect();
        highpass.disconnect();
        lowShelf.disconnect();
        presence.disconnect();
        highShelf.disconnect();
        comp.disconnect();
        makeup.disconnect();
      } catch {
        // ignore
      }
    };
  }, [ref, enabled]);
}
