import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { EARNINGS_TYPES } from '@/hooks/useCommunityEarnings';
import {
  PLAN_STATUSES, PLAN_TYPES, useCreateCommunityPlan,
  type PlanStatus, type PlanType,
} from '@/hooks/useCommunityPlans';

interface Props {
  communityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Create a community plan. Paid plans require accepting the Terms & Conditions. */
export const PlanFormDialog = ({ communityId, open, onOpenChange }: Props) => {
  const create = useCreateCommunityPlan();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [planType, setPlanType] = useState<PlanType>('event');
  const [status, setStatus] = useState<PlanStatus>('planned');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [earningsType, setEarningsType] = useState('event_tickets');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setPlanType('event'); setStatus('planned');
    setLocation(''); setStartsAt(''); setEndsAt(''); setIsPaid(false);
    setTicketPrice(''); setCurrency('KES'); setEarningsType('event_tickets'); setTermsAccepted(false);
  };

  const submit = async () => {
    if (title.trim().length < 2) { toast.error('Weka jina la mpango'); return; }
    if (isPaid && !(Number(ticketPrice) >= 0)) { toast.error('Weka bei sahihi'); return; }
    if (isPaid && !termsAccepted) { toast.error('Kubali Terms & Conditions kwa mpango wa kulipia'); return; }
    try {
      await create.mutateAsync({
        communityId,
        title,
        description,
        planType,
        status,
        location,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        isPaid,
        ticketPrice: Number(ticketPrice || 0),
        currency,
        earningsType: isPaid ? earningsType : null,
        termsAccepted,
      });
      toast.success('Mpango umeundwa');
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mpango mpya</DialogTitle>
          <DialogDescription>Panga tukio, mkutano au mradi wa jamii.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-title">Jina</Label>
            <Input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mfano: Mkutano wa wanachama" maxLength={140} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-desc">Maelezo</Label>
            <Textarea id="plan-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lengo la mpango…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Aina</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as PlanType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hali</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-loc">Mahali</Label>
            <Input id="plan-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mfano: Nairobi / Mtandaoni" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start">Kuanza</Label>
              <Input id="plan-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-end">Kumaliza</Label>
              <Input id="plan-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <Checkbox id="plan-paid" checked={isPaid} onCheckedChange={(v) => setIsPaid(v === true)} />
            <Label htmlFor="plan-paid" className="cursor-pointer text-sm">
              Mpango wa kulipia (unarecord mapato kwenye mfumo wa earnings)
            </Label>
          </div>

          {isPaid && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-price">Bei kwa mtu</Label>
                  <Input id="plan-price" type="number" min="0" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-currency">Sarafu</Label>
                  <Input id="plan-currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={6} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Kategoria ya mapato</Label>
                <Select value={earningsType} onValueChange={setEarningsType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EARNINGS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="plan-terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="mt-0.5" />
                <Label htmlFor="plan-terms" className="text-xs font-normal leading-relaxed cursor-pointer">
                  Nakubali <Link to="/terms" className="text-primary underline">Terms &amp; Conditions</Link> na{' '}
                  <Link to="/privacy" className="text-primary underline">Privacy Policy</Link> kwa kukusanya malipo kupitia jamii hii.
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Ghairi</Button>
          <Button className="gradient-primary text-white" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Unda mpango
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
