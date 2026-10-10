import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useToggleLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (liked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
};

export const useToggleBookmark = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ postId, bookmarked }: { postId: string; bookmarked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (bookmarked) {
        const { error } = await supabase.from('post_bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_bookmarks').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({ title: vars.bookmarked ? 'Removed from saved' : 'Saved' });
    },
  });
};

export const useSharePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const url = `${window.location.origin}/post/${postId}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'WorldFace post', url });
        } else {
          await navigator.clipboard.writeText(url);
          toast({ title: 'Link copied to clipboard' });
        }
      } catch {
        // user cancelled
      }
      await supabase.from('post_shares').insert({ post_id: postId, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useToggleFollow = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId, following }: { targetUserId: string; following: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });
};
