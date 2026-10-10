import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function HeritageMusic() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', country_code: '', audio_url: '', cover_url: '', instrument: '', kind: 'song', description: '' });

  const { data } = useQuery({
    queryKey: ['cultural_music'],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_music_tracks').select('*').order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const create = async () => {
    if (!user) return toast.error('Sign in first');
    if (!form.title.trim()) return toast.error('Title required');
    const { error } = await (supabase.from as any)('cultural_music_tracks').insert({ ...form, country_code: form.country_code || null, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Added');
    setOpen(false); setForm({ title: '', artist: '', country_code: '', audio_url: '', cover_url: '', instrument: '', kind: 'song', description: '' });
    qc.invalidateQueries({ queryKey: ['cultural_music'] });
  };

  return (
    <CulturalVerseLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-heading text-2xl font-bold">Heritage Music Hub</h2><p className="text-sm text-muted-foreground">Traditional songs, instruments, and dances.</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Share heritage music</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Artist / performer" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
                <Input placeholder="Country code" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} />
                <Input placeholder="Audio URL (mp3/wav)" value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
                <Input placeholder="Cover image URL" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                <Input placeholder="Instrument (optional)" value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} />
                <Textarea placeholder="Description / history" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button onClick={create} className="w-full">Share</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose/30 to-violet/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {t.cover_url ? <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover" /> : <Music2 className="h-6 w-6 text-white/70" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold truncate">{t.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t.artist || 'Traditional'} · {t.country_code}</p>
                  {t.instrument && <p className="text-xs text-primary mt-1">🎵 {t.instrument}</p>}
                </div>
              </div>
              {t.audio_url && <audio controls src={t.audio_url} className="w-full mt-3 h-9" />}
              {t.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{t.description}</p>}
            </Card>
          ))}
          {(data ?? []).length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No tracks yet.</div>}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
