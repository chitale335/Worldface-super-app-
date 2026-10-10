import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const table = (name: string) => (supabase.from as any)(name);

export type PlanStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type PlanType = 'event' | 'meetup' | 'project' | 'challenge';
export type Rsvp = 'going' | 'maybe' | 'declined';

export interface CommunityPlan {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  plan_type: PlanType;
  status: PlanStatus;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_paid: boolean;
  ticket_price: number;
  currency: string;
  earnings_type: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanParticipant {
  id: string;
  plan_id: string;
  user_id: string;
  rsvp: Rsvp;
  is_organizer: boolean;
}

export const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'event', label: 'Event' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'project', label: 'Project' },
  { value: 'challenge', label: 'Challenge' },
];

export const PLAN_STATUSES: { value: PlanStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** True when the plans table has not been created in this Supabase project yet. */
export const isMissingPlansTable = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  return code === '42P01' || code === 'PGRST205' || /community_plans/.test(message) && /does not exist|not find/i.test(message);
};

export const useCommunityPlans = (communityId?: string) =>
  useQuery({
    queryKey: ['community-plans', communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const { data, error } = await table('community_plans')
        .select('*')
        .eq('community_id', communityId)
        .order('starts_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommunityPlan[];
    },
  });

export const usePlanParticipants = (planIds: string[] = []) =>
  useQuery({
    queryKey: ['community-plan-participants', planIds.join(',')],
    enabled: planIds.length > 0,
    queryFn: async () => {
      const { data, error } = await table('community_plan_participants')
        .select('*')
        .in('plan_id', planIds);
      if (error) throw error;
      return (data ?? []) as PlanParticipant[];
    },
  });

export interface CreatePlanInput {
  communityId: string;
  title: string;
  description?: string;
  planType: PlanType;
  status: PlanStatus;
  location?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isPaid: boolean;
  ticketPrice?: number;
  currency?: string;
  earningsType?: string | null;
  termsAccepted: boolean;
}

export const useCreateCommunityPlan = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      if (!user) throw new Error('Sign in first');
      const { data, error } = await table('community_plans')
        .insert({
          community_id: input.communityId,
          created_by: user.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          plan_type: input.planType,
          status: input.status,
          location: input.location?.trim() || null,
          starts_at: input.startsAt || null,
          ends_at: input.endsAt || null,
          is_paid: input.isPaid,
          ticket_price: input.isPaid ? Number(input.ticketPrice ?? 0) : 0,
          currency: input.currency ?? 'KES',
          earnings_type: input.isPaid ? input.earningsType ?? null : null,
          terms_accepted_at: input.termsAccepted ? new Date().toISOString() : null,
        })
        .select('*')
        .single();
      if (error) throw error;
      const plan = data as CommunityPlan;
      await table('community_plan_participants').insert({
        plan_id: plan.id,
        user_id: user.id,
        rsvp: 'going',
        is_organizer: true,
      });
      return plan;
    },
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['community-plans', plan.community_id] });
    },
  });
};

export const useUpdatePlanStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, status, communityId }: { planId: string; status: PlanStatus; communityId: string }) => {
      const { error } = await table('community_plans').update({ status }).eq('id', planId);
      if (error) throw error;
      return communityId;
    },
    onSuccess: (communityId) => qc.invalidateQueries({ queryKey: ['community-plans', communityId] }),
  });
};

export const useSetRsvp = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, rsvp }: { planId: string; rsvp: Rsvp; communityId: string }) => {
      if (!user) throw new Error('Sign in first');
      const { error } = await table('community_plan_participants').upsert(
        { plan_id: planId, user_id: user.id, rsvp },
        { onConflict: 'plan_id,user_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-plan-participants'] }),
  });
};
