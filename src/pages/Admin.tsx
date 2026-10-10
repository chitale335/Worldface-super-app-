import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, FileText, AlertTriangle, CheckCircle2, Ban, BadgeCheck, Trash2 } from 'lucide-react';

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'user' | 'message';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
};

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean;
  banned: boolean;
  created_at: string;
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const { toast } = useToast();
  const [stats, setStats] = useState({ users: 0, posts: 0, pendingReports: 0 });
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ count: users }, { count: posts }, { count: pendingReports }, reportsRes, profilesRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setStats({ users: users ?? 0, posts: posts ?? 0, pendingReports: pendingReports ?? 0 });
    setReports((reportsRes.data ?? []) as ReportRow[]);
    setProfiles((profilesRes.data ?? []) as ProfileRow[]);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto p-8 text-center space-y-3">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-heading font-bold">Access denied</h1>
          <p className="text-muted-foreground">You need administrator privileges to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  const updateReport = async (id: string, status: ReportRow['status']) => {
    setBusy(true);
    const { error } = await supabase
      .from('reports')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    setBusy(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: `Report ${status}` }); load(); }
  };

  const deleteTarget = async (r: ReportRow) => {
    if (!confirm(`Delete this ${r.target_type}?`)) return;
    setBusy(true);
    const table = r.target_type === 'post' ? 'posts' : r.target_type === 'comment' ? 'post_comments' : null;
    if (table) await supabase.from(table).delete().eq('id', r.target_id);
    await updateReport(r.id, 'resolved');
    setBusy(false);
  };

  const toggleVerified = async (p: ProfileRow) => {
    const { error } = await supabase.from('profiles').update({ verified: !p.verified }).eq('user_id', p.user_id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: p.verified ? 'Unverified' : 'Verified ✓' }); load(); }
  };

  const toggleBanned = async (p: ProfileRow) => {
    const { error } = await supabase.from('profiles').update({ banned: !p.banned }).eq('user_id', p.user_id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: p.banned ? 'Unbanned' : 'Banned' }); load(); }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-heading font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <header className="pt-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, content & reports</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Users} label="Users" value={stats.users} color="from-primary to-violet" />
          <StatCard icon={FileText} label="Posts" value={stats.posts} color="from-cyan to-primary" />
          <StatCard icon={AlertTriangle} label="Pending reports" value={stats.pendingReports} color="from-rose to-amber" />
        </div>

        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-3 mt-4">
            {reports.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald" />
                No reports yet — everything is clean.
              </Card>
            )}
            {reports.map((r) => (
              <Card key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{r.target_type}</Badge>
                      <Badge
                        className={
                          r.status === 'pending' ? 'bg-amber/20 text-amber-foreground' :
                          r.status === 'resolved' ? 'bg-emerald/20' :
                          r.status === 'dismissed' ? 'bg-muted' : 'bg-cyan/20'
                        }
                      >{r.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold mt-2">{r.reason}</p>
                    {r.details && <p className="text-sm text-muted-foreground mt-1">{r.details}</p>}
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">target: {r.target_id}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => updateReport(r.id, 'reviewing')}>Review</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => updateReport(r.id, 'dismissed')}>Dismiss</Button>
                    </>
                  )}
                  {(r.target_type === 'post' || r.target_type === 'comment') && (
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => deleteTarget(r)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete {r.target_type}
                    </Button>
                  )}
                  {r.status !== 'resolved' && (
                    <Button size="sm" disabled={busy} onClick={() => updateReport(r.id, 'resolved')}>Resolve</Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-2 mt-4">
            {profiles.map((p) => (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback>{(p.display_name ?? '?').slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold truncate">{p.display_name ?? 'Unnamed'}</p>
                    {p.verified && <BadgeCheck className="h-4 w-4 text-cyan" />}
                    {p.banned && <Badge variant="destructive" className="text-[10px]">BANNED</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{p.username ?? p.user_id.slice(0, 8)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleVerified(p)}>
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" />{p.verified ? 'Unverify' : 'Verify'}
                </Button>
                <Button size="sm" variant={p.banned ? 'outline' : 'destructive'} onClick={() => toggleBanned(p)}>
                  <Ban className="h-3.5 w-3.5 mr-1" />{p.banned ? 'Unban' : 'Ban'}
                </Button>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
