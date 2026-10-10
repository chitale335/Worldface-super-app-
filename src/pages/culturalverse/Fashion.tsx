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
import { Shirt, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Fashion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', country_code: '', image_url: '', occasion: '' });

  const { data } = useQuery({
    queryKey: ['cultural_fashion'],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_fashion_items').select('*').order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const create = async () => {
    if (!user) return toast.error('Sign in first');
    if (!form.name.trim()) return toast.error('Name required');
    const { error } = await (supabase.from as any)('cultural_fashion_items').insert({ ...form, country_code: form.country_code || null, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Added'); setOpen(false); setForm({ name: '', description: '', country_code: '', image_url: '', occasion: '' });
    qc.invalidateQueries({ queryKey: ['cultural_fashion'] });
  };

  return (
    <CulturalVerseLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-heading text-2xl font-bold">Traditional Fashion Gallery</h2><p className="text-sm text-muted-foreground">Traditional clothing across cultures.</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add clothing</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Name (e.g. Kente cloth)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Country code" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} />
                <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                <Input placeholder="Occasion (e.g. weddings)" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
                <Textarea placeholder="Description & history" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button onClick={create} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(data ?? []).map((f) => (
            <Card key={f.id} className="overflow-hidden">
              {f.image_url ? <img src={f.image_url} alt={f.name} className="w-full aspect-square object-cover" /> : <div className="aspect-square bg-gradient-to-br from-violet/20 to-rose/20 flex items-center justify-center"><Shirt className="h-10 w-10 text-violet/60" /></div>}
              <div className="p-3">
                <h4 className="font-medium text-sm">{f.name}</h4>
                <p className="text-xs text-muted-foreground">{f.country_code} {f.occasion && `· ${f.occasion}`}</p>
                {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
              </div>
            </Card>
          ))}
          {(data ?? []).length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">Nothing here yet.</div>}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
