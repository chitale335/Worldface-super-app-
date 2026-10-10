import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AI_TOOLS_CALLBACK_URL,
  AI_TOOLS_PROVIDER,
  isMissingAiConnectionsTable,
  openAiToolsInNewTab,
  startAiToolsRedirect,
  useAiConnections,
  useDisconnectAi,
} from '@/hooks/useAiTools';
import { cn } from '@/lib/utils';
import { CheckCircle2, ExternalLink, Link2, Link2Off, Loader2, Sparkles } from 'lucide-react';

interface Props {
  companyId?: string | null;
  className?: string;
}

/**
 * Connect WorldFace to the k-agi-core AI tools.
 * Primary action: redirect to k-agi-core and come back with a token.
 * Secondary action: open the same destination in a new tab.
 */
export const AiToolsConnectPanel = ({ companyId, className }: Props) => {
  const { data: connections, isLoading, error } = useAiConnections();
  const disconnect = useDisconnectAi();

  const connection = (connections ?? []).find((c) => c.provider === AI_TOOLS_PROVIDER);
  const tableMissing = !!error && isMissingAiConnectionsTable(error);

  const connected = !!connection;
  const connectedAt = connection?.created_at
    ? new Date(connection.created_at).toLocaleString()
    : null;

  return (
    <Card className={cn('glass-card', className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold">AI Tools</h3>
              {connected ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Imeunganishwa
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Haijaunganishwa</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unganisha zana za AI kutoka k-agi-core kwa akaunti yako na kila kampuni.
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/80 break-all mt-1">{AI_TOOLS_CALLBACK_URL}</p>
          </div>
        </div>

        {tableMissing ? (
          <p className="text-xs text-amber-600 bg-amber-500/10 rounded-lg p-2">
            Muunganisho wa AI haujawashwa kwenye database bado. Tumia migration{' '}
            <span className="font-mono">supabase/migrations/20261001130000_company_profiles.sql</span>.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : connected ? (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              {connection?.external_account && <p>Akaunti: <span className="text-foreground">{connection.external_account}</span></p>}
              {connectedAt && <p>Imeunganishwa: <span className="text-foreground">{connectedAt}</span></p>}
              {!!connection?.scopes?.length && <p>Ruhusa: <span className="text-foreground">{connection.scopes.join(', ')}</span></p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => openAiToolsInNewTab(companyId)}>
                <ExternalLink className="h-4 w-4 mr-1.5" /> Fungua k-agi-core
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate()}
              >
                {disconnect.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Link2Off className="h-4 w-4 mr-1.5" />}
                Ondoa muunganisho
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gradient-primary text-white" onClick={() => startAiToolsRedirect(companyId)}>
              <Link2 className="h-4 w-4 mr-1.5" /> Unganisha AI Tools
            </Button>
            <Button size="sm" variant="outline" onClick={() => openAiToolsInNewTab(companyId)}>
              <ExternalLink className="h-4 w-4 mr-1.5" /> Fungua k-agi-core
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
