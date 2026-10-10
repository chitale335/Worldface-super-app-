import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MuseumDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', media_url: '', media_type: 'image' });

  const { data: museum } = useQuery({
    queryKey: ['museum', id],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_museums').select('*').eq('id', id).maybeSingle();
      return data as any;
    },
  });
  const { data: items } = useQuery({
    queryKey: ['museum_items', id],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_museum_items').select('*').eq('museum_id', id).order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const add = async () => {
    if (!user || !museum) return;
    if (!form.title.trim()) return toast.error('Title required');
    const { error } = await (supabase.from as any)('cultural_museum_items').insert({ ...form, museum_id: museum.id, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Item added');
    setOpen(false); setForm({ title: '', description: '', media_url: '', media_type: 'image' });
    qc.invalidateQueries({ queryKey: ['museum_items', id] });
  };

  const isOwner = user && museum && user.id === museum.owner_id;

  return (
    <CulturalVerseLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {museum ? (
          <>
            <div className="rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-violet/10 border border-border/50 mb-4">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{museum.name}</h1>
              {museum.description && <p className="text-muted-foreground mt-2">{museum.description}</p>}
              {isOwner && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" />Add item</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add exhibit</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                      <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      <Input placeholder="Image/video URL" value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} />
                      <Button onClick={add} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(items ?? []).map((it) => (
                <Card key={it.id} className="overflow-hidden">
                  {it.media_url && <img src={it.media_url} alt={it.title} className="w-full aspect-square object-cover" />}
                  <div className="p-3">
                    <h4 className="font-medium text-sm">{it.title}</h4>
                    {it.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.description}</p>}
                  </div>
                </Card>
              ))}
              {(items ?? []).length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No exhibits yet.</div>}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        )}
      </div>
    </CulturalVerseLayout>
  );
}
