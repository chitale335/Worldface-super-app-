import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLiveViewer } from '@/hooks/useLiveViewer';
import { GIFTS, type Gift } from '@/components/feed/GiftPicker';
import { GiftAnimation } from '@/components/feed/GiftAnimation';
import {
  Radio, Eye, Heart, Loader2, MessageCircle, Send, Coins, Gift as GiftIcon, ArrowLeft, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LiveWatch() {
  const { streamId } = useParams<{ streamId: string }>();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { toast } = useToast();

  const viewerId = useMemo(() => user?.id ?? `guest-${crypto.randomUUID()}`, [user?.id]);
  const { remoteStream, host, viewers, hearts, messages, status, sendChat, sendHeart } =
    useLiveViewer(streamId, viewerId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [giftEmoji, setGiftEmoji] = useState<string | null>(null);
  const [burstId, setBurstId] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!chatInput.trim()) return;
    sendChat({
      id: crypto.randomUUID(),
      user: profile?.display_name ?? 'Viewer',
      avatar: profile?.avatar_url ?? undefined,
      text: chatInput.trim(),
      ts: Date.now(),
    });
    setChatInput('');
  };

  const sendGift = (gift: Gift) => {
    if (gift.cost > balance) {
      toast({ title: 'Not enough coins', description: `You need ${gift.cost} coins.`, variant: 'destructive' });
      return;
    }
    setGiftEmoji(gift.emoji);
    setBurstId((id) => id + 1);
    sendChat({
      id: crypto.randomUUID(),
      user: profile?.display_name ?? 'Viewer',
      avatar: profile?.avatar_url ?? undefined,
      text: `sent ${gift.emoji} ${gift.name}!`,
      isGift: true,
      giftEmoji: gift.emoji,
      ts: Date.now(),
    });
    toast({ title: `${gift.emoji} Gift sent!`, description: `${gift.name} · ${gift.cost} coins` });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/live" aria-label="Back to live"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={host?.hostAvatar} />
            <AvatarFallback>{host?.hostName?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-bold truncate">{host?.title ?? 'Live stream'}</h1>
            <p className="text-xs text-muted-foreground truncate">{host?.hostName ?? 'Connecting…'}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {status === 'live' && (
              <Badge variant="secondary" className="gap-1.5 bg-red-500/20 text-red-400 border-red-500/30">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1"><Eye className="h-3.5 w-3.5" /> {viewers}</Badge>
            <Badge variant="secondary" className="gap-1 text-rose-400">
              <Heart className="h-3.5 w-3.5 fill-current" /> {hearts}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Player */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {status !== 'live' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-primary/10 to-violet-900/40">
                {status === 'connecting' ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Connecting to the stream…</p>
                  </>
                ) : (
                  <>
                    <Radio className="h-10 w-10 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">This stream has ended.</p>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to="/live">Browse live streams</Link>
                    </Button>
                  </>
                )}
              </div>
            )}

            <GiftAnimation emoji={giftEmoji} burstId={burstId} />

            {status === 'live' && (
              <button
                onClick={sendHeart}
                aria-label="Send heart"
                className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-rose-500/30 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
              >
                <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
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
                  const enabled = g.cost <= balance && status === 'live';
                  return (
                    <motion.button
                      key={g.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={!enabled}
                      onClick={() => sendGift(g)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all',
                        enabled
                          ? 'border-border/50 bg-muted/50 hover:bg-primary/10 hover:border-primary/30'
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

            <Card className="flex-1 min-h-[300px] flex flex-col border-border/50 bg-card/80 backdrop-blur">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Live Chat</span>
                <Badge variant="secondary" className="ml-auto text-xs gap-1">
                  <Users className="h-3 w-3" /> {viewers}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
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

              <div className="p-2 border-t border-border/50">
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={status === 'live' ? 'Say something…' : 'Stream offline'}
                    disabled={status !== 'live'}
                    className="rounded-full"
                  />
                  <Button size="icon" type="submit" disabled={status !== 'live' || !chatInput.trim()} className="rounded-full shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
