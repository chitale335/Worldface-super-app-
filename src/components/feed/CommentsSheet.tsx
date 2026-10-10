import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Loader2, Send } from 'lucide-react';
import { formatCount, timeAgo } from '@/lib/feed';
import { useToast } from '@/hooks/use-toast';

interface CommentsSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Comment = {
  id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
};

export const CommentsSheet = ({ postId, open, onOpenChange }: CommentsSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('id, user_id, content, like_count, created_at')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });
      const list = data ?? [];
      const userIds = Array.from(new Set(list.map((c) => c.user_id)));
      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        profilesMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      }
      return list.map((c) => ({ ...c, profile: profilesMap.get(c.user_id) ?? null })) as Comment[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, postId, queryClient]);

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Comment is empty');
      if (trimmed.length > 1000) throw new Error('Comment is too long');
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: user.id, content: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (e: Error) => toast({ title: 'Could not post', description: e.message, variant: 'destructive' }),
  });

  const likeComment = useMutation({
    mutationFn: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (liked) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-center font-heading">
            {formatCount(comments?.length ?? 0)} {comments?.length === 1 ? 'comment' : 'comments'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                onLike={(liked) => likeComment.mutate({ commentId: c.id, liked })}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">No comments yet. Be the first!</p>
          )}
        </div>

        <form
          className="p-3 border-t border-border flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addComment.mutate(text);
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={1000}
          />
          <Button type="submit" size="icon" disabled={addComment.isPending || !text.trim()}>
            {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

const CommentRow = ({ comment, onLike }: { comment: Comment; onLike: (liked: boolean) => void }) => {
  const { user } = useAuth();
  const { data: liked } = useQuery({
    queryKey: ['comment-liked', comment.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const initials =
    comment.profile?.display_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{comment.profile?.display_name ?? 'User'}</span>{' '}
          <span className="text-muted-foreground text-xs">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="text-sm break-words">{comment.content}</p>
      </div>
      <button onClick={() => onLike(!!liked)} className="flex flex-col items-center gap-0.5 shrink-0">
        <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        <span className="text-[10px] text-muted-foreground">{formatCount(comment.like_count)}</span>
      </button>
    </div>
  );
};
