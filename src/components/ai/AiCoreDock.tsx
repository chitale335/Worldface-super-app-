import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Send, Loader2, ShieldCheck, Crown, Brain, Check, X, Link2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { AI_SCOPES, useAiConsents, useAiCore, useIsPremium, type AiModule } from '@/hooks/useAiCore';
import { AiToolsConnectPanel } from '@/components/ai/AiToolsConnectPanel';
import { cn } from '@/lib/utils';

const MODULES: { id: AiModule; label: string }[] = [
  { id: 'core', label: 'Core' },
  { id: 'feed', label: 'Feed' },
  { id: 'chat', label: 'Chat' },
  { id: 'pay', label: 'NexaPay' },
  { id: 'studio', label: 'Studio' },
  { id: 'search', label: 'Search' },
  { id: 'ads', label: 'Ads' },
  { id: 'care', label: 'Care 24/7' },
];

/** Floating AI Core available on every screen. Module-aware, consent-gated, never acts alone. */
export const AiCoreDock = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { consents, setConsent } = useAiConsents();
  const isPremium = useIsPremium();
  const { messages, send, loading, module, setModule, pendingAction, setPendingAction, notice, reset } = useAiCore();

  const submit = () => { const t = input; setInput(''); send(t); };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          aria-label="WorldFace AI"
          className="fixed right-4 bottom-24 lg:bottom-6 z-40 h-14 w-14 rounded-full gradient-primary shadow-glow"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="flex items-center gap-2 font-heading">
            <Sparkles className="h-5 w-5 text-primary" /> WorldFace AI Core
            {isPremium && <Badge className="gap-1 bg-amber-500/15 text-amber-500 border-amber-500/30"><Crown className="h-3 w-3" /> Premium</Badge>}
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Iko kila mahali — lakini haifanyi kitu kwenye akaunti yako bila ruhusa yako.
          </p>
        </SheetHeader>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 grid grid-cols-3">
            <TabsTrigger value="chat">Assistant</TabsTrigger>
            <TabsTrigger value="perm"><ShieldCheck className="h-4 w-4 mr-1" /> Ruhusa</TabsTrigger>
            <TabsTrigger value="tools"><Link2 className="h-4 w-4 mr-1" /> AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {MODULES.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  variant={module === m.id ? 'default' : 'outline'}
                  className={cn('h-7 text-xs shrink-0', m.id === 'care' && !isPremium && 'opacity-60')}
                  onClick={() => setModule(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3 pb-4">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground space-y-2 pt-4">
                    <p className="font-medium text-foreground">Karibu 🧠</p>
                    <p>Niulize kuhusu Feed, Chat, NexaPay, Studio, Search au matangazo. Nitapendekeza hatua, lakini <b>wewe</b> unathibitisha.</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn('rounded-2xl px-3 py-2 text-sm max-w-[90%]',
                    m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted')}>
                    {m.role === 'assistant'
                      ? <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      : m.content}
                  </div>
                ))}
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {notice && <p className="text-xs text-amber-500 bg-amber-500/10 rounded-lg p-2">{notice}</p>}

                {pendingAction && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">AI inapendekeza hatua — inahitaji ruhusa yako:</p>
                    <p className="text-sm font-medium">{pendingAction.label}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { toast.success('Imethibitishwa — endelea kwenye ukurasa husika.'); setPendingAction(null); }}>
                        <Check className="h-4 w-4 mr-1" /> Ruhusu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                        <X className="h-4 w-4 mr-1" /> Kataa
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder="Uliza AI…"
                rows={1}
                className="min-h-[44px] max-h-28 resize-none"
              />
              <Button size="icon" onClick={submit} disabled={!input.trim() || loading}><Send className="h-4 w-4" /></Button>
              {messages.length > 0 && <Button size="icon" variant="ghost" onClick={reset}><X className="h-4 w-4" /></Button>}
            </div>
          </TabsContent>

          <TabsContent value="perm" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 pb-8">
                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground flex gap-2">
                  <Brain className="h-4 w-4 shrink-0 text-primary" />
                  AI haipati data yako yoyote hadi uwashe ruhusa hapa. Unaweza kuzima wakati wowote.
                </div>
                {AI_SCOPES.map((s) => (
                  <div key={s.scope} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <Switch
                      checked={!!consents[s.scope]}
                      onCheckedChange={(v) => { setConsent(s.scope, v); toast.success(v ? 'Ruhusa imewashwa' : 'Ruhusa imezimwa'); }}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full px-4">
              <div className="pb-8">
                <AiToolsConnectPanel />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
