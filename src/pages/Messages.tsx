import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle, Loader2, Search, Pencil, Pin, PinOff, Star, MoreVertical, X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { cacheConversations, getCachedConversations, isOnline } from '@/lib/offlineChat';

type ConvRow = {
  id: string;
  updated_at: string;
  is_pinned: boolean;
  is_important: boolean;
  last_read_at: string;
  otherProfile: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    account_number?: string | null;
  } | null;
  lastMessage: { content: string | null; created_at: string; sender_id: string; media_type: string | null } | null;
  unreadCount: number;
  matchedMessage?: { content: string; created_at: string } | null;
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const { data: conversations, isLoading } = useQuery<ConvRow[]>({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      // Read the inbox from the offline snapshot when there's no connection.
      if (!isOnline()) return await getCachedConversations<ConvRow>();
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at, is_pinned, is_important')
        .eq('user_id', user!.id);
      if (!parts?.length) return [];
      const convIds = parts.map((p) => p.conversation_id);
      const meta = new Map(parts.map((p) => [p.conversation_id, p]));

      const { data: convs } = await supabase
        .from('conversations').select('*').in('id', convIds)
        .order('updated_at', { ascending: false });

      const { data: others } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds)
        .neq('user_id', user!.id);

      const otherIds = [...new Set(others?.map((p) => p.user_id) ?? [])];
      const [{ data: profiles }, { data: wallets }] = await Promise.all([
        otherIds.length
          ? supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', otherIds)
          : Promise.resolve({ data: [] as any[] }),
        otherIds.length
          ? supabase.from('wallet_accounts').select('user_id, account_number').in('user_id', otherIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const walletMap = new Map((wallets ?? []).map((w: any) => [w.user_id, w.account_number]));
      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, { ...p, account_number: walletMap.get(p.user_id) ?? null }])
      );

      const results = await Promise.all((convs ?? []).map(async (conv) => {
        const m = meta.get(conv.id)!;
        const otherPart = others?.find((p) => p.conversation_id === conv.id);
        const otherProfile = otherPart ? (profileMap.get(otherPart.user_id) ?? null) : null;

        const [{ data: lastMsg }, { count: unread }] = await Promise.all([
          supabase.from('messages')
            .select('content, created_at, sender_id, media_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user!.id)
            .gt('created_at', m.last_read_at),
        ]);

        return {
          id: conv.id,
          updated_at: conv.updated_at,
          is_pinned: m.is_pinned,
          is_important: m.is_important,
          last_read_at: m.last_read_at,
          otherProfile,
          lastMessage: lastMsg ?? null,
          unreadCount: unread ?? 0,
        } as ConvRow;
      }));

      results.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      // Keep an offline snapshot of the inbox for the next time we lose signal.
      await cacheConversations(results);
      return results;
    },
    enabled: !!user,
  });

  // Realtime: refresh inbox on any new message / participant change
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`inbox-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        () => queryClient.invalidateQueries({ queryKey: ['conversations', user.id] }))
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['conversations', user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, queryClient]);

  // Message search across conversations (only when there's a query)
  const { data: messageHits } = useQuery({
    queryKey: ['message-search', user?.id, search],
    queryFn: async () => {
      const q = search.trim();
      if (!q || !conversations?.length) return [] as Array<{ conversation_id: string; content: string; created_at: string }>;
      const ids = conversations.map((c) => c.id);
      const { data } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', ids)
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user && search.trim().length > 0 && !!conversations?.length,
  });

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    const hitMap = new Map<string, { content: string; created_at: string }>();
    messageHits?.forEach((h) => {
      if (!hitMap.has(h.conversation_id)) hitMap.set(h.conversation_id, { content: h.content ?? '', created_at: h.created_at });
    });
    return conversations
      .filter((c) =>
        c.otherProfile?.display_name?.toLowerCase().includes(q) ||
        (c.otherProfile as any)?.account_number?.toLowerCase().includes(q) ||
        hitMap.has(c.id)
      )
      .map((c) => ({ ...c, matchedMessage: hitMap.get(c.id) ?? null }));
  }, [conversations, search, messageHits]);

  // People search for "New message" dialog
  const { data: people, isFetching: peopleLoading } = useQuery({
    queryKey: ['people-search', userSearch, user?.id],
    queryFn: async () => {
      const q = userSearch.trim();
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .neq('user_id', user!.id)
        .limit(20);
      if (q) query = query.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
    enabled: newOpen && !!user,
  });

  const startConv = useMutation({
    mutationFn: async (otherId: string) => {
      const { data, error } = await supabase.rpc('start_direct_conversation', { other_user_id: otherId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (convId) => {
      setNewOpen(false);
      setUserSearch('');
      navigate(`/messages/${convId}`);
    },
    onError: (e: Error) => toast({ title: 'Could not start chat', description: e.message, variant: 'destructive' }),
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ convId, field, value }: { convId: string; field: 'is_pinned' | 'is_important'; value: boolean }) => {
      const patch = field === 'is_pinned' ? { is_pinned: value } : { is_important: value };
      const { error } = await supabase
        .from('conversation_participants')
        .update(patch)
        .eq('conversation_id', convId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] }),
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-heading font-bold">Messages</h1>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Pencil className="h-4 w-4" />New</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search people by name or username…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1 mt-2">
                {peopleLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : !people?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No people found.</p>
                ) : people.map((p: any) => {
                  const initials = p.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';
                  return (
                    <button
                      key={p.user_id}
                      onClick={() => startConv.mutate(p.user_id)}
                      disabled={startConv.isPending}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.display_name || 'User'}</p>
                        {p.username && <p className="text-xs text-muted-foreground truncate">@{p.username}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations and messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !filtered.length ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No matches.' : 'No conversations yet.'}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setNewOpen(true)}>
                  Start a new chat
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => {
              const profile = conv.otherProfile;
              const initials = profile?.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';
              const preview = conv.matchedMessage?.content
                ?? (conv.lastMessage?.content
                  ?? (conv.lastMessage?.media_type === 'image' ? '📷 Photo' : conv.lastMessage?.media_type === 'audio' ? '🎤 Voice note' : ''));
              const isUnread = conv.unreadCount > 0;
              return (
                <Card
                  key={conv.id}
                  className={cn(
                    'glass-card hover:shadow-elevated transition-shadow cursor-pointer animate-fade-in',
                    isUnread && 'ring-1 ring-primary/30'
                  )}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-heading">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {conv.is_pinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
                        {conv.is_important && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                        <h3 className={cn('font-semibold text-foreground truncate', isUnread && 'font-bold')}>
                          {profile?.display_name || 'Unknown'}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                            {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        'text-sm truncate mt-0.5',
                        isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {preview
                          ? `${conv.lastMessage && !conv.matchedMessage && conv.lastMessage.sender_id === user!.id ? 'You: ' : ''}${preview}`
                          : 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isUnread && (
                        <Badge className="rounded-full px-2 min-w-[20px] h-5 justify-center">{conv.unreadCount}</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlag.mutate({ convId: conv.id, field: 'is_pinned', value: !conv.is_pinned });
                            }}
                          >
                            {conv.is_pinned ? <><PinOff className="h-4 w-4 mr-2" />Unpin</> : <><Pin className="h-4 w-4 mr-2" />Pin to top</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlag.mutate({ convId: conv.id, field: 'is_important', value: !conv.is_important });
                            }}
                          >
                            <Star className={cn('h-4 w-4 mr-2', conv.is_important && 'fill-yellow-500 text-yellow-500')} />
                            {conv.is_important ? 'Unmark important' : 'Mark important'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
