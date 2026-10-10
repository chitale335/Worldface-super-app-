import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Send, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { formatCount, timeAgo } from '@/lib/feed';
import { cn } from '@/lib/utils';

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Tx = {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  amount: number;
  type: 'transfer' | 'welcome_bonus' | 'gift';
  note: string | null;
  created_at: string;
};

const Wallet = () => {
  const { user } = useAuth();
  const { balance, loading } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [txLoading, setTxLoading] = useState(true);

  // Send dialog state
  const [sendOpen, setSendOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  // Load transactions
  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!active) return;
      const txs = (data ?? []) as Tx[];
      setTransactions(txs);
      setTxLoading(false);

      const ids = Array.from(
        new Set(
          txs.flatMap((t) => [t.sender_id, t.recipient_id]).filter((x): x is string => !!x && x !== user.id),
        ),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', ids);
        if (active && profs) {
          setProfiles(Object.fromEntries(profs.map((p) => [p.user_id, p as Profile])));
        }
      }
    };
    load();

    const channel = supabase
      .channel(`wallet-tx-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        (payload) => {
          const tx = payload.new as Tx;
          if (tx.sender_id === user.id || tx.recipient_id === user.id) {
            setTransactions((prev) => [tx, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Search users
  useEffect(() => {
    if (!sendOpen || search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .ilike('display_name', `%${search.trim()}%`)
        .neq('user_id', user?.id ?? '')
        .limit(8);
      setResults((data ?? []) as Profile[]);
    }, 200);
    return () => clearTimeout(t);
  }, [search, sendOpen, user]);

  const stats = useMemo(() => {
    let sent = 0;
    let received = 0;
    for (const t of transactions) {
      if (t.sender_id === user?.id) sent += t.amount;
      else if (t.recipient_id === user?.id) received += t.amount;
    }
    return { sent, received };
  }, [transactions, user]);

  const resetSend = () => {
    setSearch('');
    setResults([]);
    setRecipient(null);
    setAmount('');
    setNote('');
  };

  const handleSend = async () => {
    if (!recipient) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || !Number.isInteger(amt)) {
      toast({ title: 'Invalid amount', description: 'Enter a positive whole number.', variant: 'destructive' });
      return;
    }
    if (amt > balance) {
      toast({ title: 'Insufficient balance', description: `You only have ${balance} coins.`, variant: 'destructive' });
      return;
    }
    setSending(true);
    const { error } = await supabase.rpc('transfer_coins', {
      _recipient_id: recipient.user_id,
      _amount: amt,
      _note: note.trim() || null,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Transfer failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Sent!', description: `${amt} coins → ${recipient.display_name ?? 'user'}` });
    setSendOpen(false);
    resetSend();
  };

  const renderTx = (t: Tx) => {
    const isIncoming = t.recipient_id === user?.id;
    const counterpartId = isIncoming ? t.sender_id : t.recipient_id;
    const counterpart = counterpartId ? profiles[counterpartId] : null;
    const isBonus = t.type === 'welcome_bonus';

    return (
      <div
        key={t.id}
        onClick={() => counterpartId && navigate(`/u/${counterpartId}`)}
        className={cn(
          'flex items-center gap-3 p-4 border-b border-border last:border-0 transition-colors',
          counterpartId && 'cursor-pointer hover:bg-muted/40',
        )}
      >
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
            isIncoming ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
          )}
        >
          {isBonus ? (
            <Sparkles className="h-5 w-5" />
          ) : isIncoming ? (
            <ArrowDownLeft className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {isBonus
              ? 'Welcome bonus'
              : isIncoming
                ? `From ${counterpart?.display_name ?? 'Someone'}`
                : `To ${counterpart?.display_name ?? 'Someone'}`}
          </p>
          {t.note && <p className="text-xs text-muted-foreground truncate">{t.note}</p>}
          <p className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</p>
        </div>
        <div
          className={cn(
            'font-bold tabular-nums',
            isIncoming ? 'text-primary' : 'text-foreground',
          )}
        >
          {isIncoming ? '+' : '−'}
          {formatCount(t.amount)}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Balance card */}
        <Card className="relative overflow-hidden border-0 text-primary-foreground p-6 shadow-lg"
          style={{ background: 'var(--gradient-sunset)' }}
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Coins className="h-4 w-4" />
              NexaPay Wallet
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              {loading ? (
                <Skeleton className="h-12 w-40 bg-primary-foreground/20" />
              ) : (
                <>
                  <span className="text-5xl font-bold tabular-nums tracking-tight">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-lg font-medium text-primary-foreground/80">coins</span>
                </>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Dialog
                open={sendOpen}
                onOpenChange={(o) => {
                  setSendOpen(o);
                  if (!o) resetSend();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send coins</DialogTitle>
                    <DialogDescription>Transfer NexaPay coins to another user.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!recipient ? (
                      <div className="space-y-2">
                        <Label>Recipient</Label>
                        <Input
                          placeholder="Search by display name…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          autoFocus
                        />
                        {results.length > 0 && (
                          <div className="border rounded-md max-h-60 overflow-y-auto">
                            {results.map((p) => (
                              <button
                                key={p.user_id}
                                onClick={() => setRecipient(p)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
                              >
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={p.avatar_url ?? undefined} />
                                  <AvatarFallback>
                                    {p.display_name?.[0]?.toUpperCase() ?? '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {p.display_name ?? 'Unnamed'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={recipient.avatar_url ?? undefined} />
                          <AvatarFallback>
                            {recipient.display_name?.[0]?.toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {recipient.display_name ?? 'Unnamed'}
                          </p>
                          <button
                            onClick={() => setRecipient(null)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Amount (coins)</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {balance.toLocaleString()} coins
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Textarea
                        placeholder="What's it for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={200}
                        rows={2}
                      />
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSend}
                      disabled={!recipient || !amount || sending}
                    >
                      {sending ? 'Sending…' : `Send ${amount || '0'} coins`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={() =>
                  toast({
                    title: 'Receive coins',
                    description: 'Share your profile so others can send you coins.',
                  })
                }
              >
                <Gift className="h-4 w-4" />
                Receive
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-0 bg-gradient-to-br from-emerald/10 to-cyan/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald" />
              Received
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald">
              {formatCount(stats.received)}
            </div>
          </Card>
          <Card className="p-4 border-0 bg-gradient-to-br from-rose/10 to-amber/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose" />
              Sent
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-rose">
              {formatCount(stats.sent)}
            </div>
          </Card>
        </div>

        {/* History */}
        <Card>
          <Tabs defaultValue="all" className="w-full">
            <div className="p-4 pb-0">
              <h2 className="text-lg font-semibold mb-3">Transaction history</h2>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in">Received</TabsTrigger>
                <TabsTrigger value="out">Sent</TabsTrigger>
              </TabsList>
            </div>

            {(['all', 'in', 'out'] as const).map((tab) => {
              const filtered = transactions.filter((t) =>
                tab === 'all'
                  ? true
                  : tab === 'in'
                    ? t.recipient_id === user?.id
                    : t.sender_id === user?.id,
              );
              return (
                <TabsContent key={tab} value={tab} className="mt-2">
                  {txLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </div>
                  ) : (
                    <div>{filtered.map(renderTx)}</div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Wallet;
