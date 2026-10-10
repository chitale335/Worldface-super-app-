import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BarChart3, Banknote, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { PayoutOtpDialog } from '@/components/payouts/PayoutOtpDialog';
import {
  formatMoney, usePayoutMethods, usePayoutRequests, usePayoutSummary,
} from '@/hooks/usePayouts';

const METHOD_TYPES = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'bank', label: 'Bank (SWIFT/IBAN)' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'card', label: 'Debit/Credit Card' },
  { value: 'nexapay', label: 'NexaPay Wallet' },
];

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'NGN', 'ZAR'];

const Payouts = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: summary } = usePayoutSummary();
  const { data: methods } = usePayoutMethods();
  const { data: requests } = usePayoutRequests();

  const [type, setType] = useState('mpesa');
  const [account, setAccount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState<string>('');
  const [otp, setOtp] = useState<{ purpose: 'payout_request' | 'method_change'; params: Record<string, unknown> } | null>(null);

  const defaultMethod = useMemo(() => (methods ?? []).find((m) => m.is_default), [methods]);

  const addMethod = async () => {
    if (!account.trim()) { toast.error('Weka namba/akaunti'); return; }
    const { error } = await supabase.from('payout_methods').insert({
      user_id: user!.id,
      type,
      label: METHOD_TYPES.find((m) => m.value === type)?.label ?? type,
      details: { account: account.trim() },
      currency,
    });
    if (error) { toast.error(error.message); return; }
    setAccount('');
    toast.success('Njia ya malipo imeongezwa');
    qc.invalidateQueries({ queryKey: ['payout-methods'] });
  };

  const removeMethod = async (id: string) => {
    const { error } = await supabase.from('payout_methods').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['payout-methods'] });
  };

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['payout-methods'] });
    qc.invalidateQueries({ queryKey: ['payout-requests'] });
    qc.invalidateQueries({ queryKey: ['payout-summary'] });
    setAmount('');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Banknote className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-heading font-bold">Creator Payouts</h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/payouts/analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Total Earnings', summary?.total_earned ?? 0],
            ['Available', summary?.available ?? 0],
            ['Pending', summary?.pending ?? 0],
            ['Withdrawn', summary?.withdrawn ?? 0],
          ].map(([label, value]) => (
            <Card key={label as string} className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="text-lg font-heading font-bold">{formatMoney(value as number, defaultMethod?.currency ?? 'KES')}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Request payout */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Omba malipo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Njia</Label>
                <Select value={methodId} onValueChange={setMethodId}>
                  <SelectTrigger><SelectValue placeholder="Chagua njia" /></SelectTrigger>
                  <SelectContent>
                    {(methods ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label ?? m.type} · {(m.details as { account?: string })?.account ?? ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kiasi</Label>
                <Input inputMode="decimal" value={amount} placeholder="1000"
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
              </div>
            </div>
            <Button
              onClick={() => {
                const amt = Number(amount);
                if (!methodId) { toast.error('Chagua njia ya malipo'); return; }
                if (!Number.isFinite(amt) || amt <= 0) { toast.error('Weka kiasi sahihi'); return; }
                setOtp({ purpose: 'payout_request', params: { amount: amt, method_id: methodId } });
              }}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />Endelea na OTP
            </Button>
            <p className="text-xs text-muted-foreground">
              Kila ombi la malipo na kila mabadiliko ya njia ya msingi yanahitaji uthibitisho wa OTP.
            </p>
          </CardContent>
        </Card>

        {/* Methods */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Njia za malipo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(methods ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Hakuna njia ya malipo bado.</p>
              )}
              {(methods ?? []).map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.label ?? m.type}
                      {m.is_default && <Badge variant="secondary" className="ml-2">Default</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(m.details as { account?: string })?.account} · {m.currency}
                    </p>
                  </div>
                  {!m.is_default && (
                    <Button size="sm" variant="ghost"
                      onClick={() => setOtp({ purpose: 'method_change', params: { method_id: m.id } })}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => removeMethod(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Aina</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHOD_TYPES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Namba / Akaunti</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="+254712345678" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" onClick={addMethod}><Plus className="h-4 w-4 mr-2" />Ongeza njia</Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Historia ya maombi</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(requests ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Hakuna ombi bado.</p>
            )}
            {(requests ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium">{formatMoney(Number(r.amount), r.currency)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={r.status === 'paid' ? 'default' : 'secondary'}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <PayoutOtpDialog
        open={!!otp}
        onOpenChange={(v) => { if (!v) setOtp(null); }}
        purpose={otp?.purpose ?? 'payout_request'}
        params={otp?.params ?? {}}
        onVerified={refreshAll}
      />
    </AppLayout>
  );
};

export default Payouts;
