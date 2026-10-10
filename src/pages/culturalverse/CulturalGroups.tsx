import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

export default function CulturalGroups() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', country_code: '', cover_url: '' });

  const { data } = useQuery({
    queryKey: ['cultural_groups'],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('cultural_groups').select('*').order('member_count', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const create = async () => {
    if (!user) return toast.error('Sign in first');
    if (!form.name.trim()) return toast.error('Name required');
    const slug = slugify(form.name) + '-' + Math.random().toString(36).slice(2, 6);
    const { error } = await (supabase.from as any)('cultural_groups').insert({ ...form, slug, country_code: form.country_code || null, owner_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Group created'); setOpen(false); setForm({ name: '', description: '', country_code: '', cover_url: '' });
    qc.invalidateQueries({ queryKey: ['cultural_groups'] });
  };

  const share = async (slug: string, name: string) => {
    const url = `${window.location.origin}/culturalverse/g/${slug}`;
    if (navigator.share) { try { await navigator.share({ title: name, url }); return; } catch {} }
    await navigator.clipboard.writeText(url); toast.success('Link copied');
  };

  const join = async (id: string) => {
    if (!user) return toast.error('Sign in first');
    const { error } = await (supabase.from as any)('cultural_group_members').insert({ group_id: id, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Joined!');
    qc.invalidateQueries({ queryKey: ['cultural_groups'] });
  };

  return (
    <CulturalVerseLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-heading text-2xl font-bold">Cultural Groups</h2><p className="text-sm text-muted-foreground">Facebook-style groups around cultures, heritage, and traditions.</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Create</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a cultural group</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Country code (e.g. KE)" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} />
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Cover image URL (optional)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div className="aspect-[3/1] bg-gradient-to-br from-primary/30 to-violet/30 relative">
                {g.cover_url && <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold truncate">{g.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {g.member_count} members {g.country_code && `· ${g.country_code}`}</p>
                  </div>
                  <button onClick={() => share(g.slug, g.name)} className="p-1.5 rounded-lg hover:bg-muted transition"><Share2 className="h-4 w-4" /></button>
                </div>
                {g.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{g.description}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => join(g.id)}>Join</Button>
                  <Button size="sm" variant="outline" className="flex-1" asChild><Link to={`/culturalverse/g/${g.slug}`}>Open</Link></Button>
                </div>
              </div>
            </Card>
          ))}
          {(data ?? []).length === 0 && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No groups yet — be the first!</div>}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
