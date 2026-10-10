import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

type Purpose = 'payout_request' | 'method_change';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  purpose: Purpose;
  params: Record<string, unknown>;
  onVerified: () => void;
}

export const PayoutOtpDialog = ({ open, onOpenChange, purpose, params, onVerified }: Props) => {
  const [step, setStep] = useState<'idle' | 'sent'>('idle');
  const [loading, setLoading] = useState(false);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  const reset = () => {
    setStep('idle'); setOtpId(null); setCode(''); setFallback(null); setDestination(null);
  };

  const start = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('payout-otp', {
      body: { action: 'start', purpose, ...params },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? 'Imeshindikana kutuma OTP');
      return;
    }
    const res = data as { otp_id: string; destination: string | null; fallback_code: string | null };
    setOtpId(res.otp_id);
    setDestination(res.destination);
    setFallback(res.fallback_code);
    setStep('sent');
  };

  const confirm = async () => {
    if (!otpId) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('payout-otp', {
      body: { action: 'confirm', otp_id: otpId, code },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? 'OTP si sahihi');
      return;
    }
    toast.success('Imethibitishwa kikamilifu');
    reset();
    onOpenChange(false);
    onVerified();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Uthibitisho wa OTP
          </DialogTitle>
          <DialogDescription>
            {purpose === 'payout_request'
              ? 'Thibitisha ombi lako la malipo kwa msimbo wa mara moja.'
              : 'Thibitisha mabadiliko ya njia ya malipo kwa msimbo wa mara moja.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'idle' ? (
          <p className="text-sm text-muted-foreground">
            Tutatuma msimbo wa tarakimu 6 kwenye namba ya simu iliyosajiliwa kwenye profile yako.
          </p>
        ) : (
          <div className="space-y-3">
            {destination && (
              <p className="text-sm text-muted-foreground">Msimbo umetumwa kwa {destination}.</p>
            )}
            {fallback && (
              <Alert>
                <AlertDescription className="text-sm">
                  Hakuna kituo cha SMS kilichounganishwa bado. Msimbo wako wa mara moja:{' '}
                  <span className="font-mono font-bold tracking-widest">{fallback}</span>
                </AlertDescription>
              </Alert>
            )}
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl font-mono tracking-[0.5em]"
            />
            <button type="button" onClick={start} className="text-xs text-primary underline">
              Tuma msimbo mpya
            </button>
          </div>
        )}

        <DialogFooter>
          {step === 'idle' ? (
            <Button onClick={start} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tuma OTP
            </Button>
          ) : (
            <Button onClick={confirm} disabled={loading || code.length !== 6}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Thibitisha
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
