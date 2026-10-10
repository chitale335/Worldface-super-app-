import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Slim banner shown when the device loses connectivity. */
export const OfflineBanner = () => {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-amber px-3 py-1.5 text-[11px] font-semibold text-amber-foreground"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.375rem)' }}
    >
      <WifiOff className="h-3.5 w-3.5" />
      Hakuna mtandao — unatumia WorldFace offline
    </div>
  );
};
