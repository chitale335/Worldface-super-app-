import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, CornerDownRight, Loader2, Check } from 'lucide-react';
import { timeAgo } from '@/lib/feed';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'comment_reply' | 'follow';
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: { display_name: string | null; avatar_url: string | null } | null;
  post?: { type: string; media_url: string | null; caption: string | null } | null;
};

const typeMeta = {
  like: { icon: Heart, color: 'text-red-500', text: 'liked your post' },
  comment: { icon: MessageCircle, color: 'text-primary', text: 'commented on your post' },
  comment_reply: { icon: CornerDownRight, color: 'text-primary', text: 'replied to your comment' },
  follow: { icon: UserPlus, color: 'text-success', text: 'started following you' },
} as const;

const Notifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifs, isLoading } = useQuery({
    queryKey: ['notifications-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id, actor_id, type, post_id, comment_id, read_at, created_at')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      const list = data ?? [];
      const actorIds = Array.from(new Set(list.map((n) => n.actor_id)));
      const postIds = Array.from(new Set(list.map((n) => n.post_id).filter(Boolean) as string[]));
      const [profiles, posts] = await Promise.all([
        actorIds.length
          ? supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', actorIds)
          : Promise.resolve({ data: [] as any[] }),
        postIds.length
          ? supabase.from('posts').select('id, type, media_url, caption').in('id', postIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const profMap = new Map((profiles.data ?? []).map((p) => [p.user_id, p]));
      const postMap = new Map((posts.data ?? []).map((p) => [p.id, p]));
      return list.map((n) => ({
        ...n,
        actor: profMap.get(n.actor_id) ?? null,
        post: n.post_id ? postMap.get(n.post_id) ?? null : null,
      })) as Notification[];
    },
    enabled: !!user,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user?.id] });
    },
  });

  // Auto-mark all read when page is opened
  useEffect(() => {
    if (notifs && notifs.some((n) => !n.read_at)) {
      markAllRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifs?.length]);

  const linkFor = (n: Notification): string => {
    if (n.type === 'follow') return `/u/${n.actor_id}`;
    return '/';
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          {notifs && notifs.some((n) => !n.read_at) && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifs && notifs.length > 0 ? (
          <ul className="divide-y divide-border">
            {notifs.map((n) => {
              const meta = typeMeta[n.type];
              const Icon = meta.icon;
              const initials =
                n.actor?.display_name?.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?';
              return (
                <li key={n.id}>
                  <Link
                    to={linkFor(n)}
                    className={cn(
                      'flex items-center gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted',
                      !n.read_at && 'bg-primary/5',
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={n.actor?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full p-1">
                        <Icon className={cn('h-3.5 w-3.5', meta.color, n.type === 'like' && 'fill-red-500')} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{n.actor?.display_name ?? 'Someone'}</span>{' '}
                        <span className="text-muted-foreground">{meta.text}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    {n.post && (
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                        {n.post.type === 'video' && n.post.media_url ? (
                          <video src={n.post.media_url} className="w-full h-full object-cover" muted playsInline />
                        ) : n.post.type === 'image' && n.post.media_url ? (
                          <img src={n.post.media_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 p-1">
                            <p className="text-[8px] line-clamp-4">{n.post.caption}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-16 space-y-2">
            <div className="inline-flex bg-muted rounded-full p-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold">No notifications yet</p>
            <p className="text-sm text-muted-foreground">When people interact with you, you'll see it here.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
