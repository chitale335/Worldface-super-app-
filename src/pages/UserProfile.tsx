import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, Bookmark, MessageCircle, Grid3x3, Phone, Video } from 'lucide-react';
import { formatCount } from '@/lib/feed';
import { useToggleFollow } from '@/hooks/usePostActions';
import { useCall } from '@/contexts/CallContext';
import { SocialLinksDisplay } from '@/components/profile/SocialLinksDisplay';
import { UserProfileSEO } from '@/components/seo/UserProfileSEO';
import { VerifiedBadge } from '@/components/profile/VerifiedBadge';
import { ProfessionalBadgesDisplay } from '@/components/profile/ProfessionalBadges';
import { ProfileGallery } from '@/components/profile/ProfileGallery';
import { ProfileStories } from '@/components/profile/ProfileStories';
import { FeaturedSongPlayer } from '@/components/profile/FeaturedSongPlayer';

const UserProfile = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const isMe = user?.id === id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-page', id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', id],
    queryFn: async () => {
      const [followers, following, posts] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', id),
      ]);
      return { followers: followers.count ?? 0, following: following.count ?? 0, posts: posts.count ?? 0 };
    },
  });

  const { data: amFollowing } = useQuery({
    queryKey: ['follows', id, user?.id],
    queryFn: async () => {
      if (!user || isMe) return false;
      const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !isMe,
  });

  const { data: posts } = useQuery({
    queryKey: ['user-posts', id],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('id, type, caption, media_url, like_count').eq('user_id', id).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ['my-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('post_bookmarks').select('post_id, posts(id, type, caption, media_url, like_count)').eq('user_id', user.id).order('created_at', { ascending: false });
      return (data ?? []).map((b) => b.posts).filter(Boolean) as Array<{ id: string; type: string; caption: string | null; media_url: string | null; like_count: number }>;
    },
    enabled: isMe,
  });

  const toggleFollow = useToggleFollow();
  const { startCall } = useCall();

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!profile) {
    return <AppLayout><div className="text-center py-12 text-muted-foreground">User not found</div></AppLayout>;
  }

  const initials = profile.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const PostGrid = ({ items }: { items: Array<{ id: string; type: string; caption: string | null; media_url: string | null; like_count: number }> | undefined }) => (
    items && items.length > 0 ? (
      <div className="grid grid-cols-3 gap-1">
        {items.map((p) => (
          <Link key={p.id} to="/" className="relative aspect-[9/16] bg-muted rounded overflow-hidden">
            {p.type === 'video' && p.media_url ? (
              <video src={p.media_url} className="w-full h-full object-cover" muted playsInline />
            ) : p.type === 'image' && p.media_url ? (
              <img src={p.media_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 p-2">
                <p className="text-xs font-semibold line-clamp-6 text-center">{p.caption}</p>
              </div>
            )}
            <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs font-semibold drop-shadow">
              <Play className="h-3 w-3 fill-white" /> {formatCount(p.like_count)}
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-center text-muted-foreground py-12">No posts yet</p>
    )
  );

  return (
    <AppLayout>
      <UserProfileSEO
        displayName={profile.display_name ?? 'User'}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        username={(profile as any)?.username}
      />

      <div className="max-w-3xl mx-auto pb-6 space-y-6">
        {/* Cover */}
        <div className="relative h-40 sm:h-56 overflow-hidden sm:rounded-b-2xl">
          {(profile as any)?.cover_url ? (
            <img src={(profile as any).cover_url} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/40 via-blue-600/30 to-slate-900" />
          )}
        </div>

        <div className="flex flex-col items-center text-center gap-3 px-4 -mt-14">
          <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/20 shadow-lg">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="inline-flex items-center gap-1.5">
              <h1 className="text-xl font-heading font-bold">{profile.display_name ?? 'User'}</h1>
              {(profile as any)?.verified && <VerifiedBadge />}
            </div>
            {(profile as any)?.username && (
              <p className="text-xs text-primary font-mono">@{(profile as any).username}</p>
            )}
            {profile.location && <p className="text-sm text-muted-foreground">📍 {profile.location}</p>}
          </div>

          <ProfessionalBadgesDisplay badges={(profile as any)?.professional_badges} />

          <div className="flex gap-6 text-center">
            <div><p className="font-bold text-lg">{stats?.posts ?? 0}</p><p className="text-xs text-muted-foreground">Posts</p></div>
            <div><p className="font-bold text-lg">{formatCount(stats?.followers ?? 0)}</p><p className="text-xs text-muted-foreground">Followers</p></div>
            <div><p className="font-bold text-lg">{formatCount(stats?.following ?? 0)}</p><p className="text-xs text-muted-foreground">Following</p></div>
          </div>

          {profile.bio && <p className="text-sm max-w-md">{profile.bio}</p>}

          <SocialLinksDisplay profile={profile as any} />

          <div className="flex gap-2">
            {isMe ? (
              <Button asChild variant="outline"><Link to="/profile">Edit profile</Link></Button>
            ) : (
              <>
                <Button onClick={() => toggleFollow.mutate({ targetUserId: id, following: !!amFollowing })} variant={amFollowing ? 'outline' : 'default'}>
                  {amFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" size="icon" asChild><Link to="/messages" aria-label="Message"><MessageCircle className="h-4 w-4" /></Link></Button>
                <Button variant="outline" size="icon" aria-label="Voice call" onClick={() => startCall(id, profile.display_name ?? 'User', profile.avatar_url ?? undefined, false)}><Phone className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label="Video call" onClick={() => startCall(id, profile.display_name ?? 'User', profile.avatar_url ?? undefined, true)}><Video className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 space-y-4">
          <ProfileStories userId={id} isOwner={isMe} avatarUrl={profile.avatar_url} />
          <FeaturedSongPlayer userId={id} isOwner={isMe} />
          <ProfileGallery userId={id} isOwner={isMe} />
        </div>

        <Tabs defaultValue="posts" className="px-4">
          <TabsList className={`grid w-full ${isMe ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="posts"><Grid3x3 className="h-4 w-4 mr-2" /> Posts</TabsTrigger>
            {isMe && <TabsTrigger value="saved"><Bookmark className="h-4 w-4 mr-2" /> Saved</TabsTrigger>}
          </TabsList>
          <TabsContent value="posts"><PostGrid items={posts} /></TabsContent>
          {isMe && <TabsContent value="saved"><PostGrid items={bookmarks} /></TabsContent>}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
