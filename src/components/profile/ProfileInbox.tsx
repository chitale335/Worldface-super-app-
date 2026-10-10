import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Lock, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type InboxRow = {
  conversationId: string;
  name: string;
  avatar: string | null;
  lastText: string;
  lastAt: string | null;
  unread: number;
};

/**
 * Owner-only inbox. Data access is enforced by RLS: only conversations
 * where auth.uid() is a participant are ever returned.
 */
export const ProfileInbox = ({ ownerId }: { ownerId: string }) => {
  const { data, isLoading, isError } = useQuery<InboxRow[]>({
    queryKey: ['profile-inbox', ownerId],
    queryFn: async () => {
      const { data: parts, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', ownerId);
      if (error) throw error;
      if (!parts?.length) return [];
      const ids = parts.map((p) => p.conversation_id);

      const { data: others } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', ids)
        .neq('user_id', ownerId);
      const otherIds = [...new Set((others ?? []).map((o) => o.user_id))];
      const { data: profiles } = otherIds.length
        ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', otherIds)
        : { data: [] as any[] };

      const rows = await Promise.all(parts.map(async (p) => {
        const other = others?.find((o) => o.conversation_id === p.conversation_id);
        const prof = profiles?.find((pr: any) => pr.user_id === other?.user_id);
        const [{ data: last }, { count }] = await Promise.all([
          supabase.from('messages').select('content, media_type, created_at')
            .eq('conversation_id', p.conversation_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('messages').select('id', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id).neq('sender_id', ownerId).gt('created_at', p.last_read_at),
        ]);
        return {
          conversationId: p.conversation_id,
          name: prof?.display_name ?? 'User',
          avatar: prof?.avatar_url ?? null,
          lastText: last?.content ?? (last?.media_type ? `📎 ${last.media_type}` : 'Hakuna ujumbe bado'),
          lastAt: last?.created_at ?? null,
          unread: count ?? 0,
        };
      }));
      return rows.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (isError) return <p className="text-center text-destructive py-10 text-sm">Imeshindikana kupakia inbox. Jaribu tena.</p>;

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Inbox yako ni ya faragha — wewe pekee ndiye unayeiona.</p>
      {!data?.length ? (
        <div className="text-center py-10 space-y-3">
          <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bado huna mazungumzo.</p>
          <Button asChild size="sm" variant="outline"><Link to="/people">Tafuta watu</Link></Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {data.map((r) => (
            <li key={r.conversationId}>
              <Link to={`/messages/${r.conversationId}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <Avatar className="h-10 w-10"><AvatarImage src={r.avatar ?? undefined} /><AvatarFallback>{r.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className={`text-sm truncate ${r.unread ? 'font-bold' : 'font-medium'}`}>{r.name}</p>
                    {r.lastAt && <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(r.lastAt), { addSuffix: true })}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.lastText}</p>
                </div>
                {r.unread > 0 && <Badge className="shrink-0">{r.unread}</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
