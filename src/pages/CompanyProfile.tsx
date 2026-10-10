import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AiToolsConnectPanel } from '@/components/ai/AiToolsConnectPanel';
import { CompanySetupWizard } from '@/components/company/CompanySetupWizard';
import { CompanyToolsGrid } from '@/components/company/CompanyToolsGrid';
import {
  isMissingCompaniesTable,
  useAddCompanyMember,
  useCompanyMembers,
  useMyCompanies,
  useRemoveCompanyMember,
  type Company,
  type CompanyMember,
} from '@/hooks/useCompanies';
import { COMPANY_KINDS } from '@/lib/companyTools';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Building2, Loader2, Plus, Rocket, Trash2, UserPlus, Users,
} from 'lucide-react';
import { toast } from 'sonner';

const kindLabel = (kind: string) => COMPANY_KINDS.find((k) => k.value === kind)?.label ?? kind;

const CompanyProfile = () => {
  const { user } = useAuth();
  const { data: companies, isLoading, error } = useMyCompanies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [invite, setInvite] = useState({ username: '', role: 'member' as CompanyMember['role'] });

  const list = companies ?? [];
  const tableMissing = !!error && isMissingCompaniesTable(error);

  useEffect(() => {
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const company: Company | undefined = list.find((c) => c.id === selectedId) ?? list[0];
  const isOwner = !!company && company.owner_id === user?.id;

  const { data: members } = useCompanyMembers(company?.id);
  const addMember = useAddCompanyMember();
  const removeMember = useRemoveCompanyMember();

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = useQuery({
    queryKey: ['company-member-profiles', company?.id, memberIds.join(',')],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase.from as any)('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', memberIds);
      return (data ?? []) as { user_id: string; display_name: string | null; username: string | null; avatar_url: string | null }[];
    },
  });

  const profileOf = (userId: string) => profiles?.find((p) => p.user_id === userId);

  const handleInvite = async () => {
    if (!company) return;
    try {
      const profile = await addMember.mutateAsync({ companyId: company.id, username: invite.username, role: invite.role });
      toast.success(`${profile.display_name ?? invite.username} ameongezwa kwenye timu`);
      setInvite({ username: '', role: 'member' });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!company) return;
    try {
      await removeMember.mutateAsync({ companyId: company.id, memberId });
      toast.success('Mwanachama ameondolewa');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-heading font-bold gradient-text">Biashara & Kampuni</h1>
            <p className="text-xs text-muted-foreground">Profile ya kampuni, tools zote, timu na AI tools.</p>
          </div>
          <Button size="sm" className="gradient-primary text-white" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Kampuni
          </Button>
        </div>

        {tableMissing ? (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Building2 className="h-9 w-9 mx-auto text-muted-foreground" />
              <p className="font-medium">Company profiles hazijawashwa kwenye database bado</p>
              <p className="text-sm text-muted-foreground">
                Tumia migration{' '}
                <span className="font-mono text-xs">supabase/migrations/20261001130000_company_profiles.sql</span>{' '}
                kwenye Supabase project yako.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <Rocket className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
              <p className="font-medium">Hakuna kampuni bado</p>
              <p className="text-sm text-muted-foreground">
                Fungua kampuni au biashara — jaza template na tools zote ziwashwe mara moja.
              </p>
              <Button className="gradient-primary text-white" onClick={() => setWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Fungua kampuni
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Company selector — a user can own several and belong to others */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn('shrink-0 rounded-xl border px-4 py-2.5 text-left transition',
                    company?.id === c.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40')}
                >
                  <p className="text-sm font-medium truncate max-w-[160px]">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {kindLabel(c.kind)} · {c.tools?.length ?? 0} tools
                    {c.owner_id !== user?.id && ' · mwanachama'}
                  </p>
                </button>
              ))}
            </div>

            {company && (
              <>
                <Card className="glass-elevated">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/25 to-violet/25 flex items-center justify-center shrink-0">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-heading font-bold truncate">{company.name}</h2>
                          <Badge className="gradient-primary text-white">{kindLabel(company.kind)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[company.industry, company.country, company.currency].filter(Boolean).join(' · ')}
                        </p>
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
                            {company.website}
                          </a>
                        )}
                      </div>
                    </div>
                    {!!company.template?.brief && (
                      <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded-lg p-3 text-muted-foreground font-sans">
                        {String(company.template.brief)}
                      </pre>
                    )}
                  </CardContent>
                </Card>

                <AiToolsConnectPanel companyId={company.id} />

                <div className="space-y-3">
                  <h2 className="text-lg font-heading font-bold">Tools za kampuni</h2>
                  <CompanyToolsGrid
                    activeKeys={company.tools}
                    emptyHint="Tools hazijawashwa bado kwa kampuni hii."
                  />
                </div>

                <Card className="glass-card">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="font-heading font-bold">Timu</h2>
                      <Badge variant="outline" className="text-[10px]">{members?.length ?? 0}</Badge>
                    </div>

                    <div className="space-y-2">
                      {(members ?? []).map((m) => {
                        const p = profileOf(m.user_id);
                        return (
                          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {(p?.display_name ?? '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{p?.display_name ?? m.user_id.slice(0, 8)}</p>
                              {p?.username && <p className="text-[10px] text-muted-foreground">@{p.username}</p>}
                            </div>
                            <Badge variant="outline" className="text-[10px] capitalize">{m.role}</Badge>
                            {isOwner && m.role !== 'owner' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                disabled={removeMember.isPending}
                                onClick={() => handleRemove(m.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isOwner && (
                      <div className="flex gap-2">
                        <Input
                          value={invite.username}
                          onChange={(e) => setInvite({ ...invite, username: e.target.value })}
                          placeholder="@username"
                          className="flex-1"
                        />
                        <Select value={invite.role} onValueChange={(v) => setInvite({ ...invite, role: v as CompanyMember['role'] })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          className="gradient-primary text-white shrink-0"
                          disabled={addMember.isPending || !invite.username.trim()}
                          onClick={handleInvite}
                        >
                          {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      <CompanySetupWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={setSelectedId} />
    </AppLayout>
  );
};

export default CompanyProfile;
