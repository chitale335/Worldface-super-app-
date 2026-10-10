import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Coins, CreditCard, Crown, Sparkles, Zap, Gift, ArrowRight, Copy, Check } from "lucide-react";

const coinPackages = [
  { coins: 100, price: 1, color: "from-violet-600 to-purple-700", icon: Coins, popular: false },
  { coins: 500, price: 5, color: "from-amber-500 to-orange-600", icon: Zap, popular: true },
  { coins: 1000, price: 10, color: "from-cyan-500 to-blue-600", icon: Sparkles, popular: false },
  { coins: 5000, price: 45, color: "from-emerald-500 to-green-600", icon: Gift, popular: false },
];

export default function Payments() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [payAmount, setPayAmount] = useState("");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wallet_accounts")
      .select("account_number")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setAccountNumber(data?.account_number ?? null));
  }, [user]);

  const copyAccount = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("NexaPay ID copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBuyCoins = (coins: number, price: number) => {
    toast.info(`Purchase ${coins} coins for $${price}`, {
      description: "Payment integration coming soon!",
    });
  };

  const handlePayNow = async () => {
    if (!payAmount || !recipientUsername) {
      toast.error("Enter both recipient and amount");
      return;
    }
    setSending(true);
    try {
      const { data: recipient } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", recipientUsername.replace("@", ""))
        .maybeSingle();

      if (!recipient) {
        toast.error("User not found");
        return;
      }

      const { error } = await supabase.rpc("transfer_coins", {
        _recipient_id: recipient.user_id,
        _amount: Number(payAmount),
        _note: "Direct payment",
      });

      if (error) throw error;
      toast.success(`Sent ${payAmount} coins to @${recipientUsername}`);
      setPayAmount("");
      setRecipientUsername("");
    } catch (e: any) {
      toast.error(e.message || "Transfer failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading bg-gradient-to-r from-emerald-400 via-blue-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              NexaPay
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Pay Anywhere. Send Everywhere.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-300">{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* NexaPay ID Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden border-0 rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-600 via-violet-600 to-amber-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
            <CardContent className="relative p-5 md:p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] opacity-80">NexaPay Account</span>
                <CreditCard className="w-5 h-5 opacity-90" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xl md:text-3xl font-mono font-bold tracking-wider">
                  {accountNumber ?? "NX-••••••••"}
                </span>
                <button
                  onClick={copyAccount}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors backdrop-blur"
                  aria-label="Copy NexaPay ID"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase opacity-70">Balance</p>
                  <p className="text-2xl font-bold">{balance.toLocaleString()} <span className="text-sm font-normal opacity-80">coins</span></p>
                </div>
                <p className="text-[10px] opacity-70 text-right">Worldface • Pay Anywhere</p>
              </div>
            </CardContent>
          </Card>
          <p role="status" aria-live="polite" className="sr-only">
            {copied ? "NexaPay ID imenakiliwa kwenye clipboard" : ""}
          </p>
        </motion.div>

        {/* Subscription Plans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold font-heading">Subscription Plans</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-card/80 border border-border/50 rounded-2xl hover:border-primary/40 transition-colors">
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold">Monthly</h3>
                      <p className="text-3xl font-bold mt-2">
                        $10<span className="text-sm text-muted-foreground font-normal"> / month</span>
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <li>✦ Verified badge</li>
                        <li>✦ Priority support</li>
                        <li>✦ 200 bonus coins/mo</li>
                      </ul>
                      <Button className="mt-4 w-full" variant="outline" onClick={() => toast.info("Coming soon!")}>
                        Subscribe
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-amber-500 text-xs font-bold px-2 py-0.5 rounded-full text-black">
                      SAVE 17%
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold">Yearly</h3>
                      <p className="text-3xl font-bold mt-2 text-amber-400">
                        $100<span className="text-sm text-amber-300/70 font-normal"> / year</span>
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <li>✦ Everything in Monthly</li>
                        <li>✦ 500 bonus coins/mo</li>
                        <li>✦ Exclusive badge</li>
                      </ul>
                      <Button
                        className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold"
                        onClick={() => toast.info("Coming soon!")}
                      >
                        Subscribe & Save
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Buy Coins */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-card via-card to-violet-500/5 border-violet-500/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <h2 className="text-xl font-bold font-heading">Buy Coins</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {coinPackages.map((pkg, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Card
                      className={`bg-gradient-to-br ${pkg.color} rounded-2xl border-0 cursor-pointer relative overflow-hidden`}
                      onClick={() => handleBuyCoins(pkg.coins, pkg.price)}
                    >
                      {pkg.popular && (
                        <div className="absolute top-2 right-2 bg-white/20 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full">
                          POPULAR
                        </div>
                      )}
                      <CardContent className="p-4 text-center text-white">
                        <pkg.icon className="w-8 h-8 mx-auto mb-2 opacity-90" />
                        <h3 className="text-xl font-bold">{pkg.coins.toLocaleString()}</h3>
                        <p className="text-white/70 text-sm">coins</p>
                        <div className="mt-3 bg-white/20 backdrop-blur rounded-xl py-2 font-bold text-sm">
                          ${pkg.price}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pay Now */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-card via-card to-emerald-500/5 border-emerald-500/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold font-heading">Send Payment</h2>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="@username"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
                <Input
                  type="number"
                  placeholder="Amount in coins"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold"
                  onClick={handlePayNow}
                  disabled={sending || !payAmount || !recipientUsername}
                >
                  {sending ? "Sending..." : "Send Now"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
