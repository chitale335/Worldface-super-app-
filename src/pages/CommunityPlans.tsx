import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CalendarDays, CalendarPlus, CheckCircle2, Coins, Loader2, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  PLAN_STATUSES, isMissingPlansTable, useCommunityPlans, usePlanParticipants, useSetRsvp, useUpdatePlanStatus,
  type CommunityPlan, type PlanStatus, type Rsvp,
} from '@/hooks/useCommunityPlans';
import { useRecordCommunityEarning, formatMoney } from '@/hooks/useCommunityEarnings';
import { PlanFormDialog } from '@/components/community/PlanFormDialog';

const statusStyles: Record<PlanStatus, string> = {
  planned: 'bg-primary/10 text-primary border-primary/30',
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const formatWhen = (plan: CommunityPlan) => {
  const from = plan.starts_at ? new Date(plan.starts_at) : null;
  const to = plan.ends_at ? new Date(plan.ends_at) : null;
  if (!from && !to) return 'Bila tarehe';
  const fmt = (d: Date) => d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (from && to) return `${fmt(from)} → ${fmt(to)}`;
  return fmt((from ?? to)!);
};

const CommunityPlans = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | PlanStatus>('all');

  const { data: community } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('communities').select('id,name,slug,owner_id').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string; slug: string; owner_id: string } | null;
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
      return data as { role: string; status: string } | null;
    },
    enabled: !!communityId && !!user,
  });
  const isMember = membership?.status === 'active' || community?.owner_id === user?.id;

  const plansQuery = useCommunityPlans(communityId);
  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const tableMissing = !!plansQuery.error && isMissingPlansTable(plansQuery.error);

  const planIds = useMemo(() => plans.map((p) => p.id), [plans]);
  const { data: participants } = usePlanParticipants(planIds);

  const setRsvp = useSetRsvp();
  const updateStatus = useUpdatePlanStatus();
  const recordEarning = useRecordCommunityEarning();

  const visible = filter === 'all' ? plans : plans.filter((p) => p.status === filter);

  const rsvpOf = (planId: string) => participants?.find((p) => p.plan_id === planId && p.user_id === user?.id)?.rsvp;
  const goingCount = (planId: string) =>
    (participants ?? []).filter((p) => p.plan_id === planId && p.rsvp === 'going').length;

  const markCompleted = async (plan: CommunityPlan) => {
    if (!communityId) return;
    try {
      await updateStatus.mutateAsync({ planId: plan.id, status: 'completed', communityId });
      if (plan.is_paid) {
        const attendees = goingCount(plan.id) || 1;
        await recordEarning.mutateAsync({
          communityId,
          userId: user!.id,
          earningsType: plan.earnings_type ?? 'event_tickets',
          amount: Number(plan.ticket_price) * attendees,
          currency: plan.currency,
          description: `Mpango: ${plan.title}`,
          sourceId: plan.id,
          sourceType: 'plan',
        });
        toast.success(`Mpango umekamilika — mapato yamerekodiwa (${attendees} waliohudhuria)`);
      } else {
        toast.success('Mpango umekamilika');
      }
      qc.invalidateQueries({ queryKey: ['community-earnings-summary', communityId] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/c/${slug}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-heading font-bold gradient-text truncate">Mipango ya Jamii</h1>
            <p className="text-xs text-muted-foreground truncate">{community?.name ?? 'Community'}</p>
          </div>
          {isMember && (
            <Button size="sm" className="gradient-primary text-white" onClick={() => setCreateOpen(true)}>
              <CalendarPlus className="h-4 w-4 mr-1.5" /> Mpango
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Zote</SelectItem>
              {PLAN_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Mipango {visible.length}</span>
        </div>

        {plansQuery.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : tableMissing ? (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <CalendarDays className="h-9 w-9 mx-auto text-muted-foreground" />
              <p className="font-medium">Community planning haijawashwa kwenye database bado</p>
              <p className="text-sm text-muted-foreground">
                Tumia migration <span className="font-mono text-xs">supabase/migrations/20261001120000_community_plans.sql</span> kwenye Supabase project yako.
              </p>
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {isMember ? 'Hakuna mpango bado. Anza kuupanga.' : 'Jiunge na jamii kuona na kupanga mipango.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((plan) => {
              const mine = rsvpOf(plan.id);
              const isOrganizer = plan.created_by === user?.id;
              return (
                <Card key={plan.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading font-semibold">{plan.title}</h2>
                          <Badge variant="outline" className={cn('text-[10px] capitalize', statusStyles[plan.status])}>{plan.status}</Badge>
                          {plan.is_paid && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Coins className="h-3 w-3" /> {formatMoney(Number(plan.ticket_price), plan.currency)}
                            </Badge>
                          )}
                        </div>
                        {plan.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{plan.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatWhen(plan)}</span>
                          {plan.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {plan.location}</span>}
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {goingCount(plan.id)} watahudhuria</span>
                          <span className="capitalize">{plan.plan_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(['going', 'maybe', 'declined'] as Rsvp[]).map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={mine === r ? 'default' : 'outline'}
                          className={cn('h-7 text-xs capitalize', mine === r && 'gradient-primary text-white')}
                          onClick={() => setRsvp.mutate({ planId: plan.id, rsvp: r, communityId: communityId! })}
                          disabled={!isMember || setRsvp.isPending}
                        >
                          {r === 'going' ? 'Nitahudhuria' : r === 'maybe' ? 'Labda' : 'Siwezi'}
                        </Button>
                      ))}
                      {isOrganizer && plan.status !== 'completed' && (
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs ml-auto"
                          onClick={() => markCompleted(plan)}
                          disabled={updateStatus.isPending || recordEarning.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Kamilisha
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {communityId && (
        <PlanFormDialog communityId={communityId} open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </AppLayout>
  );
};

export default CommunityPlans;
