import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { loadPrefs, isInQuietHours, playNotificationSound, vibrate } from '@/hooks/useNotificationPrefs';

export function useMessageNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // Ask permission once after sign-in (only if user has notifications enabled)
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === 'undefined') return;
    const prefs = loadPrefs();
    if (!prefs.enabled) return;
    if (Notification.permission === 'default') {
      const t = window.setTimeout(() => { Notification.requestPermission().catch(() => {}); }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let conversationIds: string[] = [];

    const setup = async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      if (cancelled) return;
      conversationIds = (data ?? []).map((p) => p.conversation_id);
    };
    setup();

    const channel = supabase
      .channel(`global-messages-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as {
            id: string; conversation_id: string; sender_id: string;
            content: string | null; media_type: string | null;
          };
          if (msg.sender_id === user.id) return;

          if (!conversationIds.includes(msg.conversation_id)) {
            const { data } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('user_id', user.id);
            conversationIds = (data ?? []).map((p) => p.conversation_id);
            if (!conversationIds.includes(msg.conversation_id)) return;
          }

          if (locationRef.current === `/messages/${msg.conversation_id}`) return;

          const prefs = loadPrefs();
          if (!prefs.enabled) return;
          const quiet = isInQuietHours(prefs);

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', msg.sender_id)
            .maybeSingle();

          const title = profile?.display_name || 'New message';
          const body = msg.content
            ? msg.content
            : msg.media_type === 'image' ? '📷 Photo'
            : msg.media_type === 'audio' ? '🎙️ Voice note'
            : 'New message';

          // Always show in-app toast (silent during quiet hours)
          toast({ title, description: body });

          if (!quiet) {
            if (prefs.sound) playNotificationSound();
            if (prefs.vibration) vibrate([60, 40, 60]);
          }

          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            document.visibilityState !== 'visible' &&
            !quiet
          ) {
            try {
              const n = new Notification(title, {
                body,
                icon: profile?.avatar_url || '/favicon.ico',
                tag: `msg-${msg.conversation_id}`,
                badge: '/favicon.ico',
                silent: !prefs.sound,
              });
              n.onclick = () => {
                window.focus();
                navigate(`/messages/${msg.conversation_id}`);
                n.close();
              };
            } catch { /* ignore */ }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
}
