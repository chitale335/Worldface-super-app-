import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Brain, Code, Globe, Music, Users, Calendar, MapPin,
  Crown, ExternalLink, Copy, Check, Sparkles, Loader2, Send,
  Pencil, Plus, Trash2, Save,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import samwelImg from '@/assets/samwel-misori.jpg';

type ContentRow = { id: string; section: string; title: string | null; body: string | null };
type SongRow = { id: string; title: string; year: string | null; type: string | null; sort_order: number };
type SocialRow = { id: string; platform: string; handle: string; url: string; icon: string | null; sort_order: number };
type TplRow = { id: string; title: string; language: string; code: string; sort_order: number };

const SOCIAL_COLORS: Record<string, string> = {
  TikTok: 'from-pink-500 to-rose-500',
  Instagram: 'from-purple-500 to-pink-500',
  YouTube: 'from-red-500 to-red-600',
  Facebook: 'from-blue-600 to-blue-500',
  'Twitter / X': 'from-slate-700 to-slate-600',
  Telegram: 'from-sky-500 to-blue-500',
};

const getContent = (rows: ContentRow[] | undefined, key: string, fallback = '') =>
  rows?.find((r) => r.section === key)?.body || fallback;

function EditTextDialog({
  open, onClose, title, initialValue, onSave,
}: {
  open: boolean; onClose: () => void; title: string; initialValue: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [val, setVal] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={12} className="font-mono text-sm" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => {
              setSaving(true);
              try { await onSave(val); onClose(); toast.success('Saved'); }
              catch (e: any) { toast.error(e.message ?? 'Failed to save'); }
              finally { setSaving(false); }
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Founder = () => {
  const qc = useQueryClient();
  const { isAdmin } = useIsAdmin();

  const [editing, setEditing] = useState<{ key: string; title: string; value: string } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  const { data: content } = useQuery({
    queryKey: ['founder-content'],
    queryFn: async () => {
      const { data } = await supabase.from('founder_content' as any).select('*');
      return (data ?? []) as unknown as ContentRow[];
    },
  });
  const { data: songs } = useQuery({
    queryKey: ['founder-songs'],
    queryFn: async () => {
      const { data } = await supabase.from('founder_songs' as any).select('*').order('sort_order');
      return (data ?? []) as unknown as SongRow[];
    },
  });
  const { data: socials } = useQuery({
    queryKey: ['founder-socials'],
    queryFn: async () => {
      const { data } = await supabase.from('founder_socials' as any).select('*').order('sort_order');
      return (data ?? []) as unknown as SocialRow[];
    },
  });
  const { data: templates } = useQuery({
    queryKey: ['founder-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('founder_code_templates' as any).select('*').order('sort_order');
      return (data ?? []) as unknown as TplRow[];
    },
  });

  const saveContent = async (section: string, body: string) => {
    const { error } = await supabase
      .from('founder_content' as any)
      .upsert({ section, body, updated_at: new Date().toISOString() }, { onConflict: 'section' });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['founder-content'] });
  };

  const addSong = async () => {
    const title = prompt('Song title?'); if (!title) return;
    const year = prompt('Year?', new Date().getFullYear().toString()) || '';
    const type = prompt('Type (Single/EP/Album)?', 'Single') || 'Single';
    const order = (songs?.length ?? 0) + 1;
    const { error } = await supabase.from('founder_songs' as any).insert({ title, year, type, sort_order: order });
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ['founder-songs'] }); toast.success('Song added'); }
  };
  const deleteSong = async (id: string) => {
    if (!confirm('Delete this song?')) return;
    const { error } = await supabase.from('founder_songs' as any).delete().eq('id', id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ['founder-songs'] });
  };

  const editSocial = async (s: SocialRow) => {
    const handle = prompt(`${s.platform} handle:`, s.handle); if (handle === null) return;
    const url = prompt(`${s.platform} URL:`, s.url); if (url === null) return;
    const { error } = await supabase.from('founder_socials' as any).update({ handle, url }).eq('id', s.id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ['founder-socials'] }); toast.success('Updated'); }
  };

  const addTemplate = async () => {
    const title = prompt('Template name?'); if (!title) return;
    const language = prompt('Language (tsx, ts, html, etc.)?', 'tsx') || 'tsx';
    const code = prompt('Paste code:'); if (!code) return;
    const order = (templates?.length ?? 0) + 1;
    const { error } = await supabase.from('founder_code_templates' as any).insert({ title, language, code, sort_order: order });
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ['founder-templates'] }); toast.success('Template added'); }
  };
  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete template?')) return;
    const { error } = await supabase.from('founder_code_templates' as any).delete().eq('id', id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ['founder-templates'] });
  };

  const publishPost = async () => {
    const text = aiOutput.trim().slice(0, 2000);
    if (!text) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Please sign in'); return; }
    const { error } = await supabase.from('posts').insert({ user_id: user.id, type: 'text', caption: text, media_url: null });
    if (error) toast.error(error.message); else { toast.success('Imechapishwa / Published'); setAiOutput(''); setAiPrompt(''); }
  };

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiOutput('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Ingia kwanza / Please sign in first');
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexa-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are the WorldFace Super App marketing writer. Write ONE engaging social media post promoting WorldFace (by KOTEKULE): social, messaging, calls, AI Core, music, wallet, marketplace, studio, CulturalVerse. Write in the language the user writes in (English or Kiswahili). Max 600 characters, include a call to action to join WorldFace and 3-6 relevant hashtags like #WorldFace #KOTEKULE. Never claim features are live unless stated. Return only the post text.' },
            { role: 'user', content: aiPrompt },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`AI error ${resp.status}`);
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) setAiOutput((prev) => prev + delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success('Copied');
  };

  const tagline = getContent(content, 'hero_tagline', 'Samwel Misori — Creator & Lead AI Architect');
  const intro = getContent(content, 'hero_intro', 'Visionary behind the WorldFace ecosystem.');
  const bioEn = getContent(content, 'bio_en', '');
  const bioSw = getContent(content, 'bio_sw', '');

  const EditBtn = ({ onClick }: { onClick: () => void }) =>
    isAdmin ? (
      <Button size="sm" variant="ghost" onClick={onClick} className="h-7 px-2 text-xs">
        <Pencil className="h-3 w-3 mr-1" /> Edit
      </Button>
    ) : null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-8">
        {isAdmin && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Admin mode</span> — bonyeza penseli kuhariri sehemu yoyote.
          </div>
        )}

        <Card className="overflow-hidden border-amber-500/20">
          <div className="relative bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative shrink-0">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 blur-lg opacity-50 animate-pulse" />
                <img src={samwelImg} alt="King Misori" className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-amber-500/50" />
              </motion.div>
              <div className="flex-1 text-center lg:text-left space-y-2">
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                  <Crown className="h-3 w-3 mr-1" /> Founder
                </Badge>
                <h1 className="text-3xl lg:text-5xl font-heading font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                  King Misori
                </h1>
                <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                  <p className="text-lg text-muted-foreground">{tagline}</p>
                  <EditBtn onClick={() => setEditing({ key: 'hero_tagline', title: 'Edit tagline', value: tagline })} />
                </div>
                <div className="flex items-start justify-center lg:justify-start gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground max-w-2xl">{intro}</p>
                  <EditBtn onClick={() => setEditing({ key: 'hero_intro', title: 'Edit intro', value: intro })} />
                </div>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Born: January 15</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Tanzania, East Africa</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Family: Misori Family</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> About King Misori
              </h2>
              <EditBtn onClick={() => setEditing({ key: 'bio_en', title: 'Edit English bio', value: bioEn })} />
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{bioEn}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold">Kuhusu King Misori</h2>
              <EditBtn onClick={() => setEditing({ key: 'bio_sw', title: 'Hariri bio (Kiswahili)', value: bioSw })} />
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{bioSw}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Brain, label: 'AI Architect', sub: 'NexaAI Creator' },
            { icon: Code, label: 'Developer', sub: 'Full-Stack' },
            { icon: Music, label: 'Music Artist', sub: `${songs?.length ?? 0}+ Songs` },
            { icon: Globe, label: 'Community', sub: 'WorldFace Founder' },
          ].map((s) => (
            <Card key={s.label} className="text-center">
              <CardContent className="p-4">
                <s.icon className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                <p className="text-sm font-bold">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-heading font-bold">Social Media</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {socials?.map((s) => (
              <Card key={s.id} className="overflow-hidden group hover:border-amber-500/40 transition">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0', SOCIAL_COLORS[s.platform] ?? 'from-slate-600 to-slate-700')}>
                      {s.icon || '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{s.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.handle}</p>
                    </div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-amber-500">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editSocial(s)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <Music className="h-5 w-5 text-amber-500" /> Nyimbo / Discography
            </h2>
            {isAdmin && (
              <Button size="sm" onClick={addSong}><Plus className="h-4 w-4 mr-1" /> Ongeza nyimbo</Button>
            )}
          </div>
          <div className="space-y-2">
            {songs?.map((s, i) => (
              <Card key={s.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">{i + 1}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.year} · {s.type}</p>
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSong(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> WorldFace AI Post Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            AI inatengeneza machapisho mazuri kuhusu WorldFace Super App — hariri kisha chapisha kwenye feed.
          </p>
          <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="mf. 'Tangaza WorldFace Wallet kwa wasanii' / 'Promote WorldFace Studio'" rows={3} />
          <div className="flex flex-wrap gap-2">
            {['Tangaza WorldFace Super App', 'Promote WorldFace AI Core', 'WorldFace Music kwa wasanii', 'Join WorldFace Marketplace'].map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => setAiPrompt(s)}>{s}</Button>
            ))}
          </div>
          <Button onClick={generate} disabled={aiLoading || !aiPrompt.trim()}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Generate post
          </Button>
          {aiOutput && (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-xs text-muted-foreground">Rasimu / Draft</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(aiOutput, 'ai')}>
                      {copiedIdx === 'ai' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" onClick={publishPost} disabled={aiLoading}>Chapisha / Publish</Button>
                  </div>
                </div>
                <Textarea value={aiOutput} onChange={(e) => setAiOutput(e.target.value)} rows={8} className="border-0 rounded-none text-sm" />
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold">Code Templates</h2>
            {isAdmin && (
              <Button size="sm" onClick={addTemplate}><Plus className="h-4 w-4 mr-1" /> Ongeza template</Button>
            )}
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            {templates?.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-3 border-b">
                    <div>
                      <p className="font-bold text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.language}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copy(t.code, t.id)}>
                        {copiedIdx === t.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setEditing({ key: `tpl:${t.id}`, title: `Edit "${t.title}"`, value: t.code })}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <pre className="p-3 text-xs overflow-x-auto max-h-64 font-mono">{t.code}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-6 pb-2 border-t">
          © 2026 WorldFace by King Misori (Samwel Misori). All rights reserved.
        </footer>
      </div>

      {editing && (
        <EditTextDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          title={editing.title}
          initialValue={editing.value}
          onSave={async (v) => {
            if (editing.key.startsWith('tpl:')) {
              const id = editing.key.slice(4);
              const { error } = await supabase.from('founder_code_templates' as any).update({ code: v }).eq('id', id);
              if (error) throw error;
              qc.invalidateQueries({ queryKey: ['founder-templates'] });
            } else {
              await saveContent(editing.key, v);
            }
          }}
        />
      )}
    </AppLayout>
  );
};

export default Founder;
