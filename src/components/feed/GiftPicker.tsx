import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import { sendPush } from '@/lib/push';

export type Gift = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
};

export const GIFTS: Gift[] = [
  { id: 'rose', emoji: '🌹', name: 'Rose', cost: 5 },
  { id: 'heart', emoji: '💖', name: 'Heart', cost: 10 },
  { id: 'fire', emoji: '🔥', name: 'Fire', cost: 25 },
  { id: 'star', emoji: '⭐', name: 'Star', cost: 50 },
  { id: 'crown', emoji: '👑', name: 'Crown', cost: 100 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', cost: 250 },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', cost: 500 },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', cost: 1000 },
];

interface GiftPickerProps {
  postId: string;
  creatorName: string;
  creatorId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGiftSent: (gift: Gift) => void;
}

export const GiftPicker = ({ postId, creatorName, creatorId, open, onOpenChange, onGiftSent }: GiftPickerProps) => {
  const { balance } = useWallet();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Gift | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selected) return;
    if (selected.cost > balance) {
      toast({
        title: 'Not enough coins',
        description: `You need ${selected.cost} coins. Top up your wallet.`,
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    const { error } = await supabase.rpc('gift_post', {
      _post_id: postId,
      _amount: selected.cost,
      _note: `Sent a ${selected.name} ${selected.emoji}`,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Gift failed', description: error.message, variant: 'destructive' });
      return;
    }
    onGiftSent(selected);
    if (creatorId) {
      void sendPush({
        event: 'gift',
        recipient_id: creatorId,
        title: `Umepokea zawadi ${selected.emoji}`,
        body: `${selected.name} (${selected.cost} coins) kwenye post yako.`,
        url: '/wallet',
      });
    }
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send a gift to {creatorName}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Coins className="h-4 w-4" />
            Balance: <span className="font-semibold tabular-nums">{balance.toLocaleString()}</span> coins
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {GIFTS.map((g) => {
            const affordable = g.cost <= balance;
            const isSelected = selected?.id === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                disabled={!affordable}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-transparent bg-muted hover:bg-muted/70',
                  !affordable && 'opacity-40 cursor-not-allowed',
                )}
              >
                <span className="text-3xl leading-none">{g.emoji}</span>
                <span className="text-[10px] font-medium">{g.name}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{g.cost}</span>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!selected || sending}
          onClick={handleSend}
        >
          {sending
            ? 'Sending…'
            : selected
              ? `Send ${selected.emoji} for ${selected.cost} coins`
              : 'Pick a gift'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
