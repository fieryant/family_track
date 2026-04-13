-- =====================================================
-- Family Market List — Full Schema Migration
-- Run this in your Supabase SQL editor
-- =====================================================

-- Categories
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  sort_order  int not null default 0
);

-- Unit types (weight | volume | count | length)
create table if not exists unit_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique, -- e.g. 'weight'
  label       text not null,        -- e.g. 'Weight'
  sort_order  int not null default 0
);

-- Units (individual units belonging to a type)
create table if not exists units (
  id            uuid primary key default gen_random_uuid(),
  unit_type_id  uuid not null references unit_types(id) on delete cascade,
  symbol        text not null,        -- e.g. 'g', 'kg', 'ml', 'L', 'pcs'
  label         text not null,        -- e.g. 'Gram', 'Kilogram'
  base_factor   numeric not null default 1, -- multiplier to convert to base unit
  sort_order    int not null default 0,
  unique (unit_type_id, symbol)
);

-- Items (master list)
create table if not exists items (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references categories(id) on delete set null,
  name             text not null,
  unit_type_id     uuid references unit_types(id) on delete set null,
  is_active        boolean not null default true,
  sort_order       int not null default 0
);

-- Unit presets per item (e.g. 100g, 500g, 1kg for rice)
create table if not exists unit_presets (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items(id) on delete cascade,
  label       text not null,    -- display label e.g. '1 kg'
  amount      numeric not null, -- e.g. 1000
  unit_id     uuid not null references units(id) on delete restrict,
  sort_order  int not null default 0
);

-- One shopping session per month
create table if not exists shop_sessions (
  id           uuid primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  is_active    boolean not null default true
);

-- Live items in the current shopping list
create table if not exists shop_list_items (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references shop_sessions(id) on delete cascade,
  item_id          uuid not null references items(id) on delete cascade,
  requested_amount numeric not null,
  requested_unit   text not null,
  status           text not null default 'pending', -- 'pending' | 'bought' | 'partial' | 'removed'
  bought_amount    numeric,
  bought_unit      text,
  note             text,
  added_at         timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (session_id, item_id)
);

-- Immutable purchase log (used for avg usage and frequency ranking)
create table if not exists purchase_history (
  id        uuid primary key default gen_random_uuid(),
  session_id uuid not null references shop_sessions(id) on delete cascade,
  item_id   uuid not null references items(id) on delete cascade,
  amount    numeric not null,
  unit      text not null,
  bought_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_units_type on units(unit_type_id);
create index if not exists idx_items_category on items(category_id);
create index if not exists idx_items_unit_type on items(unit_type_id);
create index if not exists idx_unit_presets_item on unit_presets(item_id);
create index if not exists idx_unit_presets_unit on unit_presets(unit_id);
create index if not exists idx_shop_list_items_session on shop_list_items(session_id);
create index if not exists idx_shop_list_items_item on shop_list_items(item_id);
create index if not exists idx_purchase_history_item on purchase_history(item_id);
create index if not exists idx_purchase_history_bought_at on purchase_history(bought_at);

-- Auto-update updated_at on shop_list_items
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shop_list_items_updated_at on shop_list_items;
create trigger shop_list_items_updated_at
  before update on shop_list_items
  for each row execute function update_updated_at();
