import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Save, Video, ImagePlus, Globe2 } from 'lucide-react';
import { SocialLinksEditor, type SocialLinks } from '@/components/profile/SocialLinksEditor';
import { SocialLinksDisplay } from '@/components/profile/SocialLinksDisplay';
import { CameraCapture } from '@/components/profile/CameraCapture';
import { VerifiedBadge } from '@/components/profile/VerifiedBadge';
import { PhoneInput } from '@/components/profile/PhoneInput';
import {
  ProfessionalBadgesEditor,
  ProfessionalBadgesDisplay,
} from '@/components/profile/ProfessionalBadges';
import { ProfileGallery } from '@/components/profile/ProfileGallery';
import { ProfileStories } from '@/components/profile/ProfileStories';
import { FeaturedSongPlayer } from '@/components/profile/FeaturedSongPlayer';
import { LinksHub } from '@/components/profile/LinksHub';
import { ProfileAnalytics } from '@/components/profile/ProfileAnalytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_COUNTRY } from '@/lib/countryCodes';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang, setLang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const [{ data }, { data: wallet }, { data: contact }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('wallet_accounts').select('account_number').eq('user_id', user!.id).maybeSingle(),
        (supabase.from as any)('profile_contacts')
          .select('phone_country_code, phone_number')
          .eq('user_id', user!.id)
          .maybeSingle(),
      ]);
      return data
        ? {
            ...data,
            account_number: (wallet as any)?.account_number ?? null,
            phone_country_code: (contact as any)?.phone_country_code ?? null,
            phone_number: (contact as any)?.phone_number ?? null,
          }
        : null;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    phone_country_code: DEFAULT_COUNTRY.dial,
    phone_number: '',
    professional_badges: [] as string[],
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    username: '', instagram_url: '', twitter_url: '', telegram_url: '',
    facebook_url: '', tiktok_url: '', youtube_url: '', linkedin_url: '',
  });

  const startEditing = () => {
    const p = profile as any;
    setForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || '',
      phone_country_code: p?.phone_country_code || DEFAULT_COUNTRY.dial,
      phone_number: p?.phone_number || '',
      professional_badges: p?.professional_badges || [],
    });
    setSocialLinks({
      username: p?.username || '',
      instagram_url: p?.instagram_url || '',
      twitter_url: p?.twitter_url || '',
      telegram_url: p?.telegram_url || '',
      facebook_url: p?.facebook_url || '',
      tiktok_url: p?.tiktok_url || '',
      youtube_url: p?.youtube_url || '',
      linkedin_url: p?.linkedin_url || '',
    });
    setEditing(true);
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      // username validation
      const uname = socialLinks.username.trim().toLowerCase();
      if (uname && !/^[a-z0-9_]{3,20}$/.test(uname)) {
        throw new Error('Username lazima iwe herufi ndogo/nambari/underscore, 3-20 chars');
      }

      const payload: Record<string, unknown> = {
        display_name: form.display_name,
        bio: form.bio,
        location: form.location,
        website: form.website || null,
        professional_badges: form.professional_badges,
        preferred_language: lang,
        username: uname || null,
        instagram_url: socialLinks.instagram_url || null,
        twitter_url: socialLinks.twitter_url || null,
        telegram_url: socialLinks.telegram_url || null,
        facebook_url: socialLinks.facebook_url || null,
        tiktok_url: socialLinks.tiktok_url || null,
        youtube_url: socialLinks.youtube_url || null,
        linkedin_url: socialLinks.linkedin_url || null,
      };
      const { error } = await supabase
        .from('profiles')
        .update(payload as any)
        .eq('user_id', user!.id);
      if (error) throw error;

      // Save contact (upsert into private table)
      const contactRow = {
        user_id: user!.id,
        phone_country_code: form.phone_number ? form.phone_country_code : null,
        phone_number: form.phone_number || null,
      };
      const { error: cErr } = await (supabase.from as any)('profile_contacts')
        .upsert(contactRow, { onConflict: 'user_id' });
      if (cErr) throw cErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast({ title: 'Profile imesasishwa!' });
    },
    onError: (error: any) => {
      toast({ title: 'Hitilafu', description: error.message, variant: 'destructive' });
    },
  });

  const uploadTo = async (bucket: 'avatars' | 'covers', file: File, field: 'avatar_url' | 'cover_url') => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload imeshindwa', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    await supabase.from('profiles').update({ [field]: publicUrl } as any).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast({ title: field === 'avatar_url' ? 'Avatar imesasishwa!' : 'Cover imesasishwa!' });
  };

  const uploadAvatar = (file: File) => uploadTo('avatars', file, 'avatar_url');
  const uploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadTo('covers', f, 'cover_url');
  };
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadAvatar(f);
  };

  const initials = profile?.display_name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const p = profile as any;
  const coverUrl: string | null = p?.cover_url ?? null;
  const isVerified: boolean = !!p?.verified;
  const badges: string[] = p?.professional_badges ?? [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Your Profile</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe2 className="h-4 w-4" />
            <button
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'text-primary font-semibold' : 'hover:text-foreground'}
            >EN</button>
            <span>/</span>
            <button
              onClick={() => setLang('sw')}
              className={lang === 'sw' ? 'text-primary font-semibold' : 'hover:text-foreground'}
            >SW</button>
          </div>
        </div>

        <Card className="glass-elevated animate-fade-in overflow-hidden">
          {/* Cover photo */}
          <div className="relative h-40 sm:h-52 -mx-px group">
            {coverUrl ? (
              <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/40 via-blue-600/30 to-slate-900" />
            )}
            <label className="absolute top-3 right-3 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border/50 text-xs hover:bg-background/90 transition">
              <ImagePlus className="h-3.5 w-3.5" />
              {coverUrl ? 'Badilisha cover' : 'Ongeza cover'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
            </label>
          </div>

          <CardContent className="pt-0">
            {/* Avatar overlapping cover */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-12 sm:-mt-14 mb-6">
              <div className="relative group self-start">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background ring-2 ring-primary/20 shadow-lg">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-heading">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer p-1.5 rounded-full bg-background/30 hover:bg-background/50">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <button
                    onClick={() => setCameraOpen(true)}
                    className="p-1.5 rounded-full bg-background/30 hover:bg-background/50"
                  >
                    <Video className="h-4 w-4 text-primary-foreground" />
                  </button>
                </div>
              </div>
              <div className="mt-3 sm:mt-0 sm:pb-2 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xl font-heading font-bold">{profile?.display_name || 'Anonymous'}</h2>
                  {isVerified && <VerifiedBadge />}
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {p?.username && (
                  <p className="text-xs text-primary font-mono">@{p.username}</p>
                )}
                {p?.account_number && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-emerald-500/15 via-blue-500/15 to-violet-500/15 border border-primary/20">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">NexaPay ID</span>
                    <span className="text-xs font-mono font-bold text-primary">{p.account_number}</span>
                  </div>
                )}
                {profile?.location && (
                  <p className="text-sm text-muted-foreground mt-1">📍 {profile.location}</p>
                )}
              </div>
            </div>

            {badges.length > 0 && !editing && (
              <div className="mb-4">
                <ProfessionalBadgesDisplay badges={badges} />
              </div>
            )}

            {!editing && (
              <div className="mb-4">
                <ProfileStories userId={user!.id} isOwner={true} avatarUrl={profile?.avatar_url} />
              </div>
            )}

            {!editing && <SocialLinksDisplay profile={profile as any} />}

            {!editing && (
              <div className="mt-4 space-y-4">
                <FeaturedSongPlayer userId={user!.id} isOwner={true} />
                <ProfileGallery userId={user!.id} isOwner={true} />
                <LinksHub profile={profile as any} />
                <ProfileAnalytics userId={user!.id} />
              </div>
            )}

            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Jieleze..." maxLength={500} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Namba ya Simu</Label>
                  <PhoneInput
                    countryCode={form.phone_country_code}
                    number={form.phone_number}
                    onChange={(cc, num) => setForm({ ...form, phone_country_code: cc, phone_number: num })}
                  />
                  <p className="text-[10px] text-muted-foreground">🔒 Namba yako ya simu ni siri — mmiliki pekee anaiona.</p>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mji, Nchi" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." maxLength={255} />
                </div>

                <div className="space-y-2">
                  <Label>Professional Badges</Label>
                  <ProfessionalBadgesEditor
                    selected={form.professional_badges}
                    onChange={(v) => setForm({ ...form, professional_badges: v })}
                  />
                  <p className="text-[10px] text-muted-foreground">Chagua majukumu yako ya kitaaluma.</p>
                </div>

                <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />

                <div className="flex gap-3">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Hifadhi
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                {profile?.bio && <p className="text-foreground">{profile.bio}</p>}
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                    {profile.website}
                  </a>
                )}
                <div>
                  <Button onClick={startEditing}>Edit profile</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onCapture={uploadAvatar} />
    </AppLayout>
  );
};

export default Profile;
