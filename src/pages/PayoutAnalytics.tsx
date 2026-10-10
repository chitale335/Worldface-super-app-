import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowLeft, Download, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney, usePayoutSummary, useRevenueLogs } from '@/hooks/usePayouts';

const SOURCE_LABELS: Record<string, string> = {
  video: 'Video',
  live: 'Live',
  post: 'Posts',
  music: 'Music',
  gift: 'Gifts',
  ads: 'Ads',
  other: 'Other',
};

const PayoutAnalytics = () => {
  const { data: summary } = usePayoutSummary();
  const { data: logs, isLoading } = useRevenueLogs(30);
  const currency = logs?.[0]?.currency ?? 'KES';

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, 0);
    }
    (logs ?? []).forEach((l) => {
      const key = l.occurred_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + l.amount);
    });
    return Array.from(map, ([date, amount]) => ({ date: date.slice(5), amount }));
  }, [logs]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    (logs ?? []).forEach((l) => map.set(l.source, (map.get(l.source) ?? 0) + l.amount));
    return Array.from(map, ([source, amount]) => ({
      source: SOURCE_LABELS[source] ?? source,
      amount,
    })).sort((a, b) => b.amount - a.amount);
  }, [logs]);

  const csv = useMemo(() => {
    const rows = [
      ['Metric', 'Amount', 'Currency'],
      ['Total Earnings', String(summary?.total_earned ?? 0), currency],
      ['Available Balance', String(summary?.available ?? 0), currency],
      ['Pending Payouts', String(summary?.pending ?? 0), currency],
      ['Total Withdrawn', String(summary?.withdrawn ?? 0), currency],
      [],
      ['Content Type', 'Revenue (30d)', 'Currency'],
      ...bySource.map((s) => [s.source, String(s.amount), currency]),
      [],
      ['Date', 'Revenue', 'Currency'],
      ...daily.map((d) => [d.date, String(d.amount), currency]),
    ];
    return rows.map((r) => r.join(',')).join('\n');
  }, [summary, bySource, daily, currency]);

  const summaryText = useMemo(() => (
    `WorldFace Creator Report (siku 30)\n` +
    `Total: ${formatMoney(summary?.total_earned ?? 0, currency)}\n` +
    `Available: ${formatMoney(summary?.available ?? 0, currency)}\n` +
    `Pending: ${formatMoney(summary?.pending ?? 0, currency)}\n` +
    `Withdrawn: ${formatMoney(summary?.withdrawn ?? 0, currency)}\n\n` +
    bySource.map((s) => `${s.source}: ${formatMoney(s.amount, currency)}`).join('\n')
  ), [summary, bySource, currency]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldface-payout-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return a.download;
  };

  const shareWhatsApp = () => {
    const name = downloadCsv();
    toast.success(`CSV imepakuliwa (${name}) — ambatisha kwenye WhatsApp`);
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank', 'noopener');
  };

  const shareGmail = () => {
    const name = downloadCsv();
    toast.success(`CSV imepakuliwa (${name}) — ambatisha kwenye Gmail`);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('WorldFace Creator Payout Report')}&body=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link to="/payouts"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-heading font-bold">Payout Analytics</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Total Earnings', summary?.total_earned ?? 0],
            ['Available Balance', summary?.available ?? 0],
            ['Pending Payouts', summary?.pending ?? 0],
            ['Total Withdrawn', summary?.withdrawn ?? 0],
          ].map(([label, value]) => (
            <Card key={label as string} className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="text-lg font-heading font-bold">{formatMoney(value as number, currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Mapato ya siku 30</CardTitle></CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Inapakia...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Revenue by content type</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hakuna mapato yaliyorekodiwa bado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySource}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Export report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadCsv}><Download className="h-4 w-4 mr-2" />Pakua CSV</Button>
              <Button variant="outline" onClick={shareWhatsApp}><MessageCircle className="h-4 w-4 mr-2" />WhatsApp</Button>
              <Button variant="outline" onClick={shareGmail}><Mail className="h-4 w-4 mr-2" />Gmail</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              WhatsApp na Gmail hufungua ujumbe wenye muhtasari; faili la CSV linapakuliwa kwenye kifaa chako ili uambatishe.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PayoutAnalytics;
