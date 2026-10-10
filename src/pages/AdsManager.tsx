import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Sparkles, Loader2, BarChart3, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'NGN', 'ZAR'];
const OBJECTIVES = [
  { v: 'awareness', l: 'Kujulikana (Awareness)' },
  { v: 'traffic', l: 'Traffic / Visits' },
  { v: 'followers', l: 'Wafuasi' },
  { v: 'sales', l: 'Mauzo' },
  { v: 'app_install', l: 'App installs' },
];

type Estimate = {
  recommended_cpm?: number; recommended_budget?: number; currency?: string;
  estimated_impressions?: number; estimated_clicks?: number; estimated_ctr?: number;
  estimated_reach?: number; daily_budget?: number; priority?: number;
  confidence?: string; notes?: string; tips?: string[];
};

const AdsManager = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Fungua');
  const [ctaRoute, setCtaRoute] = useState('/');
  const [objective, setObjective] = useState('awareness');
  const [placement, setPlacement] = useState('app_open');
  const [currency, setCurrency] = useState('KES');
  const [budget, setBudget] = useState('5000');
  const [days, setDays] = useState('7');
  const [audience, setAudience] = useState('');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['my-ad-campaigns', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('ad_campaigns')
        .select('*').eq('owner_id', user!.id).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const runEstimate = async () => {
    if (!title.trim()) { toast.error('Weka kichwa cha tangazo kwanza'); return; }
    setEstimating(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ads-advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.session?.access_token}` },
        body: JSON.stringify({ title, objective, placement, currency, days: Number(days), budget: Number(budget), audience }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Estimate failed');
      setEstimate(json.estimate);
      toast.success('AI imekokotoa gharama na ufikiaji');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEstimating(false);
    }
  };

  const save = async (status: 'draft' | 'active') => {
    if (!user || !title.trim()) { toast.error('Kichwa kinahitajika'); return; }
    setSaving(true);
    const endsAt = new Date(Date.now() + Number(days || 7) * 864e5).toISOString();
    const { error } = await supabase.from('ad_campaigns').insert({
      owner_id: user.id,
      title: title.trim(),
      body: body.trim() || null,
      media_url: mediaUrl.trim() || null,
      cta_label: ctaLabel.trim() || 'Fungua',
      cta_route: ctaRoute.trim() || null,
      objective,
      placement,
      currency,
      budget_total: Number(budget || 0),
      cpm: Number(estimate?.recommended_cpm ?? 0),
      priority: Math.min(10, Math.max(1, Number(estimate?.priority ?? 5))),
      audience: { note: audience } as never,
      ai_estimate: (estimate ?? null) as never,
      status,
      ends_at: endsAt,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'active' ? 'Tangazo limeanza kuonekana ndani ya app' : 'Rasimu imehifadhiwa');
    setTitle(''); setBody(''); setMediaUrl(''); setAudience(''); setEstimate(null);
    qc.invalidateQueries({ queryKey: ['my-ad-campaigns', user.id] });
  };

  const toggleStatus = async (id: string, status: string) => {
    const next = status === 'active' ? 'paused' : 'active';
    await supabase.from('ad_campaigns').update({ status: next }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['my-ad-campaigns', user?.id] });
  };

  const money = (n?: number) => `${currency} ${Number(n ?? 0).toLocaleString()}`;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Ads Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Matangazo yanaonekana <b>ndani ya WorldFace tu</b> — app-open au ndani ya feed. AI inakusaidia kujua bajeti na gharama.
          </p>
        </header>

        <Card>
          <CardHeader><CardTitle className="text-base">Tangazo jipya</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Kichwa</Label>
              <Input id="ad-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sikiliza wimbo mpya wa King Misori" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-body">Maelezo</Label>
              <Textarea id="ad-body" value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ad-media">Picha (URL)</Label>
                <Input id="ad-media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-route">Inafungua ukurasa</Label>
                <Input id="ad-route" value={ctaRoute} onChange={(e) => setCtaRoute(e.target.value)} placeholder="/music" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-cta">Kitufe</Label>
                <Input id="ad-cta" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Lengo</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mahali</Label>
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app_open">App open (kipaumbele)</SelectItem>
                    <SelectItem value="feed">Ndani ya feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sarafu</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-budget">Bajeti</Label>
                <Input id="ad-budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-days">Siku</Label>
                <Input id="ad-days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-aud">Walengwa</Label>
              <Input id="ad-aud" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Vijana 18-30, Kenya & Tanzania, wapenda muziki" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={runEstimate} disabled={estimating}>
                {estimating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                AI: kokotoa gharama
              </Button>
              <Button variant="secondary" onClick={() => save('draft')} disabled={saving}>Hifadhi rasimu</Button>
              <Button onClick={() => save('active')} disabled={saving}>Anzisha tangazo</Button>
            </div>

            {estimate && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Makadirio ya AI
                  {estimate.confidence && <Badge variant="outline" className="ml-1 text-[10px]">{estimate.confidence}</Badge>}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>CPM: <b>{money(estimate.recommended_cpm)}</b></div>
                  <div>Bajeti bora: <b>{money(estimate.recommended_budget)}</b></div>
                  <div>Kila siku: <b>{money(estimate.daily_budget)}</b></div>
                  <div>Impressions: <b>{estimate.estimated_impressions?.toLocaleString()}</b></div>
                  <div>Clicks: <b>{estimate.estimated_clicks?.toLocaleString()}</b></div>
                  <div>CTR: <b>{estimate.estimated_ctr}%</b></div>
                  <div>Watu: <b>{estimate.estimated_reach?.toLocaleString()}</b></div>
                  <div>Kipaumbele: <b>{estimate.priority}/10</b></div>
                </div>
                {estimate.notes && <p className="text-xs text-muted-foreground">{estimate.notes}</p>}
                {!!estimate.tips?.length && (
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                    {estimate.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="font-heading font-semibold">Matangazo yangu</h2>
          {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Hakuna tangazo bado.</p>}
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.placement === 'app_open' ? 'App open' : 'Feed'} · {c.currency} {Number(c.spend).toLocaleString()}/{Number(c.budget_total).toLocaleString()} · {c.impressions} views · {c.clicks} clicks
                  </p>
                </div>
                <Badge variant={c.status === 'active' ? 'default' : 'outline'}>{c.status}</Badge>
                {(c.status === 'active' || c.status === 'paused' || c.status === 'draft') && (
                  <Button size="icon" variant="ghost" onClick={() => toggleStatus(c.id, c.status)} aria-label="Toggle">
                    {c.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppLayout>
  );
};

export default AdsManager;
