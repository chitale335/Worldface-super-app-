import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { slugify, toolsForKind, type CompanyKind } from '@/lib/companyTools';

const table = (name: string) => (supabase.from as any)(name);

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  kind: CompanyKind;
  industry: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  country: string | null;
  currency: string;
  team_size: string | null;
  template: Record<string, unknown>;
  tools: string[];
  is_active: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'invited' | 'active';
  created_at: string;
}

export const isMissingCompaniesTable = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  return code === '42P01' || code === 'PGRST205' || (/companies/.test(message) && /does not exist|not find/i.test(message));
};

/** Every company the signed-in user owns or belongs to. */
export const useMyCompanies = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['companies', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Company[]> => {
      const { data: owned, error } = await table('companies')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: memberships } = await table('company_members')
        .select('company_id')
        .eq('user_id', user!.id);

      const ownedList = (owned ?? []) as Company[];
      const ids = (memberships ?? [])
        .map((m: { company_id: string }) => m.company_id)
        .filter((id: string) => !ownedList.some((c) => c.id === id));

      let shared: Company[] = [];
      if (ids.length) {
        const { data } = await table('companies').select('*').in('id', ids);
        shared = (data ?? []) as Company[];
      }

      return [...ownedList, ...shared];
    },
  });
};

export const useCompanyMembers = (companyId?: string) =>
  useQuery({
    queryKey: ['company-members', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<CompanyMember[]> => {
      const { data, error } = await table('company_members')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CompanyMember[];
    },
  });

export interface CreateCompanyInput {
  name: string;
  kind: CompanyKind;
  industry?: string;
  description?: string;
  website?: string;
  country?: string;
  currency?: string;
  team_size?: string;
  brief?: string;
  tools?: string[];
}

export const useCreateCompany = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCompanyInput): Promise<Company> => {
      if (!user) throw new Error('Ingia kwanza');

      const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await table('companies')
        .insert({
          owner_id: user.id,
          name: input.name.trim(),
          slug,
          kind: input.kind,
          industry: input.industry || null,
          description: input.description || null,
          website: input.website || null,
          country: input.country || null,
          currency: input.currency || 'USD',
          team_size: input.team_size || null,
          template: { brief: input.brief ?? '' },
          tools: input.tools ?? toolsForKind(input.kind),
          terms_accepted_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;

      const created = data as Company;
      const { error: memberError } = await table('company_members')
        .insert({ company_id: created.id, user_id: user.id, role: 'owner', status: 'active' });
      if (memberError) throw memberError;

      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Company> }) => {
      const { error } = await table('companies').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
};

export const useAddCompanyMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, username, role }: { companyId: string; username: string; role: CompanyMember['role'] }) => {
      const uname = username.replace(/^@/, '').trim().toLowerCase();
      if (!uname) throw new Error('Weka username (@jina)');

      const { data: profile, error } = await table('profiles')
        .select('user_id, display_name')
        .eq('username', uname)
        .maybeSingle();
      if (error) throw error;
      if (!profile) throw new Error(`@${uname} haipatikani`);

      const { error: insertError } = await table('company_members').upsert(
        { company_id: companyId, user_id: profile.user_id, role, status: 'active' },
        { onConflict: 'company_id,user_id' },
      );
      if (insertError) throw insertError;
      return profile as { user_id: string; display_name: string | null };
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['company-members', vars.companyId] }),
  });
};

export const useRemoveCompanyMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, memberId }: { companyId: string; memberId: string }) => {
      const { error } = await table('company_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['company-members', vars.companyId] }),
  });
};
