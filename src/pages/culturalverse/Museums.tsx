import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Museum { id: string; name: string; description: string | null; country_code: string | null; cover_url: string | null; owner_id: string }

export default function Museums() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', country_code: '', cover_url: '' });

  const { data } = useQuery({
    queryKey: ['cultural_museums'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('cultural_museums').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Museum[];
    },
  });

  const create = async () => {
    if (!user) return toast.error('Sign in first');
    if (!form.name.trim()) return toast.error('Name required');
    const { error } = await (supabase.from as any)('cultural_museums').insert({ ...form, country_code: form.country_code || null, cover_url: form.cover_url || null, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Museum created');
    setOpen(false); setForm({ name: '', description: '', country_code: '', cover_url: '' });
    qc.invalidateQueries({ queryKey: ['cultural_museums'] });
  };

  return (
    <CulturalVerseLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-2xl font-bold">Virtual Cultural Museums</h2>
            <p className="text-sm text-muted-foreground">Curate photos, videos, and stories to preserve heritage.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a museum</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Museum name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Country code (e.g. KE)" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} />
                <Input placeholder="Cover image URL (optional)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(data ?? []).map((m) => (
            <Link key={m.id} to={`/culturalverse/museums/${m.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 transition">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-violet/20 flex items-center justify-center">
                  {m.cover_url ? <img src={m.cover_url} alt={m.name} className="w-full h-full object-cover" /> : <Building2 className="h-10 w-10 text-primary/50" />}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.description || 'A digital heritage collection'}</p>
                </div>
              </Card>
            </Link>
          ))}
          {(data ?? []).length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Be the first to create a museum.</div>}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
