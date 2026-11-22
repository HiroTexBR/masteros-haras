-- =============================================================
-- Phase J · Financeiro (Receitas & Despesas)
-- Deps: B_orgs_membership, set_updated_at
-- =============================================================

do $$ begin
  create type public.lancamento_tipo as enum ('receita', 'despesa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lancamento_status as enum ('previsto', 'pago', 'cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.lancamentos (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  tipo            public.lancamento_tipo not null,
  descricao       text not null,
  categoria       text,           -- ex: 'racao','veterinario','mensalidade','venda_animal','frete'
  valor           numeric(14, 2) not null check (valor >= 0),
  data            date not null default current_date,
  data_pagamento  date,
  status          public.lancamento_status not null default 'previsto',
  forma_pagamento text,
  contraparte     text,           -- fornecedor/cliente livre
  proprietario_id uuid references public.proprietarios(id) on delete set null,
  animal_id       uuid references public.animais(id) on delete set null,
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists lancamentos_org_data_idx  on public.lancamentos (org_id, data desc);
create index if not exists lancamentos_tipo_idx      on public.lancamentos (org_id, tipo, data desc);
create index if not exists lancamentos_status_idx    on public.lancamentos (org_id, status);

grant select, insert, update, delete on public.lancamentos to authenticated;
grant all on public.lancamentos to service_role;
alter table public.lancamentos enable row level security;

drop policy if exists "lanc_sel" on public.lancamentos;
create policy "lanc_sel" on public.lancamentos for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "lanc_ins" on public.lancamentos;
create policy "lanc_ins" on public.lancamentos for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "lanc_upd" on public.lancamentos;
create policy "lanc_upd" on public.lancamentos for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "lanc_del" on public.lancamentos;
create policy "lanc_del" on public.lancamentos for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists lanc_set_updated_at on public.lancamentos;
create trigger lanc_set_updated_at before update on public.lancamentos
  for each row execute function public.set_updated_at();
