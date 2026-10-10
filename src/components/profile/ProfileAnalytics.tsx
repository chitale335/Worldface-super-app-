import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Eye, Heart, MessageCircle, Share2, Music, Image as ImageIcon,
  Film, TrendingUp, Users, Sparkles, Loader2, Trophy, Coins,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileAnalyticsProps {
  userId: string;
}

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const ProfileAnalytics = ({ userId }: ProfileAnalyticsProps) => {
  const { toast } = useToast();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile-analytics', userId],
    queryFn: async () => {
      const [posts, stories, gallery, song, followers, following, stats] = await Promise.all([
        supabase.from('posts').select('id, view_count, like_count, comment_count, share_count, is_trending, media_type, created_at').eq('user_id', userId),
        supabase.from('profile_stories').select('id, created_at, expires_at').eq('user_id', userId),
        supabase.from('profile_gallery').select('id, media_type').eq('user_id', userId),
        (supabase.from as any)('profile_featured_song').select('title, artist').eq('user_id', userId).maybeSingle(),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('creator_stats').select('xp, level, total_likes_received, total_coins_received').eq('user_id', userId).maybeSingle(),
      ]);
      const p = posts.data || [];
      const now = Date.now();
      const activeStories = (stories.data || []).filter((s: any) => new Date(s.expires_at).getTime() > now).length;
      const media = p.filter((x: any) => x.media_type && x.media_type !== 'text');
      const videos = p.filter((x: any) => x.media_type === 'video').length;
      const images = p.filter((x: any) => x.media_type === 'image').length;
      const totals = p.reduce((acc: any, x: any) => ({
        views: acc.views + (x.view_count || 0),
        likes: acc.likes + (x.like_count || 0),
        comments: acc.comments + (x.comment_count || 0),
        shares: acc.shares + (x.share_count || 0),
      }), { views: 0, likes: 0, comments: 0, shares: 0 });
      const trendingCount = p.filter((x: any) => x.is_trending).length;
      const engagement = totals.views > 0
        ? Math.round(((totals.likes + totals.comments + totals.shares) / totals.views) * 1000) / 10
        : 0;
      const top = [...p].sort((a: any, b: any) =>
        ((b.like_count || 0) + (b.view_count || 0)) - ((a.like_count || 0) + (a.view_count || 0))
      ).slice(0, 3);
      return {
        postCount: p.length,
        mediaCount: media.length,
        videos, images,
        storiesTotal: stories.data?.length || 0,
        storiesActive: activeStories,
        galleryCount: gallery.data?.length || 0,
        song: song.data,
        followers: followers.count || 0,
        following: following.count || 0,
        totals,
        trendingCount,
        engagement,
        top,
        stats: stats.data,
      };
    },
  });

  const runAI = async () => {
    if (!data) return;
    setAiOpen(true);
    setAiLoading(true);
    setAiText('');
    try {
      const summary = `Profile stats:
- Posts: ${data.postCount} (Videos: ${data.videos}, Images: ${data.images})
- Total views: ${data.totals.views}, likes: ${data.totals.likes}, comments: ${data.totals.comments}, shares: ${data.totals.shares}
- Engagement rate: ${data.engagement}%
- Trending posts: ${data.trendingCount}
- Followers: ${data.followers}, Following: ${data.following}
- Stories active: ${data.storiesActive}/${data.storiesTotal}
- Gallery items: ${data.galleryCount}
- Featured song: ${data.song ? `${data.song.title} - ${data.song.artist}` : 'none'}
- Creator level: ${data.stats?.level || 1}, XP: ${data.stats?.xp || 0}`;

      const resp = await fetch(`${FN_BASE}/worldface-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Profile AI Coach for WorldFace. Respond in Swahili. Give 3-5 short, actionable bullets to grow the creator profile based on the stats. Be specific and encouraging.' },
            { role: 'user', content: summary },
          ],
        }),
      });
      if (!resp.ok || !resp.body) throw new Error('AI request failed');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) setAiText((t) => t + delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast({ title: 'Hitilafu', description: e.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Card className="glass-elevated">
        <CardContent className="p-4 flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const stat = (icon: React.ReactNode, label: string, value: string | number, sub?: string) => (
    <div className="p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
        {icon}<span>{label}</span>
      </div>
      <p className="text-xl font-heading font-bold mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <Card className="glass-elevated">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider">Analytics</h3>
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs gap-1" onClick={runAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Profile AI
          </Button>
        </div>

        {/* Reach */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stat(<Eye className="h-3 w-3" />, 'Views', data.totals.views.toLocaleString())}
          {stat(<Heart className="h-3 w-3" />, 'Likes', data.totals.likes.toLocaleString())}
          {stat(<MessageCircle className="h-3 w-3" />, 'Comments', data.totals.comments.toLocaleString())}
          {stat(<Share2 className="h-3 w-3" />, 'Shares', data.totals.shares.toLocaleString())}
        </div>

        {/* Media / Story / Song */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Media · Story · Song</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stat(<ImageIcon className="h-3 w-3" />, 'Media', data.mediaCount, `${data.images} img · ${data.videos} vid`)}
            {stat(<Film className="h-3 w-3" />, 'Stories', data.storiesActive, `${data.storiesTotal} zote`)}
            {stat(<ImageIcon className="h-3 w-3" />, 'Gallery', data.galleryCount, 'picha zilizohifadhiwa')}
            {stat(<Music className="h-3 w-3" />, 'Featured Song', data.song ? '1' : '0', data.song?.title || 'hakuna')}
          </div>
        </div>

        {/* Community + trending */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stat(<Users className="h-3 w-3" />, 'Followers', data.followers)}
          {stat(<Users className="h-3 w-3" />, 'Following', data.following)}
          {stat(<TrendingUp className="h-3 w-3" />, 'Trending', data.trendingCount, `${data.engagement}% engagement`)}
          {stat(<Trophy className="h-3 w-3" />, `Level ${data.stats?.level || 1}`, `${data.stats?.xp || 0} XP`, `${data.stats?.total_coins_received || 0} coins`)}
        </div>

        {/* Top posts */}
        {data.top.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Posts</p>
            <div className="space-y-1">
              {data.top.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-2 text-xs p-2 rounded bg-card/50 border border-border/50">
                  <span className="font-heading font-bold text-primary w-4">#{i + 1}</span>
                  <span className="flex-1 truncate text-muted-foreground">{p.media_type || 'text'} · {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.view_count || 0}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.like_count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aiOpen && (
          <div className="p-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-violet-500/5 to-blue-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold">Profile AI Coach</p>
              {aiLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
            </div>
            <div className="text-xs whitespace-pre-wrap leading-relaxed">
              {aiText || (aiLoading ? 'Inachambua...' : '')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
