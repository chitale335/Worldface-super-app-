import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCompany } from '@/hooks/useCompanies';
import { COMPANY_KINDS, COMPANY_TOOLS, TOOL_CATEGORIES, toolsForKind, type CompanyKind } from '@/lib/companyTools';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'EUR', 'GBP'];

/** Template scaffold the user fills in for their company. */
export const templateScaffold = (kind: CompanyKind) => {
  switch (kind) {
    case 'creator':
      return 'Jina la brand:\nNinachounda:\nHadhira yangu:\nMapato ninayolenga:';
    case 'development':
      return 'Jina la studio:\nAina ya apps:\nTech stack:\nWatumiaji/wateja:';
    case 'enterprise':
      return 'Jina la kampuni:\nSekta:\nIdara/timu:\nMalengo ya mwaka:';
    default:
      return 'Jina la biashara:\nBidhaa/huduma:\nWateja wangu:\nMauzo ya lengo:';
  }
};

const STEPS = ['Aina ya kampuni', 'Jaza template', 'Washa tools'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (companyId: string) => void;
}

export const CompanySetupWizard = ({ open, onOpenChange, onCreated }: Props) => {
  const createCompany = useCreateCompany();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<CompanyKind>('business');
  const [form, setForm] = useState({
    name: '',
    industry: '',
    brief: templateScaffold('business'),
    website: '',
    country: '',
    currency: 'USD',
    team_size: '',
  });
  const [tools, setTools] = useState<string[]>(toolsForKind('business'));
  const [terms, setTerms] = useState(false);

  const reset = () => {
    setStep(0);
    setKind('business');
    setForm({ name: '', industry: '', brief: templateScaffold('business'), website: '', country: '', currency: 'USD', team_size: '' });
    setTools(toolsForKind('business'));
    setTerms(false);
  };

  const pickKind = (value: CompanyKind) => {
    setKind(value);
    setTools(toolsForKind(value));
    setForm((f) => ({ ...f, brief: templateScaffold(value) }));
  };

  const toggleTool = (key: string) =>
    setTools((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const canContinue = step === 0 ? true : step === 1 ? form.name.trim().length > 1 : terms && tools.length > 0;

  const submit = async () => {
    try {
      const company = await createCompany.mutateAsync({ ...form, kind, tools });
      toast.success(`${company.name} imefunguliwa — tools ${tools.length} zimewashwa`);
      onCreated?.(company.id);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Fungua Kampuni / Biashara</DialogTitle>
          <DialogDescription>{STEPS[step]}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <span className={cn('w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0',
                i <= step ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground')}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn('text-xs truncate', i === step ? 'text-foreground font-medium' : 'text-muted-foreground')}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — kind */}
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {COMPANY_KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => pickKind(k.value)}
                className={cn('text-left rounded-xl border p-4 transition',
                  kind === k.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40')}
              >
                <p className="font-medium">{k.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.blurb}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">
                  {k.value === 'enterprise' ? 'Tools zote' : `${toolsForKind(k.value).length} tools`}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — template */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jina la kampuni *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mf. WorldFace Studio" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Template ya kampuni</Label>
              <Textarea rows={6} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} className="font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground">Jaza template hii — inahifadhiwa na kampuni yako.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sekta</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="mf. Music, Retail" maxLength={60} />
              </div>
              <div className="space-y-2">
                <Label>Ukubwa wa timu</Label>
                <Input value={form.team_size} onChange={(e) => setForm({ ...form, team_size: e.target.value })} placeholder="mf. 1-10" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label>Nchi</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="mf. Kenya" maxLength={60} />
              </div>
              <div className="space-y-2">
                <Label>Sarafu</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — tools */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chagua tools zitakazowashwa kwa <span className="text-foreground font-medium">{form.name || 'kampuni yako'}</span>.
            </p>
            {TOOL_CATEGORIES.map((cat) => {
              const catTools = COMPANY_TOOLS.filter((t) => t.category === cat.value);
              return (
                <div key={cat.value} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {catTools.map((tool) => {
                      const checked = tools.includes(tool.key);
                      return (
                        <label key={tool.key} className={cn('flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm',
                          checked ? 'border-primary/50 bg-primary/5' : 'border-border')}>
                          <Checkbox checked={checked} onCheckedChange={() => toggleTool(tool.key)} />
                          <span className="truncate">{tool.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
              <span>
                Nimekubali <span className="text-foreground">masharti ya matumizi</span> na sera za kampuni za WorldFace.
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Nyuma
          </Button>
          {step < 2 ? (
            <Button className="gradient-primary text-white" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Endelea <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button className="gradient-primary text-white" disabled={!canContinue || createCompany.isPending} onClick={submit}>
              {createCompany.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Rocket className="h-4 w-4 mr-1.5" />}
              Washa tools
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
