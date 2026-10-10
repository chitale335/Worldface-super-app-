import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type GalleryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  position: number;
};

export function ProfileGallery({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<GalleryItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['profile-gallery', userId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('profile_gallery')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GalleryItem[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('profile_gallery').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-gallery', userId] }),
  });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const path = `${userId}/gallery/${Date.now()}-${file.name}`;
      const bucket = isVideo ? 'posts' : 'posts';
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      const { error } = await (supabase.from as any)('profile_gallery').insert({
        user_id: userId,
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['profile-gallery', userId] });
      toast({ title: 'Imeongezwa kwenye gallery' });
    } catch (err: any) {
      toast({ title: 'Hitilafu', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const items = data ?? [];
  if (!isOwner && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Gallery</h3>
        {isOwner && (
          <label className="cursor-pointer">
            <Button asChild size="sm" variant="outline" disabled={uploading}>
              <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Ongeza</>}</span>
            </Button>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Gallery ni tupu bado.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {items.map((it) => (
            <div key={it.id} className="relative aspect-square bg-muted rounded overflow-hidden group">
              <button className="w-full h-full" onClick={() => setViewer(it)}>
                {it.media_type === 'video' ? (
                  <video src={it.media_url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={it.media_url} alt={it.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
                )}
              </button>
              {isOwner && (
                <button
                  onClick={() => del.mutate(it.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition"
                  aria-label="Futa"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewer(null)}>
          {viewer.media_type === 'video' ? (
            <video src={viewer.media_url} controls autoPlay className="max-h-full max-w-full" />
          ) : (
            <img src={viewer.media_url} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
