import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GIFTS, type Gift } from '@/components/feed/GiftPicker';
import { GiftAnimation } from '@/components/feed/GiftAnimation';
import {
  Video, VideoOff, Mic, MicOff, Radio, Eye, Heart, Gift as GiftIcon,
  Coins, MessageCircle, Send, Camera, SwitchCamera, Sparkles, Users,
  X, Flame, Crown, Diamond, Star, ShieldAlert, RefreshCw, Settings, Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useLiveBroadcast } from '@/hooks/useLiveBroadcast';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { sendPush } from '@/lib/push';


/* ------------------------------------------------------------------ */
/*  Chat message type                                                  */
/* ------------------------------------------------------------------ */
type ChatMsg = {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  isGift?: boolean;
  giftEmoji?: string;
  ts: number;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LiveStream() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const { toast } = useToast();

  /* Camera */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  /* Permission state: 'unknown' | 'granted' | 'denied' | 'dismissed' */
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'dismissed'>('unknown');
  const [permissionChecking, setPermissionChecking] = useState(false);

  /* Stream title */
  const [title, setTitle] = useState('');

  /* Gift overlay */
  const [giftEmoji, setGiftEmoji] = useState<string | null>(null);
  const [burstId, setBurstId] = useState(0);
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  /* Gift goal */
  const [giftGoalTarget, setGiftGoalTarget] = useState(500);
  const [giftGoalCoins, setGiftGoalCoins] = useState(0);
  const giftGoalPercent = Math.min((giftGoalCoins / giftGoalTarget) * 100, 100);
  const giftGoalReached = giftGoalCoins >= giftGoalTarget;

  /* Chat */
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Profile */
  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, username')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  /* Real-time broadcast (WebRTC to viewers + realtime chat/gifts) */
  const { streamId, viewers, hearts, messages, publish, sendHeart } = useLiveBroadcast({
    enabled: isLive,
    stream,
    hostId: user?.id,
    hostName: profile?.display_name ?? 'WorldFace Creator',
    hostAvatar: profile?.avatar_url ?? undefined,
    title: title.trim() || `${profile?.display_name ?? 'Creator'} is live`,
  });

  /* Other creators currently live */
  const otherStreams = useLiveStreams().filter((s) => s.hostId !== user?.id);

  const shareUrl = streamId ? `${window.location.origin}/live/${streamId}` : '';

  /* ---- check permission state via Permissions API ---- */
  const checkPermission = useCallback(async () => {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (cam.state === 'denied' || mic.state === 'denied') {
        setPermissionState('denied');
      } else if (cam.state === 'granted' && mic.state === 'granted') {
        setPermissionState('granted');
      } else {
        setPermissionState('unknown'); // prompt will appear
      }
    } catch {
      // Permissions API not supported – will find out on getUserMedia
      setPermissionState('unknown');
    }
  }, []);

  useEffect(() => { checkPermission(); }, [checkPermission]);

  /* ---- start / stop camera ---- */
  const startCamera = useCallback(async (): Promise<boolean> => {
    setPermissionChecking(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setPermissionState('granted');
      setPermissionChecking(false);
      return true;
    } catch (err: any) {
      setPermissionChecking(false);
      const name = err?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionState('denied');
        return false;
      }
      if (name === 'AbortError') {
        // User dismissed the prompt without choosing
        setPermissionState('dismissed');
        return false;
      }
      // Other errors (no camera hardware, etc.)
      toast({ title: 'Camera error', description: err?.message ?? 'Could not access camera.', variant: 'destructive' });
      return false;
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream]);

  const goLive = async () => {
    if (!isLive) {
      const ok = await startCamera();
      if (!ok) return; // permission denied/dismissed – don't go live
      setIsLive(true);
      void sendPush({
        event: 'live',
        title: '🔴 Live sasa kwenye WorldFace',
        body: 'Creator unayemfuata ameanza live. Jiunge sasa!',
        url: '/live',
      });
      toast({ title: '🔴 You are LIVE!', description: 'Share your link so viewers can join.' });
    } else {
      stopCamera();
      setIsLive(false);
      setGiftGoalCoins(0);
      toast({ title: 'Stream ended', description: 'Thanks for streaming!' });
    }
  };

  const retryPermission = async () => {
    setPermissionState('unknown');
    await startCamera();
  };

  /* Toggle mute / cam */
  const toggleMute = () => {
    stream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((v) => !v);
  };
  const toggleCam = () => {
    stream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCamOff((v) => !v);
  };
  const flipCamera = async () => {
    stopCamera();
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
    // camera restarts via effect below
  };
  useEffect(() => {
    if (isLive) startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  /* Heart tap */
  const tapHeart = () => sendHeart();

  /* Gift sending */
  const sendGift = async (gift: Gift) => {
    if (gift.cost > balance) {
      toast({ title: 'Not enough coins', description: `You need ${gift.cost} coins.`, variant: 'destructive' });
      return;
    }
    // Trigger animation
    setGiftGoalCoins((prev) => prev + gift.cost);
    setGiftEmoji(gift.emoji);
    setBurstId((id) => id + 1);
    setShowGiftPanel(false);

    // Add chat msg
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      user: profile?.display_name ?? 'You',
      avatar: profile?.avatar_url ?? undefined,
      text: `sent ${gift.emoji} ${gift.name}!`,
      isGift: true,
      giftEmoji: gift.emoji,
      ts: Date.now(),
    };
    publish(msg);

    toast({ title: `${gift.emoji} Gift sent!`, description: `You sent a ${gift.name} for ${gift.cost} coins.` });
  };

  /* Send chat */
  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      user: profile?.display_name ?? 'You',
      avatar: profile?.avatar_url ?? undefined,
      text: chatInput.trim(),
      ts: Date.now(),
    };
    publish(msg);
    setChatInput('');
  };

  /* Auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Cleanup on unmount */
  useEffect(() => () => {
    stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isLive
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse'
                  : 'bg-muted',
              )}>
                <Radio className="h-5 w-5 text-white" />
              </div>
              {isLive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Live Stream</h1>
              <p className="text-xs text-muted-foreground">
                {isLive ? 'Broadcasting live' : 'Start your live stream'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <Badge variant="secondary" className="gap-1.5 bg-red-500/20 text-red-400 border-red-500/30">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="h-3.5 w-3.5" /> {viewers}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-rose-400">
                  <Heart className="h-3.5 w-3.5 fill-current" /> {hearts}
                </Badge>
              </motion.div>
            )}
            <Badge variant="outline" className="gap-1">
              <Coins className="h-3.5 w-3.5 text-amber-400" /> {balance.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video area */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover',
                isCamOff && 'opacity-0',
              )}
            />

            {/* Dark overlay when cam off */}
            {isCamOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <VideoOff className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}

            {/* Not live state */}
            {!isLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary/10 to-violet-900/40">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-rose-500 via-primary to-violet-500 p-[3px]">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-heading font-bold gradient-text">Go Live</h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Start streaming, connect with your audience, and receive gifts in real-time
                  </p>
                </motion.div>
              </div>
            )}

            {/* Permission denied / dismissed overlay */}
            {!isLive && (permissionState === 'denied' || permissionState === 'dismissed') && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4 max-w-sm px-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-destructive/15 flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                  </div>

                  {permissionState === 'denied' ? (
                    <>
                      <h3 className="text-lg font-heading font-bold text-foreground">Camera & Mic Blocked</h3>
                      <p className="text-sm text-muted-foreground">
                        Your browser has blocked camera and microphone access. To go live, you need to allow permissions:
                      </p>
                      <ol className="text-xs text-muted-foreground text-left space-y-1.5 list-decimal list-inside">
                        <li>Click the <Settings className="inline h-3.5 w-3.5 -mt-0.5" /> icon in your browser's address bar</li>
                        <li>Find <strong>Camera</strong> and <strong>Microphone</strong> permissions</li>
                        <li>Change both to <strong>Allow</strong></li>
                        <li>Reload the page or tap <strong>Retry</strong> below</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-heading font-bold text-foreground">Permission Required</h3>
                      <p className="text-sm text-muted-foreground">
                        You dismissed the camera/microphone permission prompt. Tap <strong>Retry</strong> to try again.
                      </p>
                    </>
                  )}

                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={retryPermission} disabled={permissionChecking} className="gap-2">
                      <RefreshCw className={cn('h-4 w-4', permissionChecking && 'animate-spin')} />
                      {permissionChecking ? 'Requesting…' : 'Retry'}
                    </Button>
                    <Button variant="outline" onClick={() => setPermissionState('unknown')}>
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Gift animation overlay */}
            <GiftAnimation emoji={giftEmoji} burstId={burstId} />

            {/* Floating hearts on tap */}
            {isLive && (
              <button
                onClick={tapHeart}
                className="absolute right-4 bottom-20 w-12 h-12 rounded-full bg-rose-500/30 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
              >
                <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
              </button>
            )}

            {/* Controls bar */}
            {isLive && (
              <motion.div
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
              >
                <div className="flex items-center justify-center gap-3">
                  <Button size="icon" variant="ghost"
                    className={cn('rounded-full backdrop-blur bg-white/10 hover:bg-white/20', isMuted && 'bg-red-500/30 text-red-400')}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button size="icon" variant="ghost"
                    className={cn('rounded-full backdrop-blur bg-white/10 hover:bg-white/20', isCamOff && 'bg-red-500/30 text-red-400')}
                    onClick={toggleCam}
                  >
                    {isCamOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                  <Button size="icon" variant="ghost"
                    className="rounded-full backdrop-blur bg-white/10 hover:bg-white/20"
                    onClick={flipCamera}
                  >
                    <SwitchCamera className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={goLive}
                    className="rounded-full bg-red-500 hover:bg-red-600 text-white px-6"
                  >
                    End Live
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

            {/* Gift Goal Progress Bar */}
            {isLive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <Card className="p-4 border-border/50 bg-card/80 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        giftGoalReached
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 animate-pulse'
                          : 'bg-primary/15',
                      )}>
                        <Trophy className={cn('h-4 w-4', giftGoalReached ? 'text-white' : 'text-primary')} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">
                          {giftGoalReached ? '🎉 Goal Reached!' : 'Gift Goal'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {giftGoalCoins.toLocaleString()} / {giftGoalTarget.toLocaleString()} coins
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {Math.round(giftGoalPercent)}%
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative h-4 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full',
                        giftGoalReached
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-primary via-violet-500 to-primary',
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${giftGoalPercent}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  </div>

                  {/* Milestone markers */}
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <span
                        key={pct}
                        className={cn(
                          'text-[9px] tabular-nums',
                          giftGoalPercent >= pct ? 'text-primary font-semibold' : 'text-muted-foreground/50',
                        )}
                      >
                        {Math.round((giftGoalTarget * pct) / 100)}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

          {/* Right sidebar: Chat + Gifts */}
          <div className="flex flex-col gap-4">
            {/* Gift panel */}
            <Card className="p-4 border-border/50 bg-card/80 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <GiftIcon className="h-4 w-4 text-amber-400" /> Send Gifts
                </h3>
                <Badge variant="outline" className="text-xs gap-1">
                  <Coins className="h-3 w-3 text-amber-400" /> {balance.toLocaleString()}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GIFTS.map((g) => {
                  const affordable = g.cost <= balance;
                  return (
                    <motion.button
                      key={g.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={!affordable || !isLive}
                      onClick={() => sendGift(g)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all',
                        affordable && isLive
                          ? 'border-border/50 bg-muted/50 hover:bg-primary/10 hover:border-primary/30 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed border-transparent',
                      )}
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="text-[9px] text-muted-foreground">{g.cost}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            {/* Live chat */}
            <Card className="flex-1 min-h-[300px] flex flex-col border-border/50 bg-card/80 backdrop-blur">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Live Chat</span>
                <Badge variant="secondary" className="ml-auto text-xs gap-1">
                  <Users className="h-3 w-3" /> {viewers}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 text-sm text-center gap-2">
                    <Sparkles className="h-8 w-8" />
                    <p>{isLive ? 'Chat is live! Say something...' : 'Go live to start chatting'}</p>
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-start gap-2',
                        msg.isGift && 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 -mx-1 px-2 py-1.5 rounded-lg',
                      )}
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="text-[10px]">{msg.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-primary">{msg.user}</span>
                        <p className="text-xs text-foreground/80 break-words">
                          {msg.isGift && <span className="text-lg mr-1">{msg.giftEmoji}</span>}
                          {msg.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-2 border-t border-border/50">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendChat(); }}
                  className="flex gap-2"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isLive ? 'Say something...' : 'Go live first'}
                    disabled={!isLive}
                    className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors disabled:opacity-40"
                  />
                  <Button size="icon" type="submit" disabled={!isLive || !chatInput.trim()}
                    className="rounded-full shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>

        {/* Share link while live */}
        {isLive && shareUrl && (
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Share this link so people can watch you live</p>
              <p className="text-sm font-mono truncate">{shareUrl}</p>
            </div>
            <Button
              variant="outline"
              className="rounded-full shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: 'Link copied', description: 'Send it to your audience.' });
              }}
            >
              Copy link
            </Button>
          </Card>
        )}

        {/* Go Live (pre-stream) */}
        {!isLive && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stream title (optional)"
              maxLength={80}
              className="max-w-sm rounded-full text-center"
            />
            <Button
              size="lg"
              onClick={goLive}
              className="rounded-full px-10 py-6 text-lg font-heading bg-gradient-to-r from-rose-500 via-primary to-violet-500 hover:opacity-90 shadow-lg shadow-primary/30"
            >
              <Radio className="h-5 w-5 mr-2 animate-pulse" />
              Go Live
            </Button>
          </motion.div>
        )}

        {/* Live now directory */}
        {otherStreams.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500" /> Live now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherStreams.map((s) => (
                <Link key={s.streamId} to={`/live/${s.streamId}`}>
                  <Card className="p-4 border-border/50 bg-card/80 backdrop-blur hover:border-primary/40 transition-colors flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={s.hostAvatar} />
                      <AvatarFallback>{s.hostName?.[0] ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.hostName}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto gap-1 bg-red-500/20 text-red-400 border-red-500/30">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
