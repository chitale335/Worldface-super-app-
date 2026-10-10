import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PhoneMissed } from 'lucide-react';
import { createElement } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected';

interface CallInfo {
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  isVideo: boolean;
}

interface CallContextType {
  callState: CallState;
  callInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  startCall: (peerId: string, peerName: string, peerAvatar: string | undefined, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType>({
  callState: 'idle',
  callInfo: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  startCall: async () => {},
  acceptCall: async () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleCamera: () => {},
});

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const missedTimerRef = useRef<number | null>(null);
  const wasAnsweredRef = useRef<boolean>(false);

  const showMissedCall = useCallback((name: string, direction: 'outgoing' | 'incoming') => {
    const msg = direction === 'outgoing'
      ? `${name} hakupatikani`
      : `Simu uliyokosa kutoka ${name}`;
    toast(msg, {
      description: direction === 'outgoing' ? 'Hawakujibu simu yako' : 'Bonyeza kumpigia tena',
      icon: createElement(PhoneMissed, { className: 'h-4 w-4 text-destructive' }),
      duration: 6000,
    });
  }, []);

  const clearMissedTimer = useCallback(() => {
    if (missedTimerRef.current !== null) {
      window.clearTimeout(missedTimerRef.current);
      missedTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearMissedTimer();
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallInfo(null);
    setIsMuted(false);
    setIsCameraOff(false);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    wasAnsweredRef.current = false;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [localStream, clearMissedTimer]);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const ch = channelRef.current;
        ch?.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: e.candidate.toJSON(), from: user!.id },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [user, cleanup]);

  const getSignalingChannel = useCallback((peerId: string) => {
    const roomId = [user!.id, peerId].sort().join('-');
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase.channel(`call-${roomId}`);
    channelRef.current = channel;
    return channel;
  }, [user]);

  // Listen for incoming calls on user's personal channel
  useEffect(() => {
    if (!user) return;

    const listenChannel = supabase.channel(`call-signal-${user.id}`);
    listenChannel
      .on('broadcast', { event: 'call-invite' }, (msg) => {
        const { from, fromName, fromAvatar, isVideo } = msg.payload;
        if (callState !== 'idle') return; // busy
        setCallInfo({ peerId: from, peerName: fromName, peerAvatar: fromAvatar, isVideo });
        setCallState('incoming');
        pendingOfferRef.current = null;
      })
      .on('broadcast', { event: 'call-cancel' }, () => {
        if (callState === 'incoming' && callInfo) {
          showMissedCall(callInfo.peerName, 'incoming');
          cleanup();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listenChannel);
    };
  }, [user, callState, callInfo, cleanup, showMissedCall]);

  const startCall = useCallback(async (peerId: string, peerName: string, peerAvatar: string | undefined, isVideo: boolean) => {
    if (!user || callState !== 'idle') return;

    setCallInfo({ peerId, peerName, peerAvatar, isVideo });
    setCallState('outgoing');
    wasAnsweredRef.current = false;

    // Auto-miss after 30s if no answer
    clearMissedTimer();
    missedTimerRef.current = window.setTimeout(() => {
      if (!wasAnsweredRef.current) {
        showMissedCall(peerName, 'outgoing');
        // notify peer to dismiss their incoming UI
        if (channelRef.current) {
          channelRef.current.send({ type: 'broadcast', event: 'end-call', payload: { from: user.id } });
        }
        const cancelChannel = supabase.channel(`call-signal-${peerId}`);
        cancelChannel.subscribe((s) => {
          if (s === 'SUBSCRIBED') {
            cancelChannel.send({ type: 'broadcast', event: 'call-cancel', payload: { from: user.id } })
              .finally(() => supabase.removeChannel(cancelChannel));
          }
        });
        cleanup();
      }
    }, 30000);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
    setLocalStream(stream);

    const pc = createPeerConnection(peerId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const channel = getSignalingChannel(peerId);

    channel
      .on('broadcast', { event: 'answer' }, async (msg) => {
        if (msg.payload.from !== peerId) return;
        wasAnsweredRef.current = true;
        clearMissedTimer();
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
        setCallState('connected');
        // Apply pending candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];
      })
      .on('broadcast', { event: 'ice-candidate' }, async (msg) => {
        if (msg.payload.from !== peerId) return;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
        } else {
          pendingCandidatesRef.current.push(msg.payload.candidate);
        }
      })
      .on('broadcast', { event: 'end-call' }, () => cleanup())
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          // Fetch caller's profile for the invite
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();

          // Send invite to peer's personal channel
          const inviteChannel = supabase.channel(`call-signal-${peerId}`);
          inviteChannel.subscribe(async (s) => {
            if (s === 'SUBSCRIBED') {
              await inviteChannel.send({
                type: 'broadcast',
                event: 'call-invite',
                payload: {
                  from: user.id,
                  fromName: myProfile?.display_name ?? 'User',
                  fromAvatar: myProfile?.avatar_url ?? '',
                  isVideo,
                },
              });
              // Also send offer on the shared room channel
              await channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { sdp: offer, from: user.id },
              });
              supabase.removeChannel(inviteChannel);
            }
          });
        }
      });
  }, [user, callState, createPeerConnection, getSignalingChannel, cleanup, clearMissedTimer, showMissedCall]);

  const acceptCall = useCallback(async () => {
    if (!user || !callInfo || callState !== 'incoming') return;

    const { peerId, isVideo } = callInfo;
    setCallState('connected');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
    setLocalStream(stream);

    const pc = createPeerConnection(peerId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const channel = getSignalingChannel(peerId);

    channel
      .on('broadcast', { event: 'offer' }, async (msg) => {
        if (msg.payload.from !== peerId) return;
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: { sdp: answer, from: user.id },
        });
        // Apply pending candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];
      })
      .on('broadcast', { event: 'ice-candidate' }, async (msg) => {
        if (msg.payload.from !== peerId) return;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
        } else {
          pendingCandidatesRef.current.push(msg.payload.candidate);
        }
      })
      .on('broadcast', { event: 'end-call' }, () => cleanup())
      .subscribe();
  }, [user, callInfo, callState, createPeerConnection, getSignalingChannel, cleanup]);

  const endCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: { from: user?.id },
      });
    }
    // Also notify the peer's personal channel if outgoing/incoming
    if (callInfo && (callState === 'outgoing' || callState === 'incoming')) {
      const cancelChannel = supabase.channel(`call-signal-${callInfo.peerId}`);
      cancelChannel.subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
          await cancelChannel.send({
            type: 'broadcast',
            event: 'call-cancel',
            payload: { from: user?.id },
          });
          supabase.removeChannel(cancelChannel);
        }
      });
    }
    cleanup();
  }, [user, callInfo, callState, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsMuted((v) => !v);
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsCameraOff((v) => !v);
    }
  }, [localStream]);

  return (
    <CallContext.Provider value={{
      callState, callInfo, localStream, remoteStream,
      isMuted, isCameraOff,
      startCall, acceptCall, endCall, toggleMute, toggleCamera,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
