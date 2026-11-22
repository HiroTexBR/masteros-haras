-- =============================================================
-- Phase L · Saúde/Veterinário + Reprodução
-- Deps: B_orgs_membership, F_animais, set_updated_at
-- =============================================================

-- ============ SAÚDE ============
do $$ begin
  create type public.saude_tipo as enum (
    'vacina','vermifugo','exame','consulta','tratamento','procedimento','ferrageamento','outro'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.animais_saude (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  animal_id      uuid not null references public.animais(id) on delete cascade,
  tipo           public.saude_tipo not null,
  titulo         text not null,
  descricao      text,
  data_evento    date not null default current_date,
  proxima_data   date,
  veterinario    text,
  medicamento    text,
  dose           text,
  lote           text,
  custo          numeric(12,2),
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists saude_org_idx on public.animais_saude (org_id, data_evento desc);
create index if not exists saude_animal_idx on public.animais_saude (animal_id, data_evento desc);
create index if not exists saude_proxima_idx on public.animais_saude (org_id, proxima_data) where proxima_data is not null;

grant select, insert, update, delete on public.animais_saude to authenticated;
grant all on public.animais_saude to service_role;
alter table public.animais_saude enable row level security;

drop policy if exists "saude_sel" on public.animais_saude;
create policy "saude_sel" on public.animais_saude for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "saude_ins" on public.animais_saude;
create policy "saude_ins" on public.animais_saude for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "saude_upd" on public.animais_saude;
create policy "saude_upd" on public.animais_saude for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "saude_del" on public.animais_saude;
create policy "saude_del" on public.animais_saude for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists saude_set_updated_at on public.animais_saude;
create trigger saude_set_updated_at before update on public.animais_saude
  for each row execute function public.set_updated_at();

-- ============ REPRODUÇÃO ============
do $$ begin
  create type public.cobertura_tipo as enum ('natural','ia','te'); -- inseminação, transferência embrião
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cobertura_status as enum ('aguardando','confirmada','vazia','abortou','parida','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.parto_tipo as enum ('normal','distocico','cesarea','natimorto');
exception when duplicate_object then null; end $$;

-- Coberturas / gestações (uma linha por cobertura; parto vira registro separado)
create table if not exists public.reproducao_coberturas (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  femea_id           uuid not null references public.animais(id) on delete cascade,
  macho_id           uuid references public.animais(id) on delete set null,
  garanhao_externo   text,          -- nome quando macho não é cadastrado
  tipo               public.cobertura_tipo not null default 'natural',
  data_cobertura     date not null default current_date,
  previsao_parto     date,          -- pode ser preenchida automaticamente pelo app
  data_diagnostico   date,          -- diagnóstico de gestação
  status             public.cobertura_status not null default 'aguardando',
  observacoes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists cob_org_idx on public.reproducao_coberturas (org_id, data_cobertura desc);
create index if not exists cob_femea_idx on public.reproducao_coberturas (femea_id, data_cobertura desc);

grant select, insert, update, delete on public.reproducao_coberturas to authenticated;
grant all on public.reproducao_coberturas to service_role;
alter table public.reproducao_coberturas enable row level security;

drop policy if exists "cob_sel" on public.reproducao_coberturas;
create policy "cob_sel" on public.reproducao_coberturas for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "cob_ins" on public.reproducao_coberturas;
create policy "cob_ins" on public.reproducao_coberturas for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "cob_upd" on public.reproducao_coberturas;
create policy "cob_upd" on public.reproducao_coberturas for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "cob_del" on public.reproducao_coberturas;
create policy "cob_del" on public.reproducao_coberturas for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists cob_set_updated_at on public.reproducao_coberturas;
create trigger cob_set_updated_at before update on public.reproducao_coberturas
  for each row execute function public.set_updated_at();

-- Partos
create table if not exists public.reproducao_partos (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  cobertura_id   uuid references public.reproducao_coberturas(id) on delete set null,
  femea_id       uuid not null references public.animais(id) on delete cascade,
  data_parto     date not null default current_date,
  tipo           public.parto_tipo not null default 'normal',
  sexo_cria      public.animal_sexo,
  cria_animal_id uuid references public.animais(id) on delete set null,
  peso_cria_kg   numeric(6,2),
  vivo           boolean not null default true,
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists parto_org_idx on public.reproducao_partos (org_id, data_parto desc);
create index if not exists parto_femea_idx on public.reproducao_partos (femea_id, data_parto desc);

grant select, insert, update, delete on public.reproducao_partos to authenticated;
grant all on public.reproducao_partos to service_role;
alter table public.reproducao_partos enable row level security;

drop policy if exists "parto_sel" on public.reproducao_partos;
create policy "parto_sel" on public.reproducao_partos for select using (public.is_org_member(org_id, auth.uid()));
drop policy if exists "parto_ins" on public.reproducao_partos;
create policy "parto_ins" on public.reproducao_partos for insert with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "parto_upd" on public.reproducao_partos;
create policy "parto_upd" on public.reproducao_partos for update using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member')) with check (public.has_org_role(org_id, auth.uid(),'owner','admin','manager','member'));
drop policy if exists "parto_del" on public.reproducao_partos;
create policy "parto_del" on public.reproducao_partos for delete using (public.has_org_role(org_id, auth.uid(),'owner','admin','manager'));

drop trigger if exists parto_set_updated_at on public.reproducao_partos;
create trigger parto_set_updated_at before update on public.reproducao_partos
  for each row execute function public.set_updated_at();

-- Ao inserir parto, marca a cobertura como 'parida'
create or replace function public.reproducao_marcar_parida()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.cobertura_id is not null then
    update public.reproducao_coberturas
       set status = 'parida'
     where id = new.cobertura_id and org_id = new.org_id;
  end if;
  return new;
end $$;

drop trigger if exists parto_marcar_parida on public.reproducao_partos;
create trigger parto_marcar_parida after insert on public.reproducao_partos
  for each row execute function public.reproducao_marcar_parida();

-- ============ Seed módulos: saude, reproducao ============
insert into public.modules (code, name, description, icon, category, is_core, sort_order) values
  ('saude',      'Saúde / Veterinário', 'Vacinas, vermífugos, exames, consultas', 'stethoscope', 'haras', false, 75),
  ('reproducao', 'Reprodução',          'Coberturas, gestações e partos',         'heart-pulse', 'haras', false, 85)
on conflict (code) do update
  set name = excluded.name, description = excluded.description, icon = excluded.icon,
      category = excluded.category, is_core = excluded.is_core, sort_order = excluded.sort_order;

insert into public.vertical_modules (vertical_code, module_code, enabled_by_default) values
  ('haras',           'saude',       true),
  ('haras',           'reproducao',  true),
  ('fazenda',         'saude',       true),
  ('fazenda',         'reproducao',  true),
  ('centro_equestre', 'saude',       true),
  ('hipica',          'saude',       true),
  ('condominio_baias','saude',       true),
  ('comitiva',        'saude',       true)
on conflict do nothing;
