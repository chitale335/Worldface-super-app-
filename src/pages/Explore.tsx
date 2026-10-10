import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Search, Flame, Hash, Loader2, Play } from 'lucide-react';
import { formatCount } from '@/lib/feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Explore = () => {
  const [q, setQ] = useState('');

  const { data: trendingPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['explore-trending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, user_id, type, caption, media_url, thumbnail_url, like_count, view_count')
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const { data: trendingTags } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hashtags')
        .select('id, tag, use_count')
        .order('use_count', { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      if (!q.trim()) return { users: [], tags: [] };
      const term = q.trim().replace(/^[@#]/g, '');
      const pattern = `%${term}%`;
      const [users, tags] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, bio, instagram_url, twitter_url, tiktok_url, telegram_url')
          .or(`display_name.ilike.${pattern},username.ilike.${pattern},instagram_url.ilike.${pattern},twitter_url.ilike.${pattern},tiktok_url.ilike.${pattern},telegram_url.ilike.${pattern}`)
          .limit(12),
        supabase.from('hashtags').select('id, tag, use_count').ilike('tag', `%${term.toLowerCase()}%`).limit(8),
      ]);
      return { users: users.data ?? [], tags: tags.data ?? [] };
    },
    enabled: q.trim().length > 0,
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Hero gradient header */}
        <div className="rounded-2xl p-6 gradient-primary text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <h1 className="font-heading text-2xl font-bold relative">Explore WorldFace</h1>
          <p className="text-sm text-white/70 mt-1 relative">Discover creators, trending content & hashtags</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people by name, @username, or social handle..."
            className="pl-9"
          />
        </div>

        {q.trim() && searchResults && (
          <div className="space-y-4">
            {searchResults.users.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">People</h3>
                <div className="space-y-2">
                  {searchResults.users.map((u) => {
                    const initials = u.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                    const socialHandle = u.instagram_url || u.twitter_url || u.tiktok_url || u.telegram_url;
                    return (
                      <Link
                        key={u.user_id}
                        to={`/u/${u.user_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{u.display_name}</p>
                          <div className="flex items-center gap-2">
                            {u.username && (
                              <span className="text-xs text-primary font-medium">@{u.username}</span>
                            )}
                            {socialHandle && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{socialHandle}</span>
                            )}
                          </div>
                          {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {searchResults.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {searchResults.tags.map((t) => (
                    <Link
                      key={t.id}
                      to={`/tag/${t.tag}`}
                      className="bg-muted hover:bg-muted/70 px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3" /> {t.tag}{' '}
                      <span className="text-xs text-muted-foreground">{formatCount(t.use_count)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {searchResults.users.length === 0 && searchResults.tags.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No results</p>
            )}
          </div>
        )}

        {!q.trim() && (
          <>
            {/* Trending hashtags */}
            <section>
              <h2 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" /> Trending hashtags
              </h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                {trendingTags && trendingTags.length > 0 ? (
                  trendingTags.map((t, i) => {
                    const colors = [
                      'from-primary to-violet',
                      'from-rose to-amber',
                      'from-cyan to-primary',
                      'from-emerald to-cyan',
                      'from-violet to-rose',
                    ];
                    return (
                      <Link
                        key={t.id}
                        to={`/tag/${t.tag}`}
                        className={`shrink-0 bg-gradient-to-br ${colors[i % colors.length]} text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow`}
                      >
                        <p className="font-semibold flex items-center gap-1">
                          <Hash className="h-3 w-3" /> {t.tag}
                        </p>
                        <p className="text-xs text-white/80">{formatCount(t.use_count)} posts</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No trending tags yet</p>
                )}
              </div>
            </section>

            {/* Trending posts grid */}
            <section>
              <h2 className="font-heading text-lg font-bold mb-3">Popular posts</h2>
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : trendingPosts && trendingPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {trendingPosts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/?tab=foryou`}
                      className="relative aspect-[9/16] bg-muted rounded overflow-hidden group"
                    >
                      {p.type === 'video' && p.media_url ? (
                        <video src={p.media_url} className="w-full h-full object-cover" muted playsInline />
                      ) : p.type === 'image' && p.media_url ? (
                        <img src={p.media_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 p-2">
                          <p className="text-xs font-semibold line-clamp-6 text-center">{p.caption}</p>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow">
                        <Play className="h-3 w-3 fill-white" /> {formatCount(p.like_count)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No posts yet</p>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
