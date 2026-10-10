import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const LIVE_LOBBY = 'live-lobby';

export interface LiveStreamInfo {
  streamId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
  startedAt: number;
}

/** Discovery: all currently active live streams, via realtime presence. */
export const useLiveStreams = () => {
  const [streams, setStreams] = useState<LiveStreamInfo[]>([]);

  useEffect(() => {
    const channel = supabase.channel(LIVE_LOBBY, {
      config: { presence: { key: `watcher-${crypto.randomUUID()}` } },
    });

    const sync = () => {
      const state = channel.presenceState<LiveStreamInfo & { presence_ref: string }>();
      const list: LiveStreamInfo[] = [];
      Object.values(state).forEach((entries) => {
        entries.forEach((e) => {
          if (e && (e as unknown as LiveStreamInfo).streamId) {
            const s = e as unknown as LiveStreamInfo;
            if (!list.some((x) => x.streamId === s.streamId)) list.push(s);
          }
        });
      });
      list.sort((a, b) => b.startedAt - a.startedAt);
      setStreams(list);
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return streams;
};
