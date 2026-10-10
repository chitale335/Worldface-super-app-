import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Total number of unread direct messages across all conversations
 * the user participates in. Updates in real-time.
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);
      if (!parts?.length) return 0;

      let total = 0;
      await Promise.all(
        parts.map(async (p) => {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id)
            .neq('sender_id', user.id)
            .gt('created_at', p.last_read_at);
          total += count ?? 0;
        })
      );
      return total;
    },
    enabled: !!user,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`unread-msgs-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] })
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, queryClient]);

  return query.data ?? 0;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}
