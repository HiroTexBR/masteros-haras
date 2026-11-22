-- =============================================================
-- Phase M · Funcionários, Compras (fornecedores + pedidos), Notificações
-- Deps: B_orgs_membership, set_updated_at
-- =============================================================

-- ============ FUNCIONÁRIOS ============
do $$ begin
  create type public.funcionario_status as enum ('ativo','ferias','afastado','desligado');
exception when duplicate_object then null; end $$;

create table if not exists public.funcionarios (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  nome            text not null,
  cpf             text,
  rg              text,
  cargo           text,
  salario         numeric(12,2),
  data_admissao   date,
  data_demissao   date,
  telefone        text,
  email           text,
  endereco        text,
  chave_pix       text,
  observacoes     text,
  status          public.funcionario_status not null default 'ativo',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists func_org_idx on public.funcionarios (org_id, nome);

grant select, insert, update, delete on public.funcionarios to authenticated;
grant all on public.funcionarios to service_role;
alter table public.funcionarios enable row level security;

drop policy if exists "func_sel" on public.funcionarios;
create policy "func_sel" on public.funcionarios for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "func_ins" on public.funcionarios;
create policy "func_ins" on public.funcionarios for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));
drop policy if exists "func_upd" on public.funcionarios;
create policy "func_upd" on public.funcionarios for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));
drop policy if exists "func_del" on public.funcionarios;
create policy "func_del" on public.funcionarios for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin'));

drop trigger if exists func_set_updated_at on public.funcionarios;
create trigger func_set_updated_at before update on public.funcionarios
  for each row execute function public.set_updated_at();

-- ============ FORNECEDORES ============
create table if not exists public.fornecedores (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  nome            text not null,
  cnpj_cpf        text,
  contato         text,
  telefone        text,
  email           text,
  endereco        text,
  categoria       text,
  observacoes     text,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists forn_org_idx on public.fornecedores (org_id, nome);

grant select, insert, update, delete on public.fornecedores to authenticated;
grant all on public.fornecedores to service_role;
alter table public.fornecedores enable row level security;

drop policy if exists "forn_sel" on public.fornecedores;
create policy "forn_sel" on public.fornecedores for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "forn_ins" on public.fornecedores;
create policy "forn_ins" on public.fornecedores for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "forn_upd" on public.fornecedores;
create policy "forn_upd" on public.fornecedores for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "forn_del" on public.fornecedores;
create policy "forn_del" on public.fornecedores for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists forn_set_updated_at on public.fornecedores;
create trigger forn_set_updated_at before update on public.fornecedores
  for each row execute function public.set_updated_at();

-- ============ COMPRAS (pedidos) ============
do $$ begin
  create type public.compra_status as enum ('pendente','pedido','recebido','cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.compras (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  fornecedor_id   uuid references public.fornecedores(id) on delete set null,
  descricao       text not null,
  categoria       text,
  quantidade      numeric(12,3) not null default 1,
  unidade         text,
  valor_unitario  numeric(12,2) not null default 0,
  valor_total     numeric(14,2) generated always as (quantidade * valor_unitario) stored,
  data_pedido     date not null default current_date,
  data_prevista   date,
  data_recebida   date,
  status          public.compra_status not null default 'pendente',
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists compras_org_idx on public.compras (org_id, data_pedido desc);
create index if not exists compras_status_idx on public.compras (org_id, status);

grant select, insert, update, delete on public.compras to authenticated;
grant all on public.compras to service_role;
alter table public.compras enable row level security;

drop policy if exists "compras_sel" on public.compras;
create policy "compras_sel" on public.compras for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "compras_ins" on public.compras;
create policy "compras_ins" on public.compras for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "compras_upd" on public.compras;
create policy "compras_upd" on public.compras for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "compras_del" on public.compras;
create policy "compras_del" on public.compras for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists compras_set_updated_at on public.compras;
create trigger compras_set_updated_at before update on public.compras
  for each row execute function public.set_updated_at();

-- ============ NOTIFICAÇÕES ============
do $$ begin
  create type public.notif_tipo as enum ('info','sucesso','alerta','erro');
exception when duplicate_object then null; end $$;

create table if not exists public.notificacoes (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade, -- null = broadcast p/ toda org
  tipo            public.notif_tipo not null default 'info',
  titulo          text not null,
  mensagem        text,
  link            text,
  related_type    text,
  related_id      uuid,
  lida            boolean not null default false,
  lida_em         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notificacoes (org_id, user_id, lida, created_at desc);

grant select, insert, update, delete on public.notificacoes to authenticated;
grant all on public.notificacoes to service_role;
alter table public.notificacoes enable row level security;

-- ler: apenas destinatário (user_id) ou broadcast (user_id null) da org
drop policy if exists "notif_sel" on public.notificacoes;
create policy "notif_sel" on public.notificacoes for select
  using (public.is_org_member(org_id, auth.uid()) and (user_id is null or user_id = auth.uid()));

-- criar: membros da org podem gerar notificações (ex.: sistema/manager)
drop policy if exists "notif_ins" on public.notificacoes;
create policy "notif_ins" on public.notificacoes for insert
  with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));

-- atualizar: só o destinatário (para marcar como lida)
drop policy if exists "notif_upd" on public.notificacoes;
create policy "notif_upd" on public.notificacoes for update
  using (public.is_org_member(org_id, auth.uid()) and (user_id is null or user_id = auth.uid()))
  with check (public.is_org_member(org_id, auth.uid()) and (user_id is null or user_id = auth.uid()));

drop policy if exists "notif_del" on public.notificacoes;
create policy "notif_del" on public.notificacoes for delete
  using (public.is_org_member(org_id, auth.uid()) and (user_id is null or user_id = auth.uid()));
