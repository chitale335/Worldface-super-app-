import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const TYPES = [
  'public','private','secret','business','school','fan_club','gaming','marketplace','local','verified_org',
] as const;

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export default function CommunityNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', type: 'public' as (typeof TYPES)[number],
    category: '', country: '', city: '', language: '',
    is_paid: false, monthly_price_coins: 0,
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  const uploadImg = async (file: File, kind: string) => {
    const path = `communities/${user!.id}/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('posts').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  };

  const submit = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'Name and handle are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let avatar_url: string | null = null;
      let cover_url: string | null = null;
      if (avatar) avatar_url = await uploadImg(avatar, 'avatar');
      if (cover) cover_url = await uploadImg(cover, 'cover');

      const { data, error } = await (supabase.from as any)('communities').insert({
        owner_id: user.id,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        type: form.type,
        category: form.category.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        language: form.language.trim() || null,
        is_paid: form.is_paid,
        monthly_price_coins: form.is_paid ? Math.max(0, Number(form.monthly_price_coins) || 0) : 0,
        avatar_url, cover_url,
      }).select('slug').single();
      if (error) throw error;
      toast({ title: 'Community created 🎉' });
      navigate(`/c/${data.slug}`);
    } catch (e: any) {
      toast({ title: 'Failed to create', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <h1 className="text-2xl font-heading font-bold gradient-text">Create Community</h1>

        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
            }} placeholder="WorldFace Creators" />
          </div>
          <div>
            <Label>Handle (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/c/</span>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="worldface-creators" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this community about?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tech, Music…" />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="TZ" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dar es Salaam" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} />
                Paid community
              </Label>
            </div>
            {form.is_paid && (
              <div>
                <Label>Monthly price (coins)</Label>
                <Input type="number" min={0} value={form.monthly_price_coins} onChange={(e) => setForm({ ...form, monthly_price_coins: Number(e.target.value) })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="border border-dashed border-border rounded-xl p-3 text-xs text-muted-foreground cursor-pointer text-center">
              <Upload className="h-4 w-4 inline mr-1" /> Avatar {avatar && <span className="text-primary">✓</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
            </label>
            <label className="border border-dashed border-border rounded-xl p-3 text-xs text-muted-foreground cursor-pointer text-center">
              <Upload className="h-4 w-4 inline mr-1" /> Cover {cover && <span className="text-primary">✓</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <Button onClick={submit} disabled={saving} className="gradient-primary text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create community
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
