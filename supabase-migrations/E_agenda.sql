-- =============================================================
-- Phase E · Agenda (eventos da organização)
-- Deps: B_orgs_membership (is_org_member, has_org_role), set_updated_at
-- =============================================================

do $$ begin
  create type public.evento_tipo as enum ('reuniao', 'evento', 'tarefa', 'lembrete', 'outro');
exception when duplicate_object then null; end $$;

create table if not exists public.eventos (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  titulo       text not null,
  descricao    text,
  tipo         public.evento_tipo not null default 'evento',
  inicio       timestamptz not null,
  fim          timestamptz,
  dia_inteiro  boolean not null default false,
  local        text,
  cor          text, -- hex opcional para colorir no calendário
  criado_por   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);

create index if not exists eventos_org_inicio_idx on public.eventos (org_id, inicio);
create index if not exists eventos_org_tipo_idx   on public.eventos (org_id, tipo);

grant select, insert, update, delete on public.eventos to authenticated;
grant all on public.eventos to service_role;

alter table public.eventos enable row level security;

drop policy if exists "eventos_select_members" on public.eventos;
create policy "eventos_select_members" on public.eventos
  for select using (public.is_org_member(org_id, auth.uid()));

drop policy if exists "eventos_insert_members" on public.eventos;
create policy "eventos_insert_members" on public.eventos
  for insert with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "eventos_update_members" on public.eventos;
create policy "eventos_update_members" on public.eventos
  for update using (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'))
       with check (public.has_org_role(org_id, auth.uid(), 'owner','admin','manager','member'));

drop policy if exists "eventos_delete_managers" on public.eventos;
create policy "eventos_delete_managers" on public.eventos
  for delete using (
    public.has_org_role(org_id, auth.uid(), 'owner','admin','manager')
    or criado_por = auth.uid()
  );

drop trigger if exists eventos_set_updated_at on public.eventos;
create trigger eventos_set_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();
