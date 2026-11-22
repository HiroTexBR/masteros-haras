-- =============================================================
-- Phase K · Estoque (Silos, Itens de estoque, Movimentos)
-- Deps: B_orgs_membership, set_updated_at
-- =============================================================

do $$ begin
  create type public.silo_tipo as enum ('racao', 'graos', 'silagem', 'agua', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estoque_item_tipo as enum ('racao', 'suplemento', 'medicamento', 'insumo', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estoque_mov_tipo as enum ('entrada', 'saida', 'ajuste');
exception when duplicate_object then null; end $$;

-- Silos (unidades de armazenamento)
create table if not exists public.silos (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  nome          text not null,
  tipo          public.silo_tipo not null default 'racao',
  capacidade_kg numeric(14, 2),
  nivel_kg      numeric(14, 2) not null default 0,
  localizacao   text,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists silos_org_idx on public.silos (org_id);

grant select, insert, update, delete on public.silos to authenticated;
grant all on public.silos to service_role;
alter table public.silos enable row level security;

drop policy if exists "silo_sel" on public.silos;
create policy "silo_sel" on public.silos for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "silo_ins" on public.silos;
create policy "silo_ins" on public.silos for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "silo_upd" on public.silos;
create policy "silo_upd" on public.silos for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "silo_del" on public.silos;
create policy "silo_del" on public.silos for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin'));

drop trigger if exists silo_set_updated_at on public.silos;
create trigger silo_set_updated_at before update on public.silos
  for each row execute function public.set_updated_at();

-- Itens de estoque
create table if not exists public.estoque_itens (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  nome         text not null,
  tipo         public.estoque_item_tipo not null default 'racao',
  unidade      text not null default 'kg',
  saldo_atual  numeric(14, 3) not null default 0,
  estoque_min  numeric(14, 3),
  silo_id      uuid references public.silos(id) on delete set null,
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists est_itens_org_idx on public.estoque_itens (org_id, nome);

grant select, insert, update, delete on public.estoque_itens to authenticated;
grant all on public.estoque_itens to service_role;
alter table public.estoque_itens enable row level security;

drop policy if exists "estit_sel" on public.estoque_itens;
create policy "estit_sel" on public.estoque_itens for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "estit_ins" on public.estoque_itens;
create policy "estit_ins" on public.estoque_itens for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "estit_upd" on public.estoque_itens;
create policy "estit_upd" on public.estoque_itens for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "estit_del" on public.estoque_itens;
create policy "estit_del" on public.estoque_itens for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin'));

drop trigger if exists est_itens_set_updated_at on public.estoque_itens;
create trigger est_itens_set_updated_at before update on public.estoque_itens
  for each row execute function public.set_updated_at();

-- Movimentos
create table if not exists public.estoque_movimentos (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  item_id         uuid not null references public.estoque_itens(id) on delete cascade,
  tipo            public.estoque_mov_tipo not null,
  quantidade      numeric(14, 3) not null check (quantidade > 0),
  valor_unitario  numeric(12, 2),
  valor_total     numeric(14, 2),
  data            date not null default current_date,
  referencia      text,           -- ex: 'compra','consumo','perda','ajuste_inventario'
  observacoes     text,
  created_at      timestamptz not null default now()
);
create index if not exists est_mov_item_idx on public.estoque_movimentos (item_id, data desc);
create index if not exists est_mov_org_idx  on public.estoque_movimentos (org_id, data desc);

grant select, insert, update, delete on public.estoque_movimentos to authenticated;
grant all on public.estoque_movimentos to service_role;
alter table public.estoque_movimentos enable row level security;

drop policy if exists "estmov_sel" on public.estoque_movimentos;
create policy "estmov_sel" on public.estoque_movimentos for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "estmov_ins" on public.estoque_movimentos;
create policy "estmov_ins" on public.estoque_movimentos for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "estmov_del" on public.estoque_movimentos;
create policy "estmov_del" on public.estoque_movimentos for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

-- Atualiza saldo do item automaticamente
create or replace function public.estoque_apply_movimento()
returns trigger language plpgsql as $$
declare _delta numeric;
begin
  if (tg_op = 'INSERT') then
    _delta := case new.tipo
                when 'entrada' then  new.quantidade
                when 'saida'   then -new.quantidade
                when 'ajuste'  then  new.quantidade  -- pode ser positivo/negativo? usamos como set-relative
              end;
    update public.estoque_itens
       set saldo_atual = saldo_atual + _delta
     where id = new.item_id;
    return new;
  elsif (tg_op = 'DELETE') then
    _delta := case old.tipo
                when 'entrada' then -old.quantidade
                when 'saida'   then  old.quantidade
                when 'ajuste'  then -old.quantidade
              end;
    update public.estoque_itens
       set saldo_atual = saldo_atual + _delta
     where id = old.item_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists est_mov_apply on public.estoque_movimentos;
create trigger est_mov_apply
  after insert or delete on public.estoque_movimentos
  for each row execute function public.estoque_apply_movimento();
