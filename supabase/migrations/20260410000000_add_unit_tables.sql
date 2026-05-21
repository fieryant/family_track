create table if not exists unit_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  label      text not null,
  sort_order int not null default 0
);

create table if not exists units (
  id           uuid primary key default gen_random_uuid(),
  unit_type_id uuid not null references unit_types(id) on delete cascade,
  symbol       text not null,
  label        text not null,
  base_factor  numeric not null default 1,
  sort_order   int not null default 0
);

create index if not exists idx_units_unit_type on units(unit_type_id);

alter table unit_types enable row level security;
alter table units enable row level security;

create policy "authenticated_all" on unit_types
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on units
  for all to authenticated using (true) with check (true);
