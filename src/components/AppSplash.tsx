import { useEffect, useState } from 'react';
import worldfaceLogo from '@/assets/worldface-logo.png';

/**
 * Branded splash shown briefly on cold start (mainly for the installed PWA,
 * which otherwise flashes a blank background before React mounts).
 */
export const AppSplash = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHidden(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 animate-out fade-out"
      style={{ background: 'radial-gradient(circle at 50% 45%, hsl(222 60% 16%) 0%, hsl(222 60% 6%) 70%)' }}
    >
      <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glow">
        <img src={worldfaceLogo} alt="WorldFace" width={44} height={44} className="brightness-0 invert" />
      </div>
      <p className="font-heading font-bold tracking-[0.3em] text-sm text-white/90">WORLDFACE</p>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
};
