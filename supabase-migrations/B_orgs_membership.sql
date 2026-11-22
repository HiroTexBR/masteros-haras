-- =====================================================================
-- MasterOS — Fase B: Perfis, Membership e Onboarding
-- Cole ESTE arquivo no SQL Editor do Supabase e rode (idempotente).
-- Depende da Fase A1 (verticals, modules, vertical_modules, organizations,
-- organization_modules, enum app_role já criados).
-- =====================================================================

-- 1) PROFILES ----------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-provisiona profile no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      new.raw_user_meta_data->>'avatar_url'
    )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles p/ usuários existentes
insert into public.profiles (id, email, full_name, avatar_url)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
       u.raw_user_meta_data->>'avatar_url'
  from auth.users u
on conflict (id) do nothing;

-- 2) ORGANIZATIONS: promover owner_id p/ FK auth.users --------------- -
do $$ begin
  alter table public.organizations
    add constraint organizations_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete set null;
exception when duplicate_object then null; when others then null; end $$;

-- 3) MEMBERSHIPS -------------------------------------------------------
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id)          on delete cascade,
  role        public.app_role not null default 'member',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_org_idx  on public.memberships(org_id);

grant select, insert, update, delete on public.memberships to authenticated;
grant all on public.memberships to service_role;

alter table public.memberships enable row level security;

-- Helpers SECURITY DEFINER (evitam recursão em RLS)
create or replace function public.is_org_member(_org uuid, _user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where org_id = _org and user_id = _user);
$$;

create or replace function public.has_org_role(_org uuid, _user uuid, variadic _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
     where org_id = _org and user_id = _user and role = any(_roles)
  );
$$;

grant execute on function public.is_org_member(uuid, uuid) to authenticated;
grant execute on function public.has_org_role(uuid, uuid, public.app_role[]) to authenticated;

-- Policies memberships
drop policy if exists "memberships_read_own_orgs" on public.memberships;
drop policy if exists "memberships_owner_manage"  on public.memberships;
create policy "memberships_read_own_orgs" on public.memberships
  for select using (user_id = auth.uid() or public.is_org_member(org_id, auth.uid()));
create policy "memberships_owner_manage" on public.memberships
  for all
  using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'))
  with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'));

-- 4) ORGS: substituir policy owner-only por membership -----------------
drop policy if exists "orgs_owner_all"       on public.organizations;
drop policy if exists "orgs_member_select"   on public.organizations;
drop policy if exists "orgs_insert_self"     on public.organizations;
drop policy if exists "orgs_owner_update"    on public.organizations;
drop policy if exists "orgs_owner_delete"    on public.organizations;

create policy "orgs_member_select" on public.organizations
  for select using (public.is_org_member(id, auth.uid()));

create policy "orgs_insert_self" on public.organizations
  for insert with check (owner_id = auth.uid());

create policy "orgs_owner_update" on public.organizations
  for update using (public.has_org_role(id, auth.uid(), 'owner', 'admin'))
       with check (public.has_org_role(id, auth.uid(), 'owner', 'admin'));

create policy "orgs_owner_delete" on public.organizations
  for delete using (public.has_org_role(id, auth.uid(), 'owner'));

-- 5) ORG_MODULES: policies por membership ------------------------------
drop policy if exists "org_modules_owner_all"    on public.organization_modules;
drop policy if exists "org_modules_member_read"  on public.organization_modules;
drop policy if exists "org_modules_admin_write"  on public.organization_modules;

create policy "org_modules_member_read" on public.organization_modules
  for select using (public.is_org_member(org_id, auth.uid()));

create policy "org_modules_admin_write" on public.organization_modules
  for all
  using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'))
  with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'));

-- 6) toggle_module: aceitar owner/admin (via membership) ---------------
create or replace function public.toggle_module(_org uuid, _code text, _enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_org_role(_org, auth.uid(), 'owner', 'admin') then
    raise exception 'not authorized';
  end if;
  insert into public.organization_modules (org_id, module_code, enabled)
       values (_org, _code, _enabled)
  on conflict (org_id, module_code) do update
     set enabled = excluded.enabled, updated_at = now();
end $$;

-- 7) create_organization: atomicamente cria org + owner membership +
--    módulos padrão da vertical -----------------------------------------
create or replace function public.create_organization(_name text, _vertical text, _slug text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  uid    uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if _name is null or length(trim(_name)) = 0 then
    raise exception 'name required';
  end if;
  if _vertical is null or not exists (select 1 from public.verticals where code = _vertical) then
    raise exception 'invalid vertical';
  end if;

  insert into public.organizations (name, slug, vertical_code, owner_id)
       values (trim(_name), nullif(trim(_slug), ''), _vertical, uid)
    returning id into new_id;

  insert into public.memberships (org_id, user_id, role) values (new_id, uid, 'owner');

  -- Ativa módulos default da vertical
  insert into public.organization_modules (org_id, module_code, enabled)
  select new_id, vm.module_code, true
    from public.vertical_modules vm
   where vm.vertical_code = _vertical and vm.enabled_by_default = true
  on conflict do nothing;

  -- Garante que os core estão sempre ativos
  insert into public.organization_modules (org_id, module_code, enabled)
  select new_id, m.code, true from public.modules m where m.is_core = true
  on conflict do nothing;

  return new_id;
end $$;

grant execute on function public.create_organization(text, text, text) to authenticated;

-- 8) Backfill: p/ orgs órfãs com owner_id preenchido, cria membership --
insert into public.memberships (org_id, user_id, role)
select o.id, o.owner_id, 'owner'
  from public.organizations o
 where o.owner_id is not null
on conflict do nothing;

-- =====================================================================
-- Verificação
-- =====================================================================
select 'profiles'    as t, count(*) from public.profiles
union all select 'memberships', count(*) from public.memberships
union all select 'organizations', count(*) from public.organizations;
