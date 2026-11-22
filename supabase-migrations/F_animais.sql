-- =============================================================
-- Phase F · Animais (equinos, bovinos, muares, etc) + documentos
-- Deps: B_orgs_membership (is_org_member, has_org_role), set_updated_at
-- =============================================================

-- Espécie ampla (equinos, bovinos, muares, etc)
do $$ begin
  create type public.animal_especie as enum (
    'equino', 'bovino', 'muar', 'asinino', 'caprino', 'ovino', 'suino', 'outro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.animal_sexo as enum ('macho', 'femea');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.animal_status as enum (
    'ativo', 'vendido', 'morto', 'emprestado', 'inativo'
  );
exception when duplicate_object then null; end $$;

-- Categoria livre (garanhão, égua, touro, vaca, bezerro, potro, castrado…)
-- Deixamos como text pra não engessar entre espécies.

create table if not exists public.animais (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  especie           public.animal_especie not null default 'equino',
  categoria         text,        -- ex: 'garanhao','egua','potro','vaca','bezerro','touro','castrado'
  sexo              public.animal_sexo,
  nome              text not null,
  apelido           text,
  raca              text,
  pelagem           text,        -- cor/pelagem
  data_nascimento   date,
  peso_kg           numeric(8, 2),
  registro          text,        -- nº registro associação/genealógico
  chip_id           text,        -- microchip / brinco
  marca             text,        -- marca da fazenda
  proprietario      text,        -- nome livre por enquanto
  pai_id            uuid references public.animais(id) on delete set null,
  mae_id            uuid references public.animais(id) on delete set null,
  foto_url          text,
  status            public.animal_status not null default 'ativo',
  observacoes       text,
  custom            jsonb not null default '{}'::jsonb,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists animais_org_idx        on public.animais (org_id) where deleted_at is null;
create index if not exists animais_org_especie_idx on public.animais (org_id, especie) where deleted_at is null;
create index if not exists animais_org_status_idx  on public.animais (org_id, status) where deleted_at is null;
create index if not exists animais_pai_idx         on public.animais (pai_id);
create index if not exists animais_mae_idx         on public.animais (mae_id);

grant select, insert, update, delete on public.animais to authenticated;
grant all on public.animais to service_role;

alter table public.animais enable row level security;

drop policy if exists "animais_select_members" on public.animais;
create policy "animais_select_members" on public.animais
  for select using (public.is_org_member(org_id, auth.uid()) and deleted_at is null);

drop policy if exists "animais_insert_members" on public.animais;
create policy "animais_insert_members" on public.animais
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "animais_update_members" on public.animais;
create policy "animais_update_members" on public.animais
  for update using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "animais_delete_managers" on public.animais;
create policy "animais_delete_managers" on public.animais
  for delete using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager'));

drop trigger if exists animais_set_updated_at on public.animais;
create trigger animais_set_updated_at
  before update on public.animais
  for each row execute function public.set_updated_at();

-- =============================================================
-- Documentos do animal
-- (URL/link por enquanto — integração com Storage vem depois)
-- =============================================================
do $$ begin
  create type public.animal_doc_tipo as enum (
    'registro', 'exame', 'vacina', 'vermifugo', 'gta',
    'nota_fiscal', 'contrato', 'foto', 'outro'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.animais_documentos (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  animal_id      uuid not null references public.animais(id) on delete cascade,
  tipo           public.animal_doc_tipo not null default 'outro',
  titulo         text not null,
  descricao      text,
  arquivo_url    text,     -- link externo por enquanto
  data_documento date,
  validade       date,     -- p/ vacinas/exames que expiram
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists animais_docs_animal_idx on public.animais_documentos (animal_id, data_documento desc);
create index if not exists animais_docs_org_idx    on public.animais_documentos (org_id, tipo);

grant select, insert, update, delete on public.animais_documentos to authenticated;
grant all on public.animais_documentos to service_role;

alter table public.animais_documentos enable row level security;

drop policy if exists "animais_docs_select_members" on public.animais_documentos;
create policy "animais_docs_select_members" on public.animais_documentos
  for select using (public.is_org_member(org_id, auth.uid()));

drop policy if exists "animais_docs_insert_members" on public.animais_documentos;
create policy "animais_docs_insert_members" on public.animais_documentos
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "animais_docs_update_members" on public.animais_documentos;
create policy "animais_docs_update_members" on public.animais_documentos
  for update using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "animais_docs_delete_members" on public.animais_documentos;
create policy "animais_docs_delete_members" on public.animais_documentos
  for delete using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop trigger if exists animais_docs_set_updated_at on public.animais_documentos;
create trigger animais_docs_set_updated_at
  before update on public.animais_documentos
  for each row execute function public.set_updated_at();
