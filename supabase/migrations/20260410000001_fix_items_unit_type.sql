-- Replace text default_unit_type with a proper FK to unit_types
alter table items drop column if exists default_unit_type;
alter table items add column if not exists unit_type_id uuid references unit_types(id) on delete set null;
