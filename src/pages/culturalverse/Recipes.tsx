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
import { UtensilsCrossed, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Recipes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', country_code: '', image_url: '', ingredients: '', steps: '' });

  const { data } = useQuery({
    queryKey: ['cultural_recipes'],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_recipes').select('*').order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const create = async () => {
    if (!user) return toast.error('Sign in first');
    if (!form.title.trim()) return toast.error('Title required');
    const payload = {
      title: form.title, description: form.description || null, country_code: form.country_code || null,
      image_url: form.image_url || null,
      ingredients: form.ingredients ? form.ingredients.split('\n').map((s) => s.trim()).filter(Boolean) : null,
      steps: form.steps ? form.steps.split('\n').map((s) => s.trim()).filter(Boolean) : null,
      owner_id: user.id,
    };
    const { error } = await (supabase.from as any)('cultural_recipes').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Recipe shared');
    setOpen(false); setForm({ title: '', description: '', country_code: '', image_url: '', ingredients: '', steps: '' });
    qc.invalidateQueries({ queryKey: ['cultural_recipes'] });
  };

  return (
    <CulturalVerseLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-2xl font-bold">World Recipes</h2>
            <p className="text-sm text-muted-foreground">Traditional cuisine, step-by-step.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Share</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Share a recipe</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title (e.g. Jollof Rice)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Country code (e.g. NG)" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} />
                <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                <Textarea placeholder="Ingredients (one per line)" rows={4} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
                <Textarea placeholder="Steps (one per line)" rows={5} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
                <Button onClick={create} className="w-full">Share recipe</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((r) => (
            <Card key={r.id} className="overflow-hidden">
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} className="w-full aspect-video object-cover" />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-amber/20 to-rose/20 flex items-center justify-center"><UtensilsCrossed className="h-10 w-10 text-amber/60" /></div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1"><h3 className="font-heading font-semibold">{r.title}</h3>{r.country_code && <span className="text-xs text-muted-foreground">· {r.country_code}</span>}</div>
                {r.description && <p className="text-sm text-muted-foreground mb-3">{r.description}</p>}
                {r.ingredients?.length > 0 && <div className="mb-2"><div className="text-xs font-semibold mb-1">Ingredients</div><ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">{r.ingredients.map((i: string, k: number) => <li key={k}>{i}</li>)}</ul></div>}
                {r.steps?.length > 0 && <div><div className="text-xs font-semibold mb-1">Steps</div><ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-0.5">{r.steps.map((s: string, k: number) => <li key={k}>{s}</li>)}</ol></div>}
              </div>
            </Card>
          ))}
          {(data ?? []).length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No recipes yet.</div>}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
