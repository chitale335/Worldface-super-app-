import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PayoutSummary {
  total_earned: number;
  available: number;
  pending: number;
  withdrawn: number;
}

export interface RevenueLog {
  id: string;
  source: string;
  amount: number;
  currency: string;
  country: string | null;
  occurred_at: string;
}

export interface PayoutMethod {
  id: string;
  type: string;
  label: string | null;
  details: Record<string, unknown>;
  currency: string;
  is_default: boolean;
  verified: boolean;
}

export const usePayoutSummary = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payout-summary', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PayoutSummary> => {
      const { data, error } = await supabase.rpc('payout_summary');
      if (error) throw error;
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        total_earned: Number(raw.total_earned ?? 0),
        available: Number(raw.available ?? 0),
        pending: Number(raw.pending ?? 0),
        withdrawn: Number(raw.withdrawn ?? 0),
      };
    },
  });
};

export const useRevenueLogs = (days = 30) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['revenue-logs', user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<RevenueLog[]> => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await supabase
        .from('creator_revenue_logs')
        .select('id, source, amount, currency, country, occurred_at')
        .eq('user_id', user!.id)
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as RevenueLog[];
    },
  });
};

export const usePayoutMethods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payout-methods', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PayoutMethod[]> => {
      const { data, error } = await supabase
        .from('payout_methods')
        .select('id, type, label, details, currency, is_default, verified')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PayoutMethod[];
    },
  });
};

export const usePayoutRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payout-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('id, amount, currency, status, created_at, processed_at, method_id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const formatMoney = (amount: number, currency = 'KES') =>
  `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
