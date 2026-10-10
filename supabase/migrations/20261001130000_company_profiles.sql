-- Company / Business profiles + members + AI tools connections
-- Applied to the remote Supabase project via the SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ── Companies ────────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  kind text not null default 'business' check (kind in ('creator', 'business', 'development', 'enterprise')),
  industry text,
  description text,
  website text,
  logo_url text,
  country text,
  currency text not null default 'USD',
  team_size text,
  template jsonb not null default '{}'::jsonb,
  tools text[] not null default '{}',
  is_active boolean not null default true,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_owner_idx on public.companies (owner_id);
create index if not exists companies_kind_idx on public.companies (kind);

-- ── Members (team) ───────────────────────────────────────────────────────────
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('invited', 'active')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_members_user_idx on public.company_members (user_id);

-- ── AI tools connections (k-agi-core) ────────────────────────────────────────
create table if not exists public.ai_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  provider text not null,
  status text not null default 'connected',
  scopes text[] not null default '{}',
  access_token text,
  external_account text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists ai_connections_user_idx on public.ai_connections (user_id);

-- ── updated_at ───────────────────────────────────────────────────────────────
create or replace function public.set_company_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_company_updated_at();

drop trigger if exists ai_connections_updated_at on public.ai_connections;
create trigger ai_connections_updated_at before update on public.ai_connections
  for each row execute function public.set_company_updated_at();

-- ── Membership helper (security definer avoids RLS recursion) ────────────────
create or replace function public.is_company_member(_company_id uuid, _user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = _company_id and user_id = _user_id and status = 'active'
  );
$$;

-- ── Row level security ───────────────────────────────────────────────────────
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.ai_connections enable row level security;

drop policy if exists "companies readable by owner and members" on public.companies;
create policy "companies readable by owner and members" on public.companies
  for select using (owner_id = auth.uid() or public.is_company_member(id, auth.uid()));

drop policy if exists "companies insert own" on public.companies;
create policy "companies insert own" on public.companies
  for insert with check (owner_id = auth.uid());

drop policy if exists "companies update by owner" on public.companies;
create policy "companies update by owner" on public.companies
  for update using (owner_id = auth.uid());

drop policy if exists "companies delete by owner" on public.companies;
create policy "companies delete by owner" on public.companies
  for delete using (owner_id = auth.uid());

drop policy if exists "members readable by company" on public.company_members;
create policy "members readable by company" on public.company_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    or public.is_company_member(company_id, auth.uid())
  );

drop policy if exists "members managed by owner" on public.company_members;
create policy "members managed by owner" on public.company_members
  for update using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  );

drop policy if exists "members delete by owner" on public.company_members;
create policy "members delete by owner" on public.company_members
  for delete using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  );

drop policy if exists "members insert by owner" on public.company_members;
create policy "members insert by owner" on public.company_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  );

drop policy if exists "ai connections own rows" on public.ai_connections;
create policy "ai connections own rows" on public.ai_connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
