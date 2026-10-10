import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  expires_at: string;
  created_at: string;
};

export function ProfileStories({ userId, isOwner, avatarUrl }: { userId: string; isOwner: boolean; avatarUrl?: string | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [viewIdx, setViewIdx] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['profile-stories', userId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('profile_stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Story[];
    },
  });

  const stories = data ?? [];
  const hasStories = stories.length > 0;

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const path = `${userId}/stories/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('posts').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
      const { error } = await (supabase.from as any)('profile_stories').insert({
        user_id: userId,
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['profile-stories', userId] });
      toast({ title: 'Story imechapishwa!' });
    } catch (err: any) {
      toast({ title: 'Hitilafu', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('profile_stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-stories', userId] }),
  });

  if (!hasStories && !isOwner) return null;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => hasStories && setViewIdx(0)}
            className={`relative rounded-full p-[3px] ${hasStories ? 'bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-400' : 'bg-muted'}`}
            aria-label="View stories"
          >
            <div className="rounded-full bg-background p-[2px]">
              <div
                className="h-14 w-14 rounded-full bg-muted bg-cover bg-center"
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              />
            </div>
          </button>
          {isOwner && (
            <label className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow cursor-pointer">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} disabled={uploading} />
            </label>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {hasStories ? `${stories.length} story${stories.length > 1 ? '' : ''} hai` : 'Hakuna story bado'}
        </div>
      </div>

      {viewIdx !== null && stories[viewIdx] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setViewIdx(null)}>
          <div className="relative max-h-full max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {stories[viewIdx].media_type === 'video' ? (
              <video src={stories[viewIdx].media_url} controls autoPlay className="w-full max-h-screen" />
            ) : (
              <img src={stories[viewIdx].media_url} alt="" className="w-full max-h-screen object-contain" />
            )}
            <div className="absolute top-2 left-2 right-2 flex gap-1">
              {stories.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded ${i <= viewIdx ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <div className="absolute bottom-4 inset-x-4 flex justify-between text-white text-sm">
              <button onClick={() => setViewIdx((i) => (i! > 0 ? i! - 1 : i))} className="px-3 py-1 bg-black/50 rounded">←</button>
              {isOwner && (
                <button onClick={() => { del.mutate(stories[viewIdx].id); setViewIdx(null); }} className="px-3 py-1 bg-red-600/80 rounded">Futa</button>
              )}
              <button onClick={() => setViewIdx((i) => (i! < stories.length - 1 ? i! + 1 : null))} className="px-3 py-1 bg-black/50 rounded">→</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
