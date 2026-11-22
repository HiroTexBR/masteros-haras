-- =============================================================
-- Phase G · Proprietários (pessoas físicas/jurídicas donas de animais)
-- Deps: B_orgs_membership, F_animais (para FK opcional em animais)
-- =============================================================

do $$ begin
  create type public.proprietario_tipo as enum ('pf', 'pj');
exception when duplicate_object then null; end $$;

create table if not exists public.proprietarios (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  tipo         public.proprietario_tipo not null default 'pf',
  nome         text not null,
  documento    text,        -- CPF ou CNPJ
  email        text,
  telefone     text,
  endereco     jsonb,
  observacoes  text,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists proprietarios_org_idx
  on public.proprietarios (org_id) where deleted_at is null;
create index if not exists proprietarios_nome_trgm
  on public.proprietarios using gin (nome gin_trgm_ops);

grant select, insert, update, delete on public.proprietarios to authenticated;
grant all on public.proprietarios to service_role;

alter table public.proprietarios enable row level security;

drop policy if exists "proprietarios_select_members" on public.proprietarios;
create policy "proprietarios_select_members" on public.proprietarios
  for select using (public.is_org_member(org_id, auth.uid()) and deleted_at is null);

drop policy if exists "proprietarios_insert_members" on public.proprietarios;
create policy "proprietarios_insert_members" on public.proprietarios
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "proprietarios_update_members" on public.proprietarios;
create policy "proprietarios_update_members" on public.proprietarios
  for update using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "proprietarios_delete_managers" on public.proprietarios;
create policy "proprietarios_delete_managers" on public.proprietarios
  for delete using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager'));

drop trigger if exists proprietarios_set_updated_at on public.proprietarios;
create trigger proprietarios_set_updated_at
  before update on public.proprietarios
  for each row execute function public.set_updated_at();

-- =============================================================
-- Liga animais.proprietario_id → proprietarios(id)
-- O campo texto `proprietario` continua existindo (histórico).
-- =============================================================
alter table public.animais
  add column if not exists proprietario_id uuid references public.proprietarios(id) on delete set null;

create index if not exists animais_proprietario_id_idx
  on public.animais (proprietario_id) where deleted_at is null;
