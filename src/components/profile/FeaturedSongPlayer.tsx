import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { Music, Play, Pause, Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Song = { user_id: string; title: string; artist: string | null; audio_url: string; cover_url: string | null };

export function FeaturedSongPlayer({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', audio_url: '', cover_url: '' });

  const { data: song } = useQuery({
    queryKey: ['featured-song', userId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('profile_featured_song')
        .select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data as Song | null;
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('profile_featured_song').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['featured-song', userId] });
      setPlaying(false);
    },
  });

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const uploadFile = async (file: File, kind: 'audio' | 'cover') => {
    const bucket = 'posts';
    const path = `${userId}/song/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const onAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setSaving(true);
    try {
      const url = await uploadFile(f, 'audio');
      setForm((s) => ({ ...s, audio_url: url }));
    } catch (err: any) { toast({ title: 'Upload imeshindwa', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setSaving(true);
    try {
      const url = await uploadFile(f, 'cover');
      setForm((s) => ({ ...s, cover_url: url }));
    } catch (err: any) { toast({ title: 'Upload imeshindwa', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const save = async () => {
    if (!form.title || !form.audio_url) {
      toast({ title: 'Title na audio zinahitajika', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await (supabase.from as any)('profile_featured_song').upsert({
      user_id: userId,
      title: form.title,
      artist: form.artist || null,
      audio_url: form.audio_url,
      cover_url: form.cover_url || null,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast({ title: 'Hitilafu', description: error.message, variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['featured-song', userId] });
    setEditing(false);
    toast({ title: 'Featured song imesasishwa!' });
  };

  const startEdit = () => {
    setForm({
      title: song?.title ?? '',
      artist: song?.artist ?? '',
      audio_url: song?.audio_url ?? '',
      cover_url: song?.cover_url ?? '',
    });
    setEditing(true);
  };

  if (!song && !isOwner) return null;

  if (editing) {
    return (
      <div className="rounded-lg border border-border p-3 space-y-3 bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading font-semibold flex items-center gap-2"><Music className="h-4 w-4" /> Featured song</h3>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Artist</Label>
          <Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer">
            <Button asChild size="sm" variant="outline" disabled={saving}>
              <span><Upload className="h-4 w-4 mr-1" /> Audio {form.audio_url && '✓'}</span>
            </Button>
            <input type="file" accept="audio/*" className="hidden" onChange={onAudio} />
          </label>
          <label className="cursor-pointer">
            <Button asChild size="sm" variant="outline" disabled={saving}>
              <span><Upload className="h-4 w-4 mr-1" /> Cover {form.cover_url && '✓'}</span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={onCover} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !form.title || !form.audio_url}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Hifadhi
          </Button>
          {song && <Button variant="ghost" onClick={() => { del.mutate(); setEditing(false); }}>Ondoa</Button>}
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Music className="h-4 w-4" /> Weka featured song</div>
        <Button size="sm" variant="outline" onClick={startEdit}>Ongeza</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent">
      <button onClick={toggle} className="relative h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <Music className="h-6 w-6 text-primary" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
          {playing ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{song.title}</p>
        {song.artist && <p className="text-xs text-muted-foreground truncate">{song.artist}</p>}
        <audio ref={audioRef} src={song.audio_url} onEnded={() => setPlaying(false)} />
      </div>
      {isOwner && (
        <Button size="sm" variant="ghost" onClick={startEdit}>Hariri</Button>
      )}
    </div>
  );
}
