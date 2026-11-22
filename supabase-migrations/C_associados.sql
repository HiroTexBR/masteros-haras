-- =====================================================================
-- MasterOS — Fase C: Módulo Associados
-- Cole no SQL Editor do Supabase. Idempotente. Depende de Fases A1 e B.
-- =====================================================================

-- 1) Enums --------------------------------------------------------------
do $$ begin
  create type public.associado_status as enum ('ativo', 'inativo', 'pendente', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.associado_categoria as enum (
    'proprietario', 'contribuinte', 'ativo', 'honorario', 'veterano', 'juvenil', 'outro'
  );
exception when duplicate_object then null; end $$;

-- Extensão trigram para busca (precisa vir ANTES do índice que a usa)
create extension if not exists pg_trgm;

-- 2) Tabela associados --------------------------------------------------
create table if not exists public.associados (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  numero          int,                                    -- numero de matrícula (opcional, único por org)
  nome            text not null,
  cpf             text,
  rg              text,
  email           text,
  telefone        text,
  data_nascimento date,
  data_admissao   date not null default current_date,
  categoria       public.associado_categoria not null default 'contribuinte',
  status          public.associado_status    not null default 'ativo',
  foto_url        text,
  endereco        jsonb not null default '{}'::jsonb,     -- { rua, numero, bairro, cidade, uf, cep }
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  deleted_at      timestamptz,
  unique (org_id, numero)
);

create index if not exists associados_org_idx        on public.associados(org_id);
create index if not exists associados_org_status_idx on public.associados(org_id, status);
create index if not exists associados_nome_trgm_idx  on public.associados using gin (nome gin_trgm_ops);

-- 3) Trigger updated_at -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists associados_set_updated_at on public.associados;
create trigger associados_set_updated_at
  before update on public.associados
  for each row execute function public.set_updated_at();

-- 4) Auto-numero por org (se não vier explícito) ------------------------
create or replace function public.associados_assign_numero()
returns trigger language plpgsql as $$
declare
  next_num int;
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into next_num
      from public.associados where org_id = new.org_id;
    new.numero := next_num;
  end if;
  return new;
end $$;

drop trigger if exists associados_number_seq on public.associados;
create trigger associados_number_seq
  before insert on public.associados
  for each row execute function public.associados_assign_numero();

-- 5) GRANTS -------------------------------------------------------------
grant select, insert, update, delete on public.associados to authenticated;
grant all on public.associados to service_role;

-- 6) RLS ----------------------------------------------------------------
alter table public.associados enable row level security;

drop policy if exists "associados_member_read"   on public.associados;
drop policy if exists "associados_member_write"  on public.associados;
drop policy if exists "associados_admin_delete"  on public.associados;

create policy "associados_member_read" on public.associados
  for select using (public.is_org_member(org_id, auth.uid()) and deleted_at is null);

create policy "associados_member_write" on public.associados
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager', 'member'));

create policy "associados_member_update" on public.associados
  for update using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager'));

create policy "associados_admin_delete" on public.associados
  for delete using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'));

-- =====================================================================
-- Verificação
-- =====================================================================
select 'associados' as t, count(*) from public.associados;
