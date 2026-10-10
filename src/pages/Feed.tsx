import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { PostCard, type FeedPost } from '@/components/feed/PostCard';
import { Loader2, Plus, Sparkles, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type FeedTab = 'foryou' | 'following' | 'trending';

const Feed = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as FeedTab) || 'foryou';
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed', tab, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('id, user_id, type, caption, media_url, thumbnail_url, like_count, comment_count, share_count, created_at')
        .limit(50);

      if (tab === 'trending') {
        query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
      } else if (tab === 'following' && user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const ids = (follows ?? []).map((f) => f.following_id);
        if (ids.length === 0) return [] as FeedPost[];
        query = query.in('user_id', ids).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data } = await query;
      const list = data ?? [];
      const userIds = Array.from(new Set(list.map((p) => p.user_id)));
      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        profilesMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      }
      return list.map((p) => ({ ...p, profile: profilesMap.get(p.user_id) ?? null })) as FeedPost[];
    },
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [posts]);

  const tabs: { id: FeedTab; label: string; icon: typeof Flame }[] = [
    { id: 'following', label: 'Following', icon: Users },
    { id: 'foryou', label: 'For You', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: Flame },
  ];

  return (
    <AppLayout>
      <div className="relative h-[100dvh] lg:h-screen w-full bg-black -mt-0">
        {/* Top tabs */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex gap-6">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSearchParams({ tab: t.id })}
                  className={cn(
                    'text-sm font-heading font-semibold transition-all relative',
                    active ? 'text-white' : 'text-white/60',
                  )}
                >
                  {t.label}
                  {active && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create button (mobile) */}
        <Link
          to="/create"
          className="absolute top-4 right-4 z-30 lg:hidden bg-white text-black rounded-full p-2 shadow-lg"
          aria-label="Create post"
        >
          <Plus className="h-5 w-5" />
        </Link>

        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} isActive={i === activeIndex} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white px-6 text-center gap-4">
            <div className="bg-white/10 rounded-full p-6">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="font-heading text-2xl font-bold">
              {tab === 'following' ? 'No posts from people you follow' : 'No posts yet'}
            </h2>
            <p className="text-white/70 max-w-sm">
              {tab === 'following'
                ? 'Follow creators to see their posts here.'
                : 'Be the first to share something with the WorldFace community.'}
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link to="/create">
                <Plus className="h-4 w-4 mr-2" /> Create your first post
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Feed;
