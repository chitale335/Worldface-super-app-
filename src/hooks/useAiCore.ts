import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AiModule = 'core' | 'feed' | 'chat' | 'pay' | 'studio' | 'search' | 'ads' | 'care';
export type AiMsg = { role: 'user' | 'assistant'; content: string };

export type AiActionProposal = { action: string; label: string; payload: Record<string, unknown> };

export const AI_SCOPES: { scope: string; label: string; description: string }[] = [
  { scope: 'memory', label: 'Kumbukumbu (Memory)', description: 'Ruhusu AI ikumbuke mapendeleo yako kati ya mazungumzo.' },
  { scope: 'feed_context', label: 'Feed', description: 'Isaidie na machapisho, hashtags na maudhui yako.' },
  { scope: 'chat_context', label: 'Chat', description: 'Isaidie kuandika majibu na kutafsiri ujumbe.' },
  { scope: 'wallet_context', label: 'NexaPay', description: 'Ieleze salio, coins na payouts. Haiwezi kutuma pesa.' },
  { scope: 'studio_context', label: 'Studio', description: 'Isaidie na video, thumbnails na script.' },
  { scope: 'ads_context', label: 'Matangazo', description: 'Ishauri bajeti, CPM na ufikiaji wa tangazo lako.' },
  { scope: 'care_context', label: 'Customer Care', description: 'Msaada wa 24/7 kwa watumiaji wa Premium.' },
  { scope: 'personalized_ads', label: 'Matangazo yaliyobinafsishwa', description: 'Onyesha matangazo yanayolingana na matumizi yako.' },
];

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-core`;

export function moduleForPath(pathname: string): AiModule {
  if (pathname.startsWith('/messages')) return 'chat';
  if (pathname.startsWith('/wallet') || pathname.startsWith('/payouts') || pathname.startsWith('/payments')) return 'pay';
  if (pathname.startsWith('/studio') || pathname.startsWith('/live')) return 'studio';
  if (pathname.startsWith('/explore') || pathname.startsWith('/people') || pathname.startsWith('/appstore')) return 'search';
  if (pathname.startsWith('/ads')) return 'ads';
  if (pathname === '/' || pathname.startsWith('/create') || pathname.startsWith('/tag')) return 'feed';
  return 'core';
}

/** User permissions for AI. Nothing is on by default — AI has no control until granted. */
export function useAiConsents() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: consents = [] } = useQuery({
    queryKey: ['ai-consents', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('ai_consents').select('scope, granted').eq('user_id', user!.id);
      return data ?? [];
    },
  });

  const map = useMemo(() => {
    const m: Record<string, boolean> = {};
    consents.forEach((c) => { m[c.scope] = c.granted; });
    return m;
  }, [consents]);

  const setConsent = useCallback(async (scope: string, granted: boolean) => {
    if (!user) return;
    await supabase.from('ai_consents')
      .upsert({ user_id: user.id, scope, granted, updated_at: new Date().toISOString() }, { onConflict: 'user_id,scope' });
    qc.invalidateQueries({ queryKey: ['ai-consents', user.id] });
  }, [user, qc]);

  return { consents: map, setConsent };
}

export function useIsPremium() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['is-premium', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('profiles')
        .select('is_premium, premium_until').eq('user_id', user!.id).maybeSingle();
      if (!data?.is_premium) return false;
      return !data.premium_until || new Date(data.premium_until) > new Date();
    },
  });
  return !!data;
}

const ACTION_RE = /\[\[ACTION\]\]\s*(\{[\s\S]*?\})/;

export function extractAction(text: string): { clean: string; action: AiActionProposal | null } {
  const m = text.match(ACTION_RE);
  if (!m) return { clean: text, action: null };
  try {
    const parsed = JSON.parse(m[1]);
    return {
      clean: text.replace(m[0], '').trim(),
      action: { action: String(parsed.action ?? 'unknown'), label: String(parsed.label ?? parsed.action ?? 'Action'), payload: parsed.payload ?? {} },
    };
  } catch {
    return { clean: text.replace(m[0], '').trim(), action: null };
  }
}

export function useAiCore(initialModule?: AiModule) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AiActionProposal | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [module, setModule] = useState<AiModule>(initialModule ?? moduleForPath(pathname));

  const send = useCallback(async (text: string, language: 'en' | 'sw' = 'en') => {
    const content = text.trim();
    if (!content || loading) return;
    setNotice(null);
    setPendingAction(null);
    const next: AiMsg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Ingia kwanza / please sign in');

      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, module, language }),
      });

      const ctype = resp.headers.get('Content-Type') ?? '';
      if (!resp.ok || ctype.includes('application/json')) {
        const j = await resp.json().catch(() => ({ error: 'Request failed' }));
        setNotice(j.message ?? j.error ?? `Error ${resp.status}`);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      let buf = '';
      setMessages((p) => [...p, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              const { clean } = extractAction(acc);
              setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: clean } : m)));
            }
          } catch { /* partial chunk */ }
        }
      }

      const { action } = extractAction(acc);
      if (action && user) {
        setPendingAction(action);
        await supabase.from('ai_action_requests').insert({
          user_id: user.id, module, action: action.action, payload: action.payload as never, status: 'pending',
        });
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, module, user]);

  const reset = useCallback(() => { setMessages([]); setPendingAction(null); setNotice(null); }, []);

  return { messages, send, loading, module, setModule, pendingAction, setPendingAction, notice, reset };
}
