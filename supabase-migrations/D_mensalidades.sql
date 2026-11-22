-- =============================================================
-- Phase D · Mensalidades (cobranças mensais dos associados)
-- Deps: B_orgs_membership (is_org_member, has_org_role, app_role),
--       C_associados (associados table, set_updated_at).
-- =============================================================

do $$ begin
  create type public.mensalidade_status as enum ('aberta', 'paga', 'atrasada', 'cancelada');
exception when duplicate_object then null; end $$;

create table if not exists public.mensalidades (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  associado_id  uuid not null references public.associados(id) on delete cascade,
  competencia   date not null, -- normalizada para o dia 1 do mês
  vencimento    date not null,
  valor         numeric(12, 2) not null check (valor >= 0),
  status        public.mensalidade_status not null default 'aberta',
  pago_em       timestamptz,
  valor_pago    numeric(12, 2),
  forma_pagamento text,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, associado_id, competencia)
);

create index if not exists mensalidades_org_comp_idx    on public.mensalidades (org_id, competencia desc);
create index if not exists mensalidades_associado_idx   on public.mensalidades (associado_id, competencia desc);
create index if not exists mensalidades_status_idx      on public.mensalidades (org_id, status);

grant select, insert, update, delete on public.mensalidades to authenticated;
grant all on public.mensalidades to service_role;

alter table public.mensalidades enable row level security;

drop policy if exists "mensalidades_select_members" on public.mensalidades;
create policy "mensalidades_select_members" on public.mensalidades
  for select using (public.is_org_member(org_id, auth.uid()));

drop policy if exists "mensalidades_insert_members" on public.mensalidades;
create policy "mensalidades_insert_members" on public.mensalidades
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager', 'member'));

drop policy if exists "mensalidades_update_members" on public.mensalidades;
create policy "mensalidades_update_members" on public.mensalidades
  for update using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner', 'admin', 'manager'));

drop policy if exists "mensalidades_delete_admins" on public.mensalidades;
create policy "mensalidades_delete_admins" on public.mensalidades
  for delete using (public.has_org_role(org_id, auth.uid(), 'owner', 'admin'));

-- updated_at
drop trigger if exists mensalidades_set_updated_at on public.mensalidades;
create trigger mensalidades_set_updated_at
  before update on public.mensalidades
  for each row execute function public.set_updated_at();

-- auto-marca 'atrasada' quando insere aberta com vencimento passado
create or replace function public.mensalidades_auto_status()
returns trigger language plpgsql as $$
begin
  if new.status = 'aberta' and new.vencimento < current_date then
    new.status := 'atrasada';
  end if;
  return new;
end;
$$;

drop trigger if exists mensalidades_before_ins on public.mensalidades;
create trigger mensalidades_before_ins
  before insert on public.mensalidades
  for each row execute function public.mensalidades_auto_status();

-- =============================================================
-- Bulk generate: cria mensalidade para todos os associados ativos
-- =============================================================
create or replace function public.gerar_mensalidades(
  _org uuid,
  _competencia date,
  _vencimento  date,
  _valor       numeric
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _comp date := date_trunc('month', _competencia)::date;
  _inserted integer;
begin
  if not public.has_org_role(_org, auth.uid(), 'owner', 'admin', 'manager', 'member') then
    raise exception 'sem permissão para gerar mensalidades nesta organização';
  end if;

  insert into public.mensalidades (org_id, associado_id, competencia, vencimento, valor)
  select _org, a.id, _comp, _vencimento, _valor
  from public.associados a
  where a.org_id = _org
    and a.status = 'ativo'
    and a.deleted_at is null
  on conflict (org_id, associado_id, competencia) do nothing;

  get diagnostics _inserted = row_count;
  return _inserted;
end;
$$;

grant execute on function public.gerar_mensalidades(uuid, date, date, numeric) to authenticated;

-- =============================================================
-- Marcar mensalidade como paga
-- =============================================================
create or replace function public.marcar_paga(
  _id uuid,
  _valor_pago numeric default null,
  _forma text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _org uuid;
  _valor numeric;
begin
  select org_id, valor into _org, _valor from public.mensalidades where id = _id;
  if _org is null then
    raise exception 'mensalidade não encontrada';
  end if;
  if not public.has_org_role(_org, auth.uid(), 'owner', 'admin', 'manager', 'member') then
    raise exception 'sem permissão';
  end if;

  update public.mensalidades
     set status = 'paga',
         pago_em = now(),
         valor_pago = coalesce(_valor_pago, _valor),
         forma_pagamento = coalesce(_forma, forma_pagamento)
   where id = _id;
end;
$$;

grant execute on function public.marcar_paga(uuid, numeric, text) to authenticated;
