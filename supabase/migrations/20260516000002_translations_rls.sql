alter table public.translations enable row level security;

-- Any authenticated user may read translations
create policy "Authenticated users can read translations"
  on public.translations for select
  to authenticated
  using (true);

-- Any authenticated user may insert/update translations (admin flow, gated by parent table access in app)
create policy "Authenticated users can insert translations"
  on public.translations for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update translations"
  on public.translations for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete translations"
  on public.translations for delete
  to authenticated
  using (true);
