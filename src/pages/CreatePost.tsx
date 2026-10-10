import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Video as VideoIcon, Type, Loader2, X, Upload } from 'lucide-react';
import { extractHashtags } from '@/lib/feed';
import { cn } from '@/lib/utils';

const captionSchema = z
  .string()
  .trim()
  .max(2200, { message: 'Caption must be under 2200 characters' });

type PostType = 'video' | 'image' | 'text';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [type, setType] = useState<PostType>('text');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined | null, t: 'video' | 'image') => {
    if (!f) return;
    const maxSize = t === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (f.size > maxSize) {
      toast({
        title: 'File too large',
        description: `${t === 'video' ? 'Videos' : 'Images'} must be under ${t === 'video' ? '100MB' : '10MB'}`,
        variant: 'destructive',
      });
      return;
    }
    setFile(f);
    setType(t);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearMedia = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setType('text');
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const parsed = captionSchema.safeParse(caption);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      let mediaUrl: string | null = null;
      if ((type === 'video' || type === 'image') && file) {
        const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
        const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('posts').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('posts').getPublicUrl(path);
        mediaUrl = data.publicUrl;
      }

      if (type === 'text' && !parsed.data.trim()) {
        throw new Error('Write something to post');
      }

      const { data: postData, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type,
          caption: parsed.data || null,
          media_url: mediaUrl,
        })
        .select('id')
        .single();
      if (error) throw error;

      const tags = extractHashtags(parsed.data);
      if (tags.length > 0 && postData) {
        for (const tag of tags) {
          const { data: existing } = await supabase
            .from('hashtags')
            .select('id, use_count')
            .eq('tag', tag)
            .maybeSingle();
          let hashtagId = existing?.id;
          if (!hashtagId) {
            const { data: ins } = await supabase
              .from('hashtags')
              .insert({ tag, use_count: 1 })
              .select('id')
              .single();
            hashtagId = ins?.id;
          } else {
            await supabase
              .from('hashtags')
              .update({ use_count: (existing!.use_count ?? 0) + 1 })
              .eq('id', hashtagId);
          }
          if (hashtagId) {
            await supabase.from('post_hashtags').insert({ post_id: postData.id, hashtag_id: hashtagId });
          }
        }
      }

      return postData?.id;
    },
    onSuccess: () => {
      toast({ title: 'Post published!' });
      navigate('/');
    },
    onError: (e: Error) =>
      toast({ title: 'Could not publish', description: e.message, variant: 'destructive' }),
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Create post</h1>
          <Button
            onClick={() => createPost.mutate()}
            disabled={createPost.isPending || (type === 'text' && !caption.trim()) || ((type === 'video' || type === 'image') && !file)}
          >
            {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </div>

        {/* Type switcher */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'text', label: 'Text', icon: Type },
            { id: 'image', label: 'Photo', icon: ImageIcon },
            { id: 'video', label: 'Video', icon: VideoIcon },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'text') clearMedia();
                else {
                  setType(id);
                  fileInput.current?.click();
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-colors',
                type === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <input
          ref={fileInput}
          type="file"
          className="hidden"
          accept={type === 'video' ? 'video/*' : 'image/*'}
          onChange={(e) => handleFile(e.target.files?.[0], type === 'video' ? 'video' : 'image')}
        />

        {/* Media preview */}
        {previewUrl && (
          <Card className="overflow-hidden relative">
            <button
              onClick={clearMedia}
              className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1.5"
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
            {type === 'video' ? (
              <video src={previewUrl} className="w-full max-h-[60vh] bg-black" controls />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full max-h-[60vh] object-contain bg-black" />
            )}
          </Card>
        )}

        {!previewUrl && type !== 'text' && (
          <Card
            className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInput.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Upload className="h-10 w-10" />
              <p className="font-medium">Tap to upload {type}</p>
              <p className="text-xs">{type === 'video' ? 'Up to 100MB' : 'Up to 10MB'}</p>
            </CardContent>
          </Card>
        )}

        {/* Caption */}
        <div className="space-y-2">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption... use #hashtags to be discovered"
            rows={5}
            maxLength={2200}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {extractHashtags(caption).length > 0 && (
                <>Tags: {extractHashtags(caption).map((t) => `#${t}`).join(' ')}</>
              )}
            </span>
            <span>{caption.length} / 2200</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePost;
