import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const xpForLevel = (level: number) => 50 * (level - 1) ** 2;
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;

export const useCreatorStats = (userId?: string) => {
  return useQuery({
    queryKey: ['creator-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('creator_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return (
        data ?? {
          xp: 0,
          level: 1,
          total_coins_received: 0,
          total_likes_received: 0,
        }
      );
    },
    enabled: !!userId,
  });
};

export const useUserBadges = (userId?: string) => {
  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('user_badges')
        .select('earned_at, badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
};

export const useAllBadges = () => {
  return useQuery({
    queryKey: ['badges-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });
      return data ?? [];
    },
  });
};

export const useLeaderboard = (sort: 'coins' | 'xp' = 'coins', limit = 50) => {
  return useQuery({
    queryKey: ['leaderboard', sort, limit],
    queryFn: async () => {
      const orderCol = sort === 'coins' ? 'total_coins_received' : 'xp';
      const { data: stats } = await supabase
        .from('creator_stats')
        .select('*')
        .order(orderCol, { ascending: false })
        .limit(limit);
      if (!stats || stats.length === 0) return [];
      const ids = stats.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return stats.map((s) => ({ ...s, profile: profileMap.get(s.user_id) ?? null }));
    },
  });
};

export const useMyRewards = () => {
  const { user } = useAuth();
  const stats = useCreatorStats(user?.id);
  const badges = useUserBadges(user?.id);
  return { stats, badges };
};
