import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AiToolsConnectPanel } from '@/components/ai/AiToolsConnectPanel';
import {
  AI_TOOLS_PROVIDER,
  clearPendingState,
  readPendingState,
  useCompleteAiConnect,
} from '@/hooks/useAiTools';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

/** k-agi-core sends the user back here with the granted token. */
const AiToolsCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const complete = useCompleteAiConnect();
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('Inakamilisha muunganisho...');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = params.get('error') ?? params.get('error_description');
    const token = params.get('token') ?? params.get('access_token') ?? params.get('code');
    const account = params.get('account') ?? params.get('workspace');
    const scopeParam = params.get('scope') ?? params.get('scopes');
    const stateParam = params.get('state');
    const pending = readPendingState();

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('k-agi-core haikutuma token. Jaribu kuunganisha tena.');
      return;
    }

    if (pending?.state && stateParam && pending.state !== stateParam) {
      setStatus('error');
      setMessage('Ombi la muunganisho halikulingana (state mismatch). Jaribu tena.');
      return;
    }

    complete
      .mutateAsync({
        token,
        companyId: pending?.companyId ?? null,
        scopes: scopeParam ? scopeParam.split(/[\s,]+/).filter(Boolean) : [],
        account,
        raw: { provider: AI_TOOLS_PROVIDER, state: stateParam ?? null },
      })
      .then(() => {
        clearPendingState();
        setStatus('done');
        setMessage('AI tools zimeunganishwa kikamilifu.');
      })
      .catch((e: Error) => {
        setStatus('error');
        setMessage(e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-4 lg:p-6 space-y-6">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            {status === 'working' && <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />}
            {status === 'done' && <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />}
            {status === 'error' && <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />}
            <h1 className="text-xl font-heading font-bold">Muunganisho wa AI Tools</h1>
            <p className="text-sm text-muted-foreground break-words">{message}</p>
            <div className="flex justify-center gap-2 pt-1">
              <Button variant="outline" onClick={() => navigate('/profile/company')}>Kampuni zangu</Button>
              <Button variant="ghost" onClick={() => navigate('/')}>Nyumbani</Button>
            </div>
          </CardContent>
        </Card>

        <AiToolsConnectPanel />
      </div>
    </AppLayout>
  );
};

export default AiToolsCallback;
