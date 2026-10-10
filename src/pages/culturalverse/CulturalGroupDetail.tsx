import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Button } from '@/components/ui/button';
import { Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CulturalGroupDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await (supabase.from as any)('cultural_groups').select('*').eq('slug', slug).maybeSingle();
      setGroup(data);
      if (data && user) {
        const { data: mem } = await (supabase.from as any)('cultural_group_members').select('id').eq('group_id', data.id).eq('user_id', user.id).maybeSingle();
        setIsMember(!!mem);
      }
    })();
  }, [slug, user]);

  const join = async () => {
    if (!user || !group) return toast.error('Sign in first');
    const { error } = await (supabase.from as any)('cultural_group_members').insert({ group_id: group.id, user_id: user.id });
    if (error) return toast.error(error.message);
    setIsMember(true); toast.success('Joined!');
  };
  const leave = async () => {
    if (!user || !group) return;
    await (supabase.from as any)('cultural_group_members').delete().eq('group_id', group.id).eq('user_id', user.id);
    setIsMember(false); toast('Left group');
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: group?.name, url }); return; } catch {} }
    await navigator.clipboard.writeText(url); toast.success('Link copied');
  };

  if (!group) return <CulturalVerseLayout><div className="p-8 text-center text-muted-foreground">Loading…</div></CulturalVerseLayout>;

  return (
    <CulturalVerseLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="rounded-2xl overflow-hidden border border-border/50 mb-4">
          <div className="aspect-[4/1] bg-gradient-to-br from-primary/30 to-violet/30">
            {group.cover_url && <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />}
          </div>
          <div className="p-5">
            <h1 className="font-heading text-2xl md:text-3xl font-bold">{group.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Users className="h-3 w-3" /> {group.member_count} members {group.country_code && `· ${group.country_code}`}</p>
            {group.description && <p className="text-sm text-muted-foreground mt-3">{group.description}</p>}
            <div className="flex gap-2 mt-4">
              {isMember ? <Button variant="secondary" onClick={leave}>Leave</Button> : <Button onClick={join}>Join group</Button>}
              <Button variant="outline" onClick={share}><Share2 className="h-4 w-4 mr-1" />Share</Button>
              <Button variant="ghost" asChild><Link to="/culturalverse/groups">All groups</Link></Button>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">Group posts & discussions coming in the next phase.</div>
      </div>
    </CulturalVerseLayout>
  );
}
