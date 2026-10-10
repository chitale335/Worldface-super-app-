import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const table = (name: string) => (supabase.from as any)(name);

/** k-agi-core is the external AI tools provider WorldFace connects to. */
export const AI_TOOLS_PROVIDER = 'k-agi-core';
export const AI_TOOLS_CALLBACK_URL = 'https://k-agi-core.lovable.app/callback/worldface';

const STATE_KEY = 'worldface:ai-tools:state';

export interface AiConnection {
  id: string;
  user_id: string;
  company_id: string | null;
  provider: string;
  status: string;
  scopes: string[];
  access_token: string | null;
  external_account: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const isMissingAiConnectionsTable = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  return code === '42P01' || code === 'PGRST205' || (/ai_connections/.test(message) && /does not exist|not find/i.test(message));
};

/** Where k-agi-core should send the user back after authorizing. */
export const aiToolsRedirectUri = () => `${window.location.origin}/ai-tools/callback`;

interface PendingState {
  state: string;
  companyId: string | null;
  redirectUri: string;
}

const rememberState = (payload: PendingState) =>
  sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));

export const readPendingState = (): PendingState | null => {
  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingState;
  } catch {
    return null;
  }
};

export const clearPendingState = () => sessionStorage.removeItem(STATE_KEY);

/** Full connection link: WorldFace sends the user to k-agi-core with our callback. */
export const buildAiToolsConnectUrl = (companyId?: string | null) => {
  const redirectUri = aiToolsRedirectUri();
  const state = crypto.randomUUID();
  rememberState({ state, companyId: companyId ?? null, redirectUri });

  const url = new URL(AI_TOOLS_CALLBACK_URL);
  url.searchParams.set('app', 'worldface');
  url.searchParams.set('client', 'worldface');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  if (companyId) url.searchParams.set('company_id', companyId);
  return url.toString();
};

/** Same destination, opened in a new tab — no token is returned this way. */
export const openAiToolsInNewTab = (companyId?: string | null) => {
  const url = new URL(AI_TOOLS_CALLBACK_URL);
  url.searchParams.set('app', 'worldface');
  if (companyId) url.searchParams.set('company_id', companyId);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
};

/** Kicks off the redirect flow. */
export const startAiToolsRedirect = (companyId?: string | null) => {
  window.location.assign(buildAiToolsConnectUrl(companyId));
};

export const useAiConnections = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-connections', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AiConnection[]> => {
      const { data, error } = await table('ai_connections').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as AiConnection[];
    },
  });
};

/** Stores the token k-agi-core handed back on the callback route. */
export const useCompleteAiConnect = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      companyId?: string | null;
      scopes?: string[];
      account?: string | null;
      expiresAt?: string | null;
      raw?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Ingia kwanza');
      const { error } = await table('ai_connections').upsert(
        {
          user_id: user.id,
          company_id: input.companyId ?? null,
          provider: AI_TOOLS_PROVIDER,
          status: 'connected',
          scopes: input.scopes ?? [],
          access_token: input.token,
          external_account: input.account ?? null,
          expires_at: input.expiresAt ?? null,
          metadata: input.raw ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-connections'] }),
  });
};

export const useDisconnectAi = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Ingia kwanza');
      const { error } = await table('ai_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', AI_TOOLS_PROVIDER);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-connections'] }),
  });
};
