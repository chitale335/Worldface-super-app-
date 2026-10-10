import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Lock, EyeOff, Building2, GraduationCap, Star, Gamepad2, ShoppingBag, MapPin, BadgeCheck, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TYPES = [
  { v: 'all', label: 'All' },
  { v: 'public', label: 'Public' },
  { v: 'private', label: 'Private' },
  { v: 'business', label: 'Business' },
  { v: 'school', label: 'School' },
  { v: 'fan_club', label: 'Fan Club' },
  { v: 'gaming', label: 'Gaming' },
  { v: 'marketplace', label: 'Market' },
  { v: 'local', label: 'Local' },
  { v: 'verified_org', label: 'Verified' },
] as const;

const typeIcon = (t: string) => {
  const map: Record<string, any> = {
    public: Users, private: Lock, secret: EyeOff, business: Building2, school: GraduationCap,
    fan_club: Star, gaming: Gamepad2, marketplace: ShoppingBag, local: MapPin, verified_org: BadgeCheck,
  };
  const Icon = map[t] ?? Users;
  return <Icon className="h-4 w-4" />;
};

export default function Communities() {
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['communities', type, q],
    queryFn: async () => {
      let query = (supabase.from as any)('communities')
        .select('id,name,slug,description,avatar_url,cover_url,type,member_count,post_count,verified,category,country')
        .neq('type', 'secret')
        .order('member_count', { ascending: false })
        .limit(60);
      if (type !== 'all') query = query.eq('type', type);
      if (q.trim()) query = query.ilike('name', `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text">Communities</h1>
            <p className="text-sm text-muted-foreground">Find your people, build your world.</p>
          </div>
          <Button asChild className="gradient-primary text-white">
            <Link to="/communities/new"><Plus className="h-4 w-4 mr-1.5" /> New</Link>
          </Button>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search communities…" className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {TYPES.map((t) => (
            <button
              key={t.v}
              onClick={() => setType(t.v)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition',
                type === t.v ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >{t.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((c: any) => (
              <Link key={c.id} to={`/c/${c.slug}`} className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition shadow-sm">
                <div className="h-24 bg-gradient-to-br from-primary/30 to-violet/20 relative">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3 -mt-8 relative">
                  <div className="h-14 w-14 rounded-2xl bg-background border-2 border-background overflow-hidden shadow">
                    {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" /> : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-lg">{c.name?.[0]}</div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <h3 className="font-heading font-semibold truncate">{c.name}</h3>
                    {c.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] mt-0.5">{c.description || 'No description yet.'}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">{typeIcon(c.type)} {c.type.replace('_', ' ')}</span>
                    <span>{c.member_count} members</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No communities found. Be the first — create one.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
