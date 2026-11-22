-- =====================================================================
-- MasterOS — Fase A1: Infraestrutura Modular
-- Cole ESTE arquivo inteiro no SQL Editor do seu projeto Supabase e rode.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- =====================================================================

-- 1) Enum de roles (para user_roles, criado numa fase posterior mas já deixamos preparado)
do $$ begin
  create type public.app_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
exception when duplicate_object then null; end $$;

-- 2) Verticais
create table if not exists public.verticals (
  code        text primary key,
  name        text not null,
  description text,
  icon        text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 3) Catálogo global de módulos
create table if not exists public.modules (
  code        text primary key,
  name        text not null,
  description text,
  icon        text,
  category    text not null,          -- 'core' | 'financeiro' | 'haras' | 'associacao' | 'operacional' | 'extra'
  is_core     boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- 4) Templates padrão por vertical
create table if not exists public.vertical_modules (
  vertical_code text not null references public.verticals(code) on delete cascade,
  module_code   text not null references public.modules(code)   on delete cascade,
  enabled_by_default boolean not null default true,
  primary key (vertical_code, module_code)
);

-- 5) Organizações (mínimo pra amarrar org_modules — evolui na Fase B)
create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  vertical_code text references public.verticals(code),
  owner_id     uuid,                     -- vira FK para auth.users depois
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 6) Módulos ativos por org
create table if not exists public.organization_modules (
  org_id      uuid not null references public.organizations(id) on delete cascade,
  module_code text not null references public.modules(code)     on delete cascade,
  enabled     boolean not null default true,
  settings    jsonb   not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (org_id, module_code)
);

-- =====================================================================
-- GRANTS (obrigatório para Data API)
-- =====================================================================
grant select on public.verticals        to anon, authenticated;
grant select on public.modules          to anon, authenticated;
grant select on public.vertical_modules to anon, authenticated;
grant all    on public.verticals        to service_role;
grant all    on public.modules          to service_role;
grant all    on public.vertical_modules to service_role;

grant select, insert, update, delete on public.organizations         to authenticated;
grant select, insert, update, delete on public.organization_modules  to authenticated;
grant all on public.organizations        to service_role;
grant all on public.organization_modules to service_role;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.verticals        enable row level security;
alter table public.modules          enable row level security;
alter table public.vertical_modules enable row level security;
alter table public.organizations         enable row level security;
alter table public.organization_modules  enable row level security;

-- Catálogo global: leitura pública autenticada (e anon pra landing)
drop policy if exists "verticals_read_all"        on public.verticals;
drop policy if exists "modules_read_all"          on public.modules;
drop policy if exists "vertical_modules_read_all" on public.vertical_modules;
create policy "verticals_read_all"        on public.verticals        for select using (true);
create policy "modules_read_all"          on public.modules          for select using (true);
create policy "vertical_modules_read_all" on public.vertical_modules for select using (true);

-- Orgs: owner-only por enquanto (evolui pra membership na Fase B)
drop policy if exists "orgs_owner_all" on public.organizations;
create policy "orgs_owner_all" on public.organizations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "org_modules_owner_all" on public.organization_modules;
create policy "org_modules_owner_all" on public.organization_modules
  for all
  using (exists (select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid()));

-- =====================================================================
-- Funções SECURITY DEFINER (usadas por RLS de outras tabelas nas fases futuras)
-- =====================================================================
create or replace function public.org_has_module(_org uuid, _code text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_modules
     where org_id = _org and module_code = _code and enabled = true
  );
$$;

create or replace function public.toggle_module(_org uuid, _code text, _enabled boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.organizations where id = _org and owner_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  insert into public.organization_modules (org_id, module_code, enabled)
       values (_org, _code, _enabled)
  on conflict (org_id, module_code) do update
     set enabled = excluded.enabled, updated_at = now();
end;
$$;

grant execute on function public.org_has_module(uuid, text) to authenticated, anon;
grant execute on function public.toggle_module(uuid, text, boolean) to authenticated;

-- =====================================================================
-- SEEDS — 7 verticais
-- =====================================================================
insert into public.verticals (code, name, description, icon, sort_order) values
  ('haras',            'Haras',                'Criação e gestão de equinos',                'horse',   10),
  ('associacao',       'Associação',           'Associações equestres e de raça',            'users',   20),
  ('comitiva',         'Comitiva',             'Comitivas e cavalgadas',                     'flag',    30),
  ('fazenda',          'Fazenda',              'Fazenda com atividade equestre',             'wheat',   40),
  ('centro_equestre',  'Centro de Treinamento','Centros de treinamento e escola',            'target',  50),
  ('hipica',           'Hípica',               'Hípicas e clubes',                           'trophy',  60),
  ('condominio_baias', 'Condomínio de Baias',  'Condomínio equestre / baias por cotas',      'home',    70)
on conflict (code) do update
  set name = excluded.name, description = excluded.description,
      icon = excluded.icon, sort_order = excluded.sort_order;

-- =====================================================================
-- SEEDS — 16 módulos
-- =====================================================================
insert into public.modules (code, name, description, icon, category, is_core, sort_order) values
  -- core (5)
  ('dashboard',      'Dashboard',      'Visão geral e KPIs',                     'layout-dashboard', 'core',        true,  10),
  ('configuracoes',  'Configurações',  'Perfil, organização, módulos, integrações','settings',       'core',        true,  20),
  ('notificacoes',   'Notificações',   'Central de notificações',                'bell',             'core',        true,  30),
  ('auditoria',      'Auditoria',      'Log completo de ações',                  'shield-check',     'core',        true,  40),
  ('privacidade',    'Privacidade / LGPD','Exportação e exclusão de dados',      'lock',             'core',        true,  50),

  -- financeiro (1)
  ('financeiro',     'Financeiro',     'Receitas, despesas, fechamento, cobranças','wallet',         'financeiro',  false, 60),

  -- haras (3)
  ('animais',        'Animais',        'Cadastro, saúde, genealogia',            'horse',            'haras',       false, 70),
  ('proprietarios',  'Proprietários',  'Proprietários e extrato',                'user-square',      'haras',       false, 80),
  ('diarias',        'Diárias e Fechamento','Diárias, silo e fechamento mensal', 'calendar-days',    'haras',       false, 90),

  -- associação (2)
  ('associacao',     'Associação',     'Associados, categorias, diretoria',      'users-round',      'associacao',  false, 100),
  ('mensalidades',   'Mensalidades e Cobranças','Mensalidades, PIX, WhatsApp',   'credit-card',      'associacao',  false, 110),

  -- operacional (4)
  ('estoque',        'Estoque',        'Produtos e movimentações',               'package',          'operacional', false, 120),
  ('compras',        'Compras',        'Pedidos e recebimento',                  'shopping-cart',    'operacional', false, 130),
  ('agenda',         'Agenda',         'Eventos, lembretes, recorrência',        'calendar',         'operacional', false, 140),
  ('funcionarios',   'Funcionários',   'Cadastro, cargo, folha',                 'briefcase',        'operacional', false, 150),

  -- extras (1)
  ('masteria',       'MasterIA',       'Assistente inteligente',                 'sparkles',         'extra',       false, 160)
on conflict (code) do update
  set name = excluded.name, description = excluded.description, icon = excluded.icon,
      category = excluded.category, is_core = excluded.is_core, sort_order = excluded.sort_order;

-- =====================================================================
-- SEEDS — vertical_modules (o que liga por padrão em cada vertical)
-- Core sempre liga em todas.
-- =====================================================================
insert into public.vertical_modules (vertical_code, module_code, enabled_by_default)
select v.code, m.code, true
  from public.verticals v cross join public.modules m
 where m.is_core = true
on conflict do nothing;

insert into public.vertical_modules (vertical_code, module_code, enabled_by_default) values
  -- haras
  ('haras',           'financeiro',    true),
  ('haras',           'animais',       true),
  ('haras',           'proprietarios', true),
  ('haras',           'diarias',       true),
  ('haras',           'estoque',       true),
  ('haras',           'agenda',        true),
  ('haras',           'funcionarios',  true),
  -- associação
  ('associacao',      'financeiro',    true),
  ('associacao',      'associacao',    true),
  ('associacao',      'mensalidades',  true),
  ('associacao',      'agenda',        true),
  -- comitiva
  ('comitiva',        'financeiro',    true),
  ('comitiva',        'agenda',        true),
  ('comitiva',        'animais',       true),
  -- fazenda
  ('fazenda',         'financeiro',    true),
  ('fazenda',         'animais',       true),
  ('fazenda',         'estoque',       true),
  ('fazenda',         'compras',       true),
  ('fazenda',         'funcionarios',  true),
  -- centro equestre
  ('centro_equestre', 'financeiro',    true),
  ('centro_equestre', 'animais',       true),
  ('centro_equestre', 'agenda',        true),
  ('centro_equestre', 'funcionarios',  true),
  -- hípica
  ('hipica',          'financeiro',    true),
  ('hipica',          'animais',       true),
  ('hipica',          'agenda',        true),
  ('hipica',          'mensalidades',  true),
  -- condomínio de baias
  ('condominio_baias','financeiro',    true),
  ('condominio_baias','animais',       true),
  ('condominio_baias','proprietarios', true),
  ('condominio_baias','mensalidades',  true)
on conflict do nothing;

-- =====================================================================
-- Backfill: se já existirem orgs, ativa módulos core em todas
-- =====================================================================
insert into public.organization_modules (org_id, module_code, enabled)
select o.id, m.code, true
  from public.organizations o cross join public.modules m
 where m.is_core = true
on conflict do nothing;

-- =====================================================================
-- Verificação
-- =====================================================================
select 'verticals'         as t, count(*) from public.verticals
union all select 'modules', count(*)          from public.modules
union all select 'vertical_modules', count(*) from public.vertical_modules;
-- Esperado: 7, 16, 47
