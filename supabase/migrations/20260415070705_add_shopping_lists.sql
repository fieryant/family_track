
-- Shopping lists (owned by a user, shareable via invite code)
create table if not exists shopping_lists (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  created_by   uuid not null references auth.users(id) on delete cascade,
  invite_code  text not null unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Members of a list (owner inserted automatically on list creation)
create table if not exists list_members (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references shopping_lists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  joined_at  timestamptz not null default now(),
  unique (list_id, user_id)
);

-- Link sessions to a list
alter table shop_sessions
  add column if not exists list_id uuid references shopping_lists(id) on delete cascade;

-- Indexes
create index if not exists idx_shopping_lists_created_by on shopping_lists(created_by);
create index if not exists idx_list_members_user         on list_members(user_id);
create index if not exists idx_list_members_list         on list_members(list_id);
create index if not exists idx_shop_sessions_list        on shop_sessions(list_id);

-- Auto-update updated_at on shopping_lists
create or replace function update_shopping_lists_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shopping_lists_updated_at on shopping_lists;
create trigger shopping_lists_updated_at
  before update on shopping_lists
  for each row execute function update_shopping_lists_updated_at();
;
