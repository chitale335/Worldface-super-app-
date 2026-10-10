import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Users, Share2, Copy, Lock, Loader2, Heart, MessageCircle, Pin, Megaphone, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('communities').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const communityId = community?.id;

  const { data: membership } = useQuery({
    queryKey: ['community-membership', communityId, user?.id],
    queryFn: async () => {
      if (!user || !communityId) return null;
      const { data } = await (supabase.from as any)('community_members')
        .select('role,status').eq('community_id', communityId).eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!communityId && !!user,
  });

  const isMember = membership?.status === 'active';
  const isStaff = ['owner', 'admin', 'moderator'].includes(membership?.role ?? '');

  const { data: posts } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('community_posts')
        .select('*, profiles!community_posts_user_id_fkey(display_name,avatar_url,username)')
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error && error.code !== 'PGRST200') throw error;
      // Fallback without join
      if (!data) {
        const { data: raw } = await (supabase.from as any)('community_posts')
          .select('*').eq('community_id', communityId).order('created_at', { ascending: false }).limit(50);
        return raw ?? [];
      }
      return data;
    },
    enabled: !!communityId,
  });

  const join = useMutation({
    mutationFn: async () => {
      if (!user || !communityId) throw new Error('Sign in first');
      if (community.type === 'private' || community.type === 'secret') {
        const { error } = await (supabase.from as any)('community_join_requests').insert({ community_id: communityId, user_id: user.id });
        if (error) throw error;
        return { requested: true };
      }
      const { error } = await (supabase.from as any)('community_members').insert({ community_id: communityId, user_id: user.id, role: 'member' });
      if (error) throw error;
      return { requested: false };
    },
    onSuccess: (r) => {
      toast({ title: r.requested ? 'Request sent' : 'Joined community 🎉' });
      qc.invalidateQueries({ queryKey: ['community-membership', communityId] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const leave = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('community_members')
        .delete().eq('community_id', communityId).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'You left the community' });
      qc.invalidateQueries({ queryKey: ['community-membership', communityId] });
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('community_posts').insert({
        community_id: communityId, user_id: user!.id, content: draft.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setDraft(''); qc.invalidateQueries({ queryKey: ['community-posts', communityId] }); },
    onError: (e: Error) => toast({ title: 'Post failed', description: e.message, variant: 'destructive' }),
  });

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${slug}` : '';
  const doShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: community.name, text: community.description ?? '', url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast({ title: 'Link copied' }); }
    } catch {}
  };
  const doCopy = async () => { await navigator.clipboard.writeText(shareUrl); toast({ title: 'Link copied' }); };

  if (isLoading) {
    return <AppLayout><div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div></AppLayout>;
  }

  if (!community) {
    return <AppLayout><div className="p-8 text-center space-y-3">
      <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
      <p>This community is private or does not exist.</p>
      <Button asChild variant="outline"><Link to="/communities">Browse communities</Link></Button>
    </div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-8">
        {/* Cover */}
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary/40 to-violet/30">
          {community.cover_url && <img src={community.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="px-4 -mt-10 relative">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={community.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{community.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-heading font-bold truncate">{community.name}</h1>
                {community.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="capitalize">{community.type.replace('_', ' ')}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{community.member_count} members</span>
                {community.category && <><span>•</span><span>{community.category}</span></>}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-3">{community.description}</p>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {isMember ? (
              community.owner_id !== user?.id && (
                <Button size="sm" variant="outline" onClick={() => leave.mutate()}>
                  <LogOut className="h-4 w-4 mr-1.5" /> Leave
                </Button>
              )
            ) : (
              <Button size="sm" className="gradient-primary text-white" onClick={() => join.mutate()} disabled={join.isPending}>
                {join.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {community.type === 'private' || community.type === 'secret' ? 'Request to join' : 'Join'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={doShare}><Share2 className="h-4 w-4 mr-1.5" /> Share</Button>
            <Button size="sm" variant="outline" onClick={doCopy}><Copy className="h-4 w-4 mr-1.5" /> Copy link</Button>
          </div>
        </div>

        {/* Composer */}
        {isMember && (
          <div className="px-4 mt-6">
            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Share with ${community.name}…`} />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => createPost.mutate()} disabled={!draft.trim() || createPost.isPending} className="gradient-primary text-white">
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 mt-4 space-y-3">
          {posts && posts.length > 0 ? posts.map((p: any) => {
            const profile = p.profiles;
            return (
              <article key={p.id} className={cn('rounded-2xl border p-4 bg-card', p.is_pinned && 'border-primary/50', p.is_announcement && 'bg-primary/5')}>
                <header className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback>{profile?.display_name?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{profile?.display_name ?? 'Member'}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                    {p.is_pinned && <Pin className="h-4 w-4" />}
                    {p.is_announcement && <Megaphone className="h-4 w-4" />}
                  </div>
                </header>
                {p.content && <p className="text-sm whitespace-pre-wrap break-words">{p.content}</p>}
                <footer className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.like_count}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.comment_count}</span>
                </footer>
              </article>
            );
          }) : (
            <p className="text-center text-sm text-muted-foreground py-10">
              {isMember ? 'Be the first to post here.' : 'Join to see and share posts.'}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
