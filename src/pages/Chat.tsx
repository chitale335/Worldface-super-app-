import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCall } from '@/contexts/CallContext';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Image as ImageIcon, Mic, Square, X, Phone, Video, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { markConversationRead } from '@/hooks/useUnreadMessages';
import { ChatImage, ChatAudio } from '@/components/chat/ChatMedia';
import { sendPush } from '@/lib/push';

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  duration_seconds: number | null;
  created_at: string;
};

const Chat = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const { startCall } = useCall();
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Other participant
  const { data: otherProfile } = useQuery({
    queryKey: ['chat-participant', conversationId],
    queryFn: async () => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId!)
        .neq('user_id', user!.id);
      if (!participants?.length) return null;
      const otherId = participants[0].user_id;
      const [{ data: profile }, { data: wallet }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', otherId).single(),
        supabase.from('wallet_accounts').select('account_number').eq('user_id', otherId).maybeSingle(),
      ]);
      return profile ? { ...profile, account_number: wallet?.account_number ?? null } : null;
    },
    enabled: !!conversationId && !!user,
  });

  // Other participant's last_read_at (for read receipts)
  const { data: peerRead } = useQuery({
    queryKey: ['peer-read', conversationId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId!)
        .neq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!conversationId && !!user,
  });

  // Messages
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages').select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      return (data ?? []) as ChatMessage[];
    },
    enabled: !!conversationId,
  });

  // Realtime: INSERT za messages kwa conversation_id husika pekee
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          queryClient.setQueryData<ChatMessage[]>(
            ['messages', conversationId],
            (prev) => {
              if (!prev) return [newMsg];
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            }
          );
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['peer-read', conversationId, user?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, user?.id]);

  // Presence + typing
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: user.id } },
    });
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, unknown[]>;
        const others = Object.keys(state).filter((k) => k !== user.id);
        setPeerOnline(others.length > 0);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId && payload.userId !== user.id) {
          setPeerTyping(true);
          if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = window.setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: Date.now() });
      });

    return () => {
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

  // Mark conversation as read when opened or new messages arrive
  useEffect(() => {
    if (!conversationId || !user) return;
    markConversationRead(conversationId, user.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
    });
  }, [conversationId, user, messages, queryClient]);

  const broadcastTyping = useCallback(() => {
    presenceChannelRef.current?.send({
      type: 'broadcast', event: 'typing', payload: { userId: user?.id },
    });
  }, [user?.id]);

  const sendMessage = useMutation({
    mutationFn: async (payload: { content?: string; media_url?: string; media_type?: string; duration_seconds?: number }) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId!,
        sender_id: user!.id,
        content: payload.content ?? null,
        media_url: payload.media_url ?? null,
        media_type: payload.media_type ?? null,
        duration_seconds: payload.duration_seconds ?? null,
      });
      if (error) throw error;
      void sendPush({
        event: 'message',
        conversation_id: conversationId!,
        title: 'Ujumbe mpya WorldFace',
        body: (payload.content ?? 'Alikutumia media').slice(0, 120),
        url: `/messages/${conversationId}`,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: Error) => toast({ title: 'Failed to send', description: err.message, variant: 'destructive' }),
  });

  const uploadAndSend = async (blob: Blob, ext: string, media_type: 'image' | 'audio', duration?: number) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-media').upload(path, blob, {
        contentType: blob.type, upsert: false,
      });
      if (upErr) throw upErr;
      // Store the object path (not a public URL); bucket is private and we sign on read.
      await sendMessage.mutateAsync({ media_url: path, media_type, duration_seconds: duration });
    } catch (e) {
      toast({ title: 'Upload failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    await uploadAndSend(file, ext, 'image');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) recordChunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' });
        const seconds = recordSeconds;
        setRecordSeconds(0);
        if (blob.size > 0) await uploadAndSend(blob, 'webm', 'audio', seconds);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast({ title: 'Microphone blocked', description: 'Allow microphone access to record voice notes.', variant: 'destructive' });
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordTimerRef.current) { window.clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecording(false);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (cancel) {
      mr.ondataavailable = null;
      mr.onstop = () => mr.stream.getTracks().forEach((t) => t.stop());
      setRecordSeconds(0);
    }
    if (mr.state !== 'inactive') mr.stop();
    mediaRecorderRef.current = null;
  };

  const initials = otherProfile?.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  const formatDuration = (s?: number | null) => {
    const v = s ?? 0;
    return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherProfile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-heading text-sm">{initials}</AvatarFallback>
            </Avatar>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
              peerOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{otherProfile?.display_name || 'Unknown'}</h2>
            <div className="flex items-center gap-2 text-xs">
              {(otherProfile as any)?.account_number && (
                <span className="font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {(otherProfile as any).account_number}
                </span>
              )}
              <span className="text-muted-foreground">
                {peerTyping ? 'Typing…' : peerOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voice call"
            disabled={!otherProfile?.user_id}
            onClick={() => otherProfile && startCall(otherProfile.user_id, otherProfile.display_name ?? 'User', otherProfile.avatar_url ?? undefined, false)}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Video call"
            disabled={!otherProfile?.user_id}
            onClick={() => otherProfile && startCall(otherProfile.user_id, otherProfile.display_name ?? 'User', otherProfile.avatar_url ?? undefined, true)}
          >
            <Video className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : messages?.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Send a message to start the conversation!</p>
          ) : (
            (() => {
              const peerReadAt = peerRead?.last_read_at ? new Date(peerRead.last_read_at).getTime() : 0;
              const lastSeenMyMsgId = [...(messages ?? [])]
                .filter((m) => m.sender_id === user!.id && new Date(m.created_at).getTime() <= peerReadAt)
                .pop()?.id;
              return messages?.map((msg) => {
                const isMe = msg.sender_id === user!.id;
                const seen = isMe && msg.id === lastSeenMyMsgId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col items-end max-w-[75%]">
                      <div className={cn(
                        'rounded-2xl shadow-sm overflow-hidden',
                        isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary text-secondary-foreground rounded-bl-md',
                        msg.media_type === 'image' ? 'p-1' : 'px-4 py-2.5'
                      )}>
                        {msg.media_type === 'image' && msg.media_url && (
                          <ChatImage mediaUrl={msg.media_url} className="rounded-xl max-h-80 object-cover" />
                        )}
                        {msg.media_type === 'audio' && msg.media_url && (
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <ChatAudio mediaUrl={msg.media_url} className="h-8 w-full" />
                            <span className="text-[10px] opacity-70 whitespace-nowrap">{formatDuration(msg.duration_seconds)}</span>
                          </div>
                        )}
                        {msg.content && <p className={cn('text-sm whitespace-pre-wrap break-words', msg.media_type && 'px-3 pt-2')}>{msg.content}</p>}
                        <div className={cn(
                          'flex items-center justify-end gap-1 mt-1',
                          msg.media_type === 'image' && 'px-3 pb-1'
                        )}>
                          {msg.content && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(msg.content ?? '');
                                toast({ title: 'Copied to clipboard' });
                              }}
                              className={cn(
                                'opacity-60 hover:opacity-100 transition-opacity',
                                isMe ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                              aria-label="Copy message"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                          <p className={cn(
                            'text-[10px]',
                            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      {seen && peerRead?.last_read_at && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 mr-1">
                          Seen {format(new Date(peerRead.last_read_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
          {peerTyping && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm">
          {recording ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => stopRecording(true)}>
                <X className="h-5 w-5" />
              </Button>
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-destructive/10">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-mono text-foreground">{formatDuration(recordSeconds)}</span>
                <span className="text-xs text-muted-foreground ml-auto">Recording…</span>
              </div>
              <Button size="icon" onClick={() => stopRecording(false)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newMessage.trim()) sendMessage.mutate({ content: newMessage.trim() });
              }}
              className="flex gap-2 items-center"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
              <Button type="button" variant="ghost" size="icon" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" disabled={uploading} onClick={startRecording}>
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                placeholder="Type a message..."
                className="flex-1 rounded-full"
                maxLength={2000}
                disabled={uploading}
              />
              {newMessage.trim() ? (
                <Button type="submit" size="icon" className="rounded-full" disabled={sendMessage.isPending || uploading}>
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              ) : (
                <Button type="button" size="icon" className="rounded-full" disabled={uploading} onClick={startRecording}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;
