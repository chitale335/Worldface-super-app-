import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { X, Megaphone } from 'lucide-react';

type Campaign = {
  id: string; title: string; body: string | null; media_url: string | null;
  cta_label: string; cta_route: string | null; priority: number;
};

const SESSION_KEY = 'wf_app_open_ad_shown';
const AUTO_DISMISS_MS = 7000;

/**
 * App-open interstitial. Ads live only inside WorldFace.
 * Highest-priority active campaign is shown once per app open and disappears
 * automatically if the user does not open it.
 */
export const AppOpenAd = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Campaign | null>(null);
  const [left, setLeft] = useState(AUTO_DISMISS_MS / 1000);
  const logged = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('ad_campaigns')
        .select('id, title, body, media_url, cta_label, cta_route, priority')
        .eq('status', 'active')
        .eq('placement', 'app_open')
        .lte('starts_at', nowIso)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      const next = data?.[0];
      if (!next) return;
      sessionStorage.setItem(SESSION_KEY, '1');
      setAd(next as Campaign);
    })();
  }, [user]);

  useEffect(() => {
    if (!ad) return;
    if (!logged.current) {
      logged.current = true;
      supabase.rpc('record_ad_event', { _campaign_id: ad.id, _event: 'impression' });
    }
    const tick = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    const timer = setTimeout(() => close('dismiss'), AUTO_DISMISS_MS);
    return () => { clearInterval(tick); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  const close = (event: 'dismiss' | 'click') => {
    if (ad) supabase.rpc('record_ad_event', { _campaign_id: ad.id, _event: event });
    setAd(null);
  };

  if (!ad) return null;

  const openAd = () => {
    const route = ad.cta_route;
    close('click');
    if (route && route.startsWith('/')) navigate(route);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-2xl">
        {ad.media_url && (
          <img src={ad.media_url} alt={ad.title} className="w-full aspect-video object-cover" loading="lazy" />
        )}
        <div className="p-5 space-y-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Megaphone className="h-3 w-3" /> Tangazo · WorldFace
          </span>
          <h2 className="font-heading font-bold text-lg leading-snug">{ad.title}</h2>
          {ad.body && <p className="text-sm text-muted-foreground">{ad.body}</p>}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={openAd}>{ad.cta_label}</Button>
            <Button variant="outline" size="icon" aria-label="Funga tangazo" onClick={() => close('dismiss')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Litapotea baada ya {left}s</p>
        </div>
      </div>
    </div>
  );
};
