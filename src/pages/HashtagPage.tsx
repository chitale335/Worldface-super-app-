import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Hash, Loader2, Play } from 'lucide-react';
import { formatCount } from '@/lib/feed';

const HashtagPage = () => {
  const { tag = '' } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['hashtag', tag],
    queryFn: async () => {
      const { data: hashtag } = await supabase
        .from('hashtags')
        .select('id, tag, use_count')
        .eq('tag', tag.toLowerCase())
        .maybeSingle();
      if (!hashtag) return { hashtag: null, posts: [] };
      const { data: links } = await supabase
        .from('post_hashtags')
        .select('post_id')
        .eq('hashtag_id', hashtag.id);
      const ids = (links ?? []).map((l) => l.post_id);
      if (ids.length === 0) return { hashtag, posts: [] };
      const { data: posts } = await supabase
        .from('posts')
        .select('id, type, caption, media_url, like_count')
        .in('id', ids)
        .order('like_count', { ascending: false });
      return { hashtag, posts: posts ?? [] };
    },
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent rounded-full p-3">
            <Hash className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">#{tag}</h1>
            <p className="text-sm text-muted-foreground">
              {formatCount(data?.hashtag?.use_count ?? 0)} posts
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data && data.posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {data.posts.map((p) => (
              <Link key={p.id} to="/" className="relative aspect-[9/16] bg-muted rounded overflow-hidden">
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
          <p className="text-center text-muted-foreground py-12">No posts with this tag yet</p>
        )}
      </div>
    </AppLayout>
  );
};

export default HashtagPage;
