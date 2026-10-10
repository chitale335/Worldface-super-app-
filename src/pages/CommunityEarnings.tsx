import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Coins, DollarSign, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import {
  EARNINGS_TYPES,
  formatMoney,
  useAddEarningsDistribution,
  useCommunityEarnings,
  useCommunityEarningsDistribution,
  useCommunityEarningsSummary,
  useRecordCommunityEarning,
} from '@/hooks/useCommunityEarnings';

const CommunityEarnings = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [earningType, setEarningType] = useState('membership_fee');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [share, setShare] = useState('');
  const [distributionType, setDistributionType] = useState('membership_fee');

  const loadCommunity = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await (supabase.from as any)('communities').select('id,name,slug,owner_id').eq('slug', slug).maybeSingle();
    if (error) toast.error(error.message);
    else setCommunity(data);
  };
  if (!community && slug) void loadCommunity();

  const communityId = community?.id;
  const isStaff = !!user && !!community && (community.owner_id === user.id);
  const { data: summary, refetch: refetchSummary } = useCommunityEarningsSummary(communityId);
  const { data: earnings, refetch: refetchEarnings } = useCommunityEarnings(communityId, 90);
  const { data: distributions } = useCommunityEarningsDistribution(communityId);
  const record = useRecordCommunityEarning();
  const addDistribution = useAddEarningsDistribution();

  const refresh = () => { void refetchSummary(); void refetchEarnings(); };
  const submitEarning = async () => {
    const value = Number(amount);
    if (!communityId || !user || !Number.isFinite(value) || value <= 0) { toast.error('Weka kiasi sahihi'); return; }
    try {
      await record.mutateAsync({ communityId, userId: user.id, earningsType: earningType, amount: value, description: description.trim() || undefined });
      setAmount(''); setDescription(''); toast.success('Mapato yamehifadhiwa');
    } catch (e: any) { toast.error(e.message); }
  };
  const submitDistribution = async () => {
    const value = Number(share);
    if (!communityId || !recipient.trim() || value < 0 || value > 100) { toast.error('Weka user ID na asilimia 0-100'); return; }
    try {
      await addDistribution.mutateAsync({ communityId, recipientUserId: recipient.trim(), earningsType: distributionType, sharePercentage: value });
      setRecipient(''); setShare(''); toast.success('Mgawanyo umeongezwa');
    } catch (e: any) { toast.error(e.message); }
  };

  const byType = summary?.earnings_by_type ?? {};
  const max = Math.max(...Object.values(byType).map(Number), 1);

  return <AppLayout><div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div><Button asChild variant="ghost" size="sm"><Link to={`/c/${slug}`}><ArrowLeft className="h-4 w-4 mr-1" />Rudi kwenye group</Link></Button><h1 className="text-2xl font-heading font-bold gradient-text">Community Earnings</h1><p className="text-sm text-muted-foreground">Mapato yote ya group moja kwa moja.</p></div>
      <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Jumla', summary?.total_earned ?? 0], ['Inapatikana', summary?.total_available ?? 0], ['Pending', summary?.total_pending ?? 0], ['Imelipwa', summary?.total_withdrawn ?? 0]].map(([label, value]) => <Card key={label as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label as string}</p><p className="text-xl font-bold">{formatMoney(Number(value))}</p></CardContent></Card>)}</div>

    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Coins className="h-4 w-4" />Mapato kwa aina</CardTitle></CardHeader><CardContent className="space-y-3">{EARNINGS_TYPES.map((type) => { const value = Number(byType[type.value] ?? 0); return <div key={type.value}><div className="flex justify-between text-sm"><span>{type.label}</span><span className="font-medium">{formatMoney(value)}</span></div><Progress value={(value / max) * 100} className="h-2 mt-1" /></div>; })}</CardContent></Card>

    {isStaff && <div className="grid lg:grid-cols-2 gap-4"><Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Ongeza earning</CardTitle></CardHeader><CardContent className="space-y-3"><div><Label>Aina ya mapato</Label><Select value={earningType} onValueChange={setEarningType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EARNINGS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Kiasi (KES)</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" /></div><div><Label>Maelezo</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Chanzo cha mapato" /></div><Button onClick={submitEarning} disabled={record.isPending}><Plus className="h-4 w-4 mr-2" />Hifadhi mapato</Button></CardContent></Card><Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Revenue sharing</CardTitle></CardHeader><CardContent className="space-y-3"><div><Label>Member user ID</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="UUID ya member" /></div><div className="grid grid-cols-2 gap-2"><div><Label>Aina</Label><Select value={distributionType} onValueChange={setDistributionType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EARNINGS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Share %</Label><Input type="number" min="0" max="100" value={share} onChange={(e) => setShare(e.target.value)} placeholder="10" /></div></div><Button variant="outline" onClick={submitDistribution} disabled={addDistribution.isPending}><ShieldCheck className="h-4 w-4 mr-2" />Weka mgawanyo</Button><div className="space-y-1">{(distributions ?? []).map((d) => <div key={d.id} className="flex justify-between text-xs border rounded p-2"><span>{d.recipient_user_id.slice(0, 8)}… · {d.earnings_type}</span><Badge variant="secondary">{d.share_percentage}%</Badge></div>)}</div></CardContent></Card></div>}

    <Card><CardHeader><CardTitle className="text-base">Recent earnings</CardTitle></CardHeader><CardContent className="space-y-2">{(earnings ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Hakuna earnings bado.</p> : (earnings ?? []).map((earning) => <div key={earning.id} className="flex justify-between gap-3 border rounded-lg p-3"><div><p className="text-sm font-medium">{EARNINGS_TYPES.find((t) => t.value === earning.earnings_type)?.label ?? earning.earnings_type}</p><p className="text-xs text-muted-foreground">{earning.description || earning.source_type || 'Community earning'} · {new Date(earning.created_at).toLocaleDateString()}</p></div><p className="font-semibold">{formatMoney(earning.amount, earning.currency)}</p></div>)}</CardContent></Card>
  </div></AppLayout>;
};
export default CommunityEarnings;
