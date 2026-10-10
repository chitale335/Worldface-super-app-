import { useEffect, useMemo, useState } from 'react';

type FlyingGift = {
  key: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
};

interface GiftAnimationProps {
  emoji: string | null;
  burstId: number;
  onDone?: () => void;
}

/**
 * Plays a burst of floating emojis when burstId changes.
 * Pure CSS animation using existing fade-in keyframe + custom transform.
 */
export const GiftAnimation = ({ emoji, burstId, onDone }: GiftAnimationProps) => {
  const [active, setActive] = useState(false);

  const particles = useMemo<FlyingGift[]>(() => {
    if (!emoji) return [];
    return Array.from({ length: 14 }, (_, i) => ({
      key: burstId * 100 + i,
      emoji,
      left: 20 + Math.random() * 60,
      delay: Math.random() * 400,
      duration: 1800 + Math.random() * 1200,
      drift: (Math.random() - 0.5) * 120,
      size: 28 + Math.random() * 28,
    }));
  }, [emoji, burstId]);

  useEffect(() => {
    if (!emoji) return;
    setActive(true);
    const t = setTimeout(() => {
      setActive(false);
      onDone?.();
    }, 3200);
    return () => clearTimeout(t);
  }, [burstId, emoji, onDone]);

  if (!active || !emoji) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {/* Center "hero" emoji burst */}
      <div
        key={`hero-${burstId}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in"
        style={{ fontSize: '8rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6))' }}
      >
        {emoji}
      </div>

      {/* Floating particles */}
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute bottom-0 select-none"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animation: `gift-float ${p.duration}ms ease-out ${p.delay}ms forwards`,
            // expose drift as CSS variable for the keyframe
            ['--gift-drift' as string]: `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes gift-float {
          0% {
            transform: translate(0, 0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--gift-drift, 0), -110vh) scale(1.1) rotate(${
              Math.random() > 0.5 ? '' : '-'
            }30deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
