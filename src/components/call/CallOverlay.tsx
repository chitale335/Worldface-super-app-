import { useEffect, useRef } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRingtone } from '@/hooks/useRingtone';

export const CallOverlay = () => {
  const {
    callState, callInfo, localStream, remoteStream,
    isMuted, isCameraOff,
    acceptCall, endCall, toggleMute, toggleCamera,
  } = useCall();

  // Ring sounds: incoming = ringtone, outgoing = ringback
  useRingtone(callState === 'incoming', 'incoming');
  useRingtone(callState === 'outgoing', 'outgoing');

  // Vibrate on incoming call (mobile)
  useEffect(() => {
    if (callState !== 'incoming' || typeof navigator === 'undefined' || !navigator.vibrate) return;
    const id = window.setInterval(() => navigator.vibrate?.([400, 200, 400]), 1500);
    navigator.vibrate?.([400, 200, 400]);
    return () => clearInterval(id);
  }, [callState]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle' || !callInfo) return null;

  const initials = callInfo.peerName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const isVideo = callInfo.isVideo;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between">
      {/* Remote video (full screen) */}
      {isVideo && callState === 'connected' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark overlay for non-video or ringing states */}
      {(!isVideo || callState !== 'connected') && (
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      )}

      {/* Top section: caller info */}
      <div className="relative z-10 flex flex-col items-center pt-20 gap-4">
        <Avatar className="h-28 w-28 border-4 border-primary/30 shadow-xl">
          <AvatarImage src={callInfo.peerAvatar} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {callInfo.peerName || 'Unknown'}
        </h2>
        <p className={cn(
          'text-sm font-medium',
          callState === 'incoming' && 'text-green-400 animate-pulse',
          callState === 'outgoing' && 'text-muted-foreground animate-pulse',
          callState === 'connected' && 'text-green-400',
        )}>
          {callState === 'incoming' && 'Incoming call…'}
          {callState === 'outgoing' && 'Calling…'}
          {callState === 'connected' && (isVideo ? 'Video call' : 'Voice call')}
        </p>
      </div>

      {/* Local video (small PiP) */}
      {isVideo && localStream && callState === 'connected' && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 z-20 w-32 h-44 rounded-2xl object-cover border-2 border-border shadow-lg"
        />
      )}

      {/* Ringing animation */}
      {(callState === 'incoming' || callState === 'outgoing') && (
        <div className="relative z-10 flex-1 flex items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <Phone className="h-16 w-16 text-primary relative z-10" />
          </div>
        </div>
      )}

      {/* Spacer for connected */}
      {callState === 'connected' && <div className="flex-1" />}

      {/* Controls */}
      <div className="relative z-10 pb-12 flex items-center gap-4">
        {callState === 'incoming' && (
          <>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
              onClick={endCall}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
              onClick={acceptCall}
            >
              <Phone className="h-7 w-7" />
            </Button>
          </>
        )}

        {callState === 'outgoing' && (
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
            onClick={endCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        )}

        {callState === 'connected' && (
          <>
            <Button
              size="lg"
              variant="outline"
              className={cn('h-14 w-14 rounded-full', isMuted && 'bg-destructive/20 border-destructive')}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6 text-destructive" /> : <Mic className="h-6 w-6" />}
            </Button>
            {isVideo && (
              <Button
                size="lg"
                variant="outline"
                className={cn('h-14 w-14 rounded-full', isCameraOff && 'bg-destructive/20 border-destructive')}
                onClick={toggleCamera}
              >
                {isCameraOff ? <VideoOff className="h-6 w-6 text-destructive" /> : <Video className="h-6 w-6" />}
              </Button>
            )}
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
              onClick={endCall}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
