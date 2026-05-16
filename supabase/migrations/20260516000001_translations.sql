create table public.translations (
  entity_type text not null,
  entity_id   uuid not null,
  locale      text not null check (locale in ('en', 'bn')),
  field       text not null default 'name',
  value       text not null,
  updated_at  timestamptz not null default now(),
  primary key (entity_type, entity_id, locale, field)
);

create index translations_entity_idx on public.translations (entity_type, entity_id);
create index translations_locale_idx  on public.translations (locale);
create index translations_value_lower_idx on public.translations (entity_type, lower(value));

-- Backfill existing item names as English
insert into public.translations (entity_type, entity_id, locale, field, value)
  select 'item', id, 'en', 'name', name from public.items
  on conflict do nothing;
