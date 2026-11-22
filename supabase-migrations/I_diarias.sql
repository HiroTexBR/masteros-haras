-- =============================================================
-- Phase I · Diárias e Fechamento Mensal
-- Deps: B_orgs_membership, F_animais, G_proprietarios, set_updated_at
-- =============================================================

-- Valor de diária por animal (override do padrão da org)
alter table public.animais add column if not exists valor_diaria numeric(12, 2);

do $$ begin
  create type public.fechamento_status as enum ('aberto', 'fechado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fechamento_item_status as enum ('aberto', 'pago', 'cancelado');
exception when duplicate_object then null; end $$;

-- Fechamento mensal (um por mês/organização)
create table if not exists public.fechamentos_mensais (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  competencia          date not null,
  valor_diaria_default numeric(12, 2) not null check (valor_diaria_default >= 0),
  dias_no_mes          integer not null,
  status               public.fechamento_status not null default 'aberto',
  observacoes          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (org_id, competencia)
);
create index if not exists fechamentos_org_idx on public.fechamentos_mensais (org_id, competencia desc);

grant select, insert, update, delete on public.fechamentos_mensais to authenticated;
grant all on public.fechamentos_mensais to service_role;
alter table public.fechamentos_mensais enable row level security;

drop policy if exists "fech_sel" on public.fechamentos_mensais;
create policy "fech_sel" on public.fechamentos_mensais for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "fech_ins" on public.fechamentos_mensais;
create policy "fech_ins" on public.fechamentos_mensais for insert with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));
drop policy if exists "fech_upd" on public.fechamentos_mensais;
create policy "fech_upd" on public.fechamentos_mensais for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));
drop policy if exists "fech_del" on public.fechamentos_mensais;
create policy "fech_del" on public.fechamentos_mensais for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin'));

drop trigger if exists fech_set_updated_at on public.fechamentos_mensais;
create trigger fech_set_updated_at before update on public.fechamentos_mensais
  for each row execute function public.set_updated_at();

-- Itens do fechamento (uma linha por animal)
create table if not exists public.fechamento_itens (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  fechamento_id   uuid not null references public.fechamentos_mensais(id) on delete cascade,
  animal_id       uuid not null references public.animais(id) on delete cascade,
  proprietario_id uuid references public.proprietarios(id) on delete set null,
  dias            integer not null check (dias >= 0),
  valor_dia       numeric(12, 2) not null check (valor_dia >= 0),
  subtotal        numeric(14, 2) generated always as ((dias)::numeric * valor_dia) stored,
  status          public.fechamento_item_status not null default 'aberto',
  pago_em         timestamptz,
  valor_pago      numeric(12, 2),
  forma_pagamento text,
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (fechamento_id, animal_id)
);
create index if not exists fech_itens_fech_idx   on public.fechamento_itens (fechamento_id);
create index if not exists fech_itens_animal_idx on public.fechamento_itens (animal_id);
create index if not exists fech_itens_prop_idx   on public.fechamento_itens (proprietario_id);

grant select, insert, update, delete on public.fechamento_itens to authenticated;
grant all on public.fechamento_itens to service_role;
alter table public.fechamento_itens enable row level security;

drop policy if exists "fechit_sel" on public.fechamento_itens;
create policy "fechit_sel" on public.fechamento_itens for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "fechit_ins" on public.fechamento_itens;
create policy "fechit_ins" on public.fechamento_itens for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "fechit_upd" on public.fechamento_itens;
create policy "fechit_upd" on public.fechamento_itens for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "fechit_del" on public.fechamento_itens;
create policy "fechit_del" on public.fechamento_itens for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin'));

drop trigger if exists fechit_set_updated_at on public.fechamento_itens;
create trigger fechit_set_updated_at before update on public.fechamento_itens
  for each row execute function public.set_updated_at();

-- =============================================================
-- RPC · gerar_fechamento
-- Cria (ou atualiza) o fechamento do mês e insere um item por
-- animal ativo. Usa animais.valor_diaria quando definido, senão
-- o valor_default informado.
-- =============================================================
create or replace function public.gerar_fechamento(
  _org uuid,
  _competencia date,
  _valor_default numeric
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  _comp     date := date_trunc('month', _competencia)::date;
  _dias     int  := extract(day from (_comp + interval '1 month - 1 day'))::int;
  _fech_id  uuid;
  _fech_st  public.fechamento_status;
  _inserted int;
begin
  if not public.has_org_role(_org, auth.uid(),'owner','admin','manager','member') then
    raise exception 'sem permissão para gerar fechamento';
  end if;

  insert into public.fechamentos_mensais (org_id, competencia, valor_diaria_default, dias_no_mes)
  values (_org, _comp, _valor_default, _dias)
  on conflict (org_id, competencia) do update
     set valor_diaria_default = excluded.valor_diaria_default,
         dias_no_mes          = excluded.dias_no_mes
  returning id, status into _fech_id, _fech_st;

  if _fech_st = 'fechado' then
    raise exception 'fechamento já está fechado — reabra antes de regerar';
  end if;

  insert into public.fechamento_itens (org_id, fechamento_id, animal_id, proprietario_id, dias, valor_dia)
  select _org, _fech_id, a.id, a.proprietario_id, _dias,
         coalesce(a.valor_diaria, _valor_default)
  from public.animais a
  where a.org_id = _org
    and a.status = 'ativo'
    and a.deleted_at is null
  on conflict (fechamento_id, animal_id) do nothing;

  get diagnostics _inserted = row_count;
  return _inserted;
end;
$$;
grant execute on function public.gerar_fechamento(uuid, date, numeric) to authenticated;

-- RPC · marcar item pago
create or replace function public.marcar_item_fechamento_pago(
  _id uuid, _valor_pago numeric default null, _forma text default null
) returns void language plpgsql security definer set search_path = public as $$
declare _org uuid; _sub numeric;
begin
  select org_id, subtotal into _org, _sub from public.fechamento_itens where id = _id;
  if _org is null then raise exception 'item não encontrado'; end if;
  if not public.has_org_role(_org, auth.uid(),'owner','admin','manager','member') then
    raise exception 'sem permissão';
  end if;
  update public.fechamento_itens
     set status = 'pago', pago_em = now(),
         valor_pago = coalesce(_valor_pago, _sub),
         forma_pagamento = coalesce(_forma, forma_pagamento)
   where id = _id;
end;
$$;
grant execute on function public.marcar_item_fechamento_pago(uuid, numeric, text) to authenticated;

-- RPC · reabrir item (volta para 'aberto')
create or replace function public.reabrir_item_fechamento(_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare _org uuid;
begin
  select org_id into _org from public.fechamento_itens where id = _id;
  if _org is null then raise exception 'item não encontrado'; end if;
  if not public.has_org_role(_org, auth.uid(),'owner','admin','manager','member') then
    raise exception 'sem permissão';
  end if;
  update public.fechamento_itens
     set status = 'aberto', pago_em = null, valor_pago = null, forma_pagamento = null
   where id = _id;
end;
$$;
grant execute on function public.reabrir_item_fechamento(uuid) to authenticated;

-- RPC · fechar / reabrir fechamento
create or replace function public.fechar_fechamento(_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare _org uuid;
begin
  select org_id into _org from public.fechamentos_mensais where id = _id;
  if _org is null then raise exception 'fechamento não encontrado'; end if;
  if not public.has_org_role(_org, auth.uid(),'owner','admin','manager') then
    raise exception 'sem permissão';
  end if;
  update public.fechamentos_mensais set status = 'fechado' where id = _id;
end;
$$;
grant execute on function public.fechar_fechamento(uuid) to authenticated;

create or replace function public.reabrir_fechamento(_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare _org uuid;
begin
  select org_id into _org from public.fechamentos_mensais where id = _id;
  if _org is null then raise exception 'fechamento não encontrado'; end if;
  if not public.has_org_role(_org, auth.uid(),'owner','admin','manager') then
    raise exception 'sem permissão';
  end if;
  update public.fechamentos_mensais set status = 'aberto' where id = _id;
end;
$$;
grant execute on function public.reabrir_fechamento(uuid) to authenticated;
