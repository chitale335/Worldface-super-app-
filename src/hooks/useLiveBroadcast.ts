import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { LIVE_LOBBY, type LiveStreamInfo } from './useLiveStreams';

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface LiveChatMsg {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  isGift?: boolean;
  giftEmoji?: string;
  ts: number;
}

interface Options {
  enabled: boolean;
  stream: MediaStream | null;
  hostId?: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
}

/**
 * Broadcaster side of live streaming.
 * - Announces the stream on the shared lobby presence channel (discovery)
 * - Creates one RTCPeerConnection per viewer that says hello
 * - Relays chat / hearts / gifts over realtime broadcast
 */
export const useLiveBroadcast = ({ enabled, stream, hostId, hostName, hostAvatar, title }: Options) => {
  const [streamId, setStreamId] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [messages, setMessages] = useState<LiveChatMsg[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lobbyRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(stream);
  streamRef.current = stream;

  /* Keep tracks fresh when the camera is flipped/restarted */
  useEffect(() => {
    if (!stream) return;
    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        const track = stream.getTracks().find((t) => t.kind === sender.track?.kind);
        if (track) sender.replaceTrack(track).catch(() => {});
      });
    });
  }, [stream]);

  useEffect(() => {
    if (!enabled || !hostId) {
      setStreamId(null);
      return;
    }

    const id = crypto.randomUUID();
    setStreamId(id);
    setViewers(0);
    setHearts(0);

    const info: LiveStreamInfo = {
      streamId: id,
      hostId,
      hostName,
      hostAvatar,
      title,
      startedAt: Date.now(),
    };

    /* --- stream room --- */
    const channel = supabase.channel(`live-${id}`, {
      config: { presence: { key: `host-${hostId}` } },
    });
    channelRef.current = channel;

    const countViewers = () => {
      const state = channel.presenceState();
      const keys = Object.keys(state).filter((k) => !k.startsWith('host-'));
      setViewers(keys.length);
    };

    const makePeer = async (viewerId: string) => {
      peersRef.current.get(viewerId)?.close();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current.set(viewerId, pc);

      streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'ice',
            payload: { to: viewerId, from: 'host', candidate: e.candidate.toJSON() },
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await channel.send({
        type: 'broadcast',
        event: 'offer',
        payload: { to: viewerId, sdp: offer, host: info },
      });
    };

    channel
      .on('presence', { event: 'sync' }, countViewers)
      .on('presence', { event: 'join' }, countViewers)
      .on('presence', { event: 'leave' }, countViewers)
      .on('broadcast', { event: 'viewer-hello' }, ({ payload }) => {
        if (payload?.viewerId) makePeer(payload.viewerId).catch(() => {});
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        const pc = peersRef.current.get(payload?.viewerId);
        if (pc && payload?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)).catch(() => {});
        }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload?.to !== 'host') return;
        const pc = peersRef.current.get(payload?.from);
        if (pc && payload?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
        }
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload as LiveChatMsg]));
      })
      .on('broadcast', { event: 'heart' }, () => setHearts((h) => h + 1))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'host', hostId });
        }
      });

    /* --- lobby announcement --- */
    const lobby = supabase.channel(LIVE_LOBBY, {
      config: { presence: { key: `host-${hostId}` } },
    });
    lobbyRef.current = lobby;
    lobby.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await lobby.track(info);
    });

    return () => {
      channel.send({ type: 'broadcast', event: 'end', payload: { streamId: id } }).catch(() => {});
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      supabase.removeChannel(channel);
      supabase.removeChannel(lobby);
      channelRef.current = null;
      lobbyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hostId]);

  const publish = useCallback((msg: LiveChatMsg) => {
    setMessages((prev) => [...prev, msg]);
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg });
  }, []);

  const sendHeart = useCallback(() => {
    setHearts((h) => h + 1);
    channelRef.current?.send({ type: 'broadcast', event: 'heart', payload: {} });
  }, []);

  return { streamId, viewers, hearts, messages, publish, sendHeart };
};
