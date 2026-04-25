-- =====================================================
-- Pantry / Stock Tracking
-- Run in Supabase SQL editor after lists_migration.sql
-- =====================================================

create table if not exists pantry_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references shopping_lists(id) on delete cascade,
  item_id     uuid not null references items(id) on delete cascade,
  amount      numeric not null default 0,
  unit_id     uuid references units(id) on delete restrict,
  updated_at  timestamptz not null default now(),
  unique (list_id, item_id)
);

create index if not exists idx_pantry_items_list on pantry_items(list_id);
create index if not exists idx_pantry_items_item on pantry_items(item_id);

-- Auto-update updated_at
create or replace function update_pantry_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pantry_items_updated_at on pantry_items;
create trigger pantry_items_updated_at
  before update on pantry_items
  for each row execute function update_pantry_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table pantry_items enable row level security;

create policy "list_members_pantry" on pantry_items
  for all to authenticated
  using (
    list_id in (select list_id from list_members where user_id = auth.uid())
  )
  with check (
    list_id in (select list_id from list_members where user_id = auth.uid())
  );
