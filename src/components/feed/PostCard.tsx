import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, Play, Volume2, VolumeX, Gift as GiftIcon, Languages, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCount, renderCaption, timeAgo } from '@/lib/feed';
import { useToggleLike, useToggleBookmark, useSharePost, useToggleFollow } from '@/hooks/usePostActions';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { GiftPicker, GIFTS, type Gift } from '@/components/feed/GiftPicker';
import { GiftAnimation } from '@/components/feed/GiftAnimation';
import { cn } from '@/lib/utils';
import { useAudioEnhance } from '@/hooks/useAudioEnhance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ReportDialog } from '@/components/ReportDialog';
import { Flag } from 'lucide-react';

export type FeedPost = {
  id: string;
  user_id: string;
  type: 'video' | 'image' | 'text';
  caption: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface PostCardProps {
  post: FeedPost;
  isActive: boolean;
}

export const PostCard = ({ post, isActive }: PostCardProps) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [burst, setBurst] = useState<{ emoji: string; id: number } | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!post.caption) return;
    if (translated) { setTranslated(null); return; }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: post.caption, target: lang },
      });
      if (error) throw error;
      setTranslated((data as { translated?: string })?.translated ?? null);
    } catch (e: unknown) {
      toast({ title: 'Translation failed', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  // Realtime: animate when ANY viewer gifts this post
  useEffect(() => {
    const channel = supabase
      .channel(`post-gifts-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const tx = payload.new as { amount: number; note: string | null };
          // Pick emoji by matching cost, fall back to heart
          const match = GIFTS.find((g) => g.cost === Number(tx.amount));
          const emoji =
            match?.emoji ?? tx.note?.match(/[\p{Emoji}]/u)?.[0] ?? '💖';
          setBurst({ emoji, id: Date.now() });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const { data: liked } = useQuery({
    queryKey: ['post-likes', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: bookmarked } = useQuery({
    queryKey: ['bookmarks', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('post_bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: following } = useQuery({
    queryKey: ['follows', post.user_id, user?.id],
    queryFn: async () => {
      if (!user || user.id === post.user_id) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && user.id !== post.user_id,
  });

  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const sharePost = useSharePost();
  const toggleFollow = useToggleFollow();

  useAudioEnhance(videoRef, post.type === 'video');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive && !paused) {
      v.volume = 1.0;
      v.play().catch(() => undefined);
    } else {
      v.pause();
    }
  }, [isActive, paused]);

  const initials =
    post.profile?.display_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const isOwnPost = user?.id === post.user_id;

  return (
    <article className="relative h-[100dvh] w-full snap-start snap-always bg-black overflow-hidden">
      {/* Media */}
      {post.type === 'video' && post.media_url ? (
        <video
          ref={videoRef}
          src={post.media_url}
          poster={post.thumbnail_url ?? undefined}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={muted}
          onClick={() => setPaused((p) => !p)}
        />
      ) : post.type === 'image' && post.media_url ? (
        <img src={post.media_url} alt={post.caption ?? 'post'} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-background to-accent/30 p-8 gap-4">
          <p className="text-2xl md:text-4xl font-heading font-bold text-foreground text-center max-w-2xl leading-tight">
            {translated ?? post.caption}
          </p>
          {post.caption && (
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
            >
              {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
              {translating ? t('common.translating') : translated ? t('common.showOriginal') : t('common.translate')}
            </button>
          )}
        </div>
      )}

      {/* Dim overlay for video/image readability */}
      {post.type !== 'text' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
      )}

      {/* Pause indicator */}
      {post.type === 'video' && paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-6">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Mute toggle */}
      {post.type === 'video' && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm rounded-full p-2 text-white"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 lg:bottom-8 flex flex-col items-center gap-5 z-10">
        <Link to={`/u/${post.user_id}`} className="relative">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarImage src={post.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          {!isOwnPost && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFollow.mutate({ targetUserId: post.user_id, following: !!following });
              }}
              className={cn(
                'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full w-6 h-6 flex items-center justify-center text-white text-lg font-bold border-2 border-white',
                following ? 'bg-muted text-foreground' : 'bg-primary',
              )}
              aria-label={following ? 'Unfollow' : 'Follow'}
            >
              {following ? '✓' : '+'}
            </button>
          )}
        </Link>

        <button
          onClick={() => toggleLike.mutate({ postId: post.id, liked: !!liked })}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Like"
        >
          <Heart className={cn('h-9 w-9 drop-shadow', liked && 'fill-red-500 text-red-500')} />
          <span className="text-xs font-semibold">{formatCount(post.like_count)}</span>
        </button>

        <button
          onClick={() => setCommentsOpen(true)}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Comments"
        >
          <MessageCircle className="h-9 w-9 drop-shadow" />
          <span className="text-xs font-semibold">{formatCount(post.comment_count)}</span>
        </button>

        <button
          onClick={() => toggleBookmark.mutate({ postId: post.id, bookmarked: !!bookmarked })}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Save"
        >
          <Bookmark className={cn('h-9 w-9 drop-shadow', bookmarked && 'fill-white')} />
          <span className="text-xs font-semibold">Save</span>
        </button>

        <button
          onClick={() => sharePost.mutate({ postId: post.id })}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Share"
        >
          <Share2 className="h-9 w-9 drop-shadow" />
          <span className="text-xs font-semibold">{formatCount(post.share_count)}</span>
        </button>

        {!isOwnPost && (
          <button
            onClick={() => setGiftOpen(true)}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Send gift"
          >
            <span className="relative">
              <GiftIcon className="h-9 w-9 drop-shadow" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
            </span>
            <span className="text-xs font-semibold">Gift</span>
          </button>
        )}

        {!isOwnPost && (
          <ReportDialog
            targetType="post"
            targetId={post.id}
            trigger={
              <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white" aria-label="Report post">
                <Flag className="h-7 w-7 drop-shadow" />
                <span className="text-xs font-semibold">Report</span>
              </button>
            }
          />
        )}
      </div>

      {/* Bottom info */}
      {post.type !== 'text' && (
        <div className="absolute left-0 right-20 bottom-24 lg:bottom-8 px-4 z-10 text-white">
          <Link to={`/u/${post.user_id}`} className="font-heading font-bold text-lg drop-shadow">
            @{post.profile?.display_name?.replace(/\s+/g, '').toLowerCase() || 'user'}
          </Link>
          <p className="text-xs opacity-80 mb-2">{timeAgo(post.created_at)}</p>
          {post.caption && (
            <>
              <p className="text-sm leading-snug drop-shadow line-clamp-3">
                {translated
                  ? translated
                  : renderCaption(post.caption).map((part, i) =>
                      part.type === 'tag' ? (
                        <Link key={i} to={`/tag/${part.value}`} className="text-primary-foreground font-semibold">
                          #{part.value}
                        </Link>
                      ) : (
                        <span key={i}>{part.value}</span>
                      ),
                    )}
              </p>
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium opacity-90 hover:opacity-100"
              >
                {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                {translating ? t('common.translating') : translated ? t('common.showOriginal') : t('common.translate')}
              </button>
            </>
          )}
        </div>
      )}

      <CommentsSheet postId={post.id} open={commentsOpen} onOpenChange={setCommentsOpen} />
      <GiftPicker
        postId={post.id}
        creatorName={post.profile?.display_name ?? 'creator'}
        creatorId={post.user_id}
        open={giftOpen}
        onOpenChange={setGiftOpen}
        onGiftSent={(g: Gift) => setBurst({ emoji: g.emoji, id: Date.now() })}
      />
      <GiftAnimation emoji={burst?.emoji ?? null} burstId={burst?.id ?? 0} />
    </article>
  );
};
