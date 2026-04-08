Here's a comprehensive plan for your family market list app.

---

## App plan: Family Market List

### Core concepts

The app has two main modes: **listing mode** (throughout the month, as items run low) and **shopping mode** (at the market, checking things off). A "shop list" is a single active session that gets cleared after shopping.

---

### Database design

Here's the full schema:---

```sql
-- Categories
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  sort_order  int not null default 0
);

-- Items (master list)
create table items (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references categories(id) on delete set null,
  name              text not null,
  default_unit_type text not null, -- 'weight' | 'volume' | 'count' | 'length'
  is_active         boolean not null default true,
  sort_order        int not null default 0
);

-- Unit presets per item (e.g. 100g, 500g, 1kg for rice)
create table unit_presets (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items(id) on delete cascade,
  label       text not null,    -- display label e.g. '1 kg'
  amount      numeric not null, -- e.g. 1000
  unit        text not null,    -- base unit e.g. 'g'
  sort_order  int not null default 0
);

-- One shopping session per month
create table shop_sessions (
  id           uuid primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  is_active    boolean not null default true
);

-- Live items in the current shopping list
create table shop_list_items (
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
create table purchase_history (
  id        uuid primary key default gen_random_uuid(),
  session_id uuid not null references shop_sessions(id) on delete cascade,
  item_id   uuid not null references items(id) on delete cascade,
  amount    numeric not null,
  unit      text not null,
  bought_at timestamptz not null default now()
);

-- Indexes for common queries
create index on items(category_id);
create index on unit_presets(item_id);
create index on shop_list_items(session_id);
create index on shop_list_items(item_id);
create index on purchase_history(item_id);
create index on purchase_history(bought_at);

-- Auto-update updated_at on shop_list_items
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shop_list_items_updated_at
  before update on shop_list_items
  for each row execute function update_updated_at();
```

### Table explanations

**`categories`** — Produce, Dairy, Meat, Spices, etc. Each has an icon and a sort order so you can control display sequence.

**`items`** — The master list of everything your family might ever buy. Pre-seeded with common items. `default_unit_type` tells the UI what kind of units to offer (weight, volume, count, etc.). Items are never deleted, just toggled `is_active`.

**`unit_presets`** — Per-item quick-pick options shown when adding to the list. For rice: `[100g, 500g, 1kg, 2kg, 5kg]`. For milk: `[500ml, 1L, 2L]`. Ordered by `sort_order` so the most used one appears first.

**`shop_sessions`** — One session = one month's shopping trip. Only one session has `is_active = true` at a time. Completing a session clears the active list and logs everything to history.

**`shop_list_items`** — The live shopping list for the active session. `status` is an enum: `pending`, `bought`, `partial`, `removed`. When partially bought, `bought_amount` and `bought_unit` capture what was actually purchased.

**`purchase_history`** — Immutable record of every completed purchase, used for the monthly average usage calculation and for ranking frequently bought items at the top of the picker.

---

### Key logic

**Frequently bought items** — Query `purchase_history` grouped by `item_id`, ordered by count descending over the last 3–6 months. These float to the top of the item picker.

**Average monthly usage** — Group `purchase_history` by `item_id` and month, sum the amounts, then average across months. Show this on the item detail screen. You'll need to normalize units (grams vs kg) when aggregating.

**Clearing the shop list** — On session complete: set `shop_sessions.completed_at` and `is_active = false`, copy all `bought` and `partial` items into `purchase_history`, then create a new session. Items marked `removed` or still `pending` are not copied to history.

**Unit normalization tip** — Store a `base_unit` per item (e.g. `g` for weight items, `ml` for volume) and a `conversion_factor` per preset (100g → factor 100, 1kg → factor 1000). This makes averaging trivial.

---

### Vue + Supabase implementation plan

**Phase 1 — Foundation**
- Set up Supabase project, run migrations for all 6 tables
- Seed `categories`, `items`, and `unit_presets`
- Vue 3 + Vite project with Pinia for state, Vue Router for pages

**Phase 2 — Listing flow**
- Home screen: active shop list grouped by category
- Item picker: search + category filter, frequently bought at top
- Add-to-list flow: item → unit preset picker (or custom) → confirm

**Phase 3 — Shopping flow**
- Shopping mode: tap to mark bought, long-press for partial entry
- Edit quantity / remove from list inline
- Session complete → confirm dialog → clears list

**Phase 4 — Insights**
- Item detail: avg monthly usage chart (last 6 months)
- History screen: past sessions

---

### Suggested Supabase policies

Since this is family-only, you can keep RLS simple — either disable it and rely on the anon key being private, or add a single policy that allows all operations for authenticated users (everyone in the family signs in with a shared account or individual accounts in the same org).

---

5zwi9QsvZAwWvDOD