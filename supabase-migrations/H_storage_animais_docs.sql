-- =============================================================
-- Phase H · Storage bucket "animais-docs" (documentos dos animais)
-- Path convention: {org_id}/{animal_id}/{uuid}-{filename}
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('animais-docs', 'animais-docs', false, 20 * 1024 * 1024)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- helpers: primeiro segmento do path = org_id
-- (evita repetir split_part em cada policy)

-- SELECT: qualquer membro da org dona do path
drop policy if exists "animais-docs read" on storage.objects;
create policy "animais-docs read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'animais-docs'
    and public.is_org_member(
      (split_part(name, '/', 1))::uuid,
      auth.uid()
    )
  );

-- INSERT: member+ da org
drop policy if exists "animais-docs upload" on storage.objects;
create policy "animais-docs upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'animais-docs'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      auth.uid(),
      'owner','admin','manager','member'
    )
  );

-- UPDATE: member+ (raro, mas útil p/ metadata)
drop policy if exists "animais-docs update" on storage.objects;
create policy "animais-docs update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'animais-docs'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      auth.uid(),
      'owner','admin','manager','member'
    )
  );

-- DELETE: member+
drop policy if exists "animais-docs delete" on storage.objects;
create policy "animais-docs delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'animais-docs'
    and public.has_org_role(
      (split_part(name, '/', 1))::uuid,
      auth.uid(),
      'owner','admin','manager','member'
    )
  );

-- =============================================================
-- animais_documentos: guarda o path do storage (além do url externo)
-- =============================================================
alter table public.animais_documentos
  add column if not exists arquivo_path text,
  add column if not exists arquivo_mime text,
  add column if not exists arquivo_tamanho bigint;
