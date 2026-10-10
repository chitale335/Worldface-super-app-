import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ICE_SERVERS, type LiveChatMsg } from './useLiveBroadcast';
import type { LiveStreamInfo } from './useLiveStreams';

/** Viewer side of live streaming: joins a stream room and pulls the host's media. */
export const useLiveViewer = (streamId: string | undefined, viewerId: string | undefined) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [host, setHost] = useState<LiveStreamInfo | null>(null);
  const [viewers, setViewers] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [messages, setMessages] = useState<LiveChatMsg[]>([]);
  const [status, setStatus] = useState<'connecting' | 'live' | 'ended'>('connecting');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!streamId || !viewerId) return;

    const channel = supabase.channel(`live-${streamId}`, {
      config: { presence: { key: viewerId } },
    });
    channelRef.current = channel;

    const countViewers = () => {
      const keys = Object.keys(channel.presenceState()).filter((k) => !k.startsWith('host-'));
      setViewers(keys.length);
    };

    channel
      .on('presence', { event: 'sync' }, countViewers)
      .on('presence', { event: 'join' }, countViewers)
      .on('presence', { event: 'leave' }, countViewers)
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload?.to !== viewerId || !payload?.sdp) return;
        if (payload.host) setHost(payload.host as LiveStreamInfo);

        pcRef.current?.close();
        const media = new MediaStream();
        setRemoteStream(media);

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        pc.ontrack = (e) => e.streams[0]?.getTracks().forEach((t) => media.addTrack(t));
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'ice',
              payload: { to: 'host', from: viewerId, candidate: e.candidate.toJSON() },
            });
          }
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setStatus('live');
          if (pc.connectionState === 'failed' || pc.connectionState === 'closed') setStatus('ended');
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await channel.send({ type: 'broadcast', event: 'answer', payload: { viewerId, sdp: answer } });

        for (const c of pendingIce.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        pendingIce.current = [];
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload?.to !== viewerId || payload?.from !== 'host') return;
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
        } else {
          pendingIce.current.push(payload.candidate);
        }
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload as LiveChatMsg]));
      })
      .on('broadcast', { event: 'heart' }, () => setHearts((h) => h + 1))
      .on('broadcast', { event: 'end' }, () => setStatus('ended'))
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
          await channel.track({ role: 'viewer', viewerId });
          await channel.send({ type: 'broadcast', event: 'viewer-hello', payload: { viewerId } });
        }
      });

    return () => {
      pcRef.current?.close();
      pcRef.current = null;
      pendingIce.current = [];
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [streamId, viewerId]);

  const sendChat = useCallback((msg: LiveChatMsg) => {
    setMessages((prev) => [...prev, msg]);
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg });
  }, []);

  const sendHeart = useCallback(() => {
    setHearts((h) => h + 1);
    channelRef.current?.send({ type: 'broadcast', event: 'heart', payload: {} });
  }, []);

  return { remoteStream, host, viewers, hearts, messages, status, sendChat, sendHeart };
};
