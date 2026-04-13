-- =====================================================
-- Row Level Security — run this in the Supabase SQL editor
-- after applying migration.sql
-- =====================================================
-- Policy: any authenticated user can read/write all data
-- (shared family data, not per-user isolation)

alter table categories        enable row level security;
alter table unit_types        enable row level security;
alter table units             enable row level security;
alter table items             enable row level security;
alter table unit_presets      enable row level security;
alter table shop_sessions     enable row level security;
alter table shop_list_items   enable row level security;
alter table purchase_history  enable row level security;

create policy "authenticated_all" on categories       for all to authenticated using (true) with check (true);
create policy "authenticated_all" on unit_types       for all to authenticated using (true) with check (true);
create policy "authenticated_all" on units            for all to authenticated using (true) with check (true);
create policy "authenticated_all" on items            for all to authenticated using (true) with check (true);
create policy "authenticated_all" on unit_presets     for all to authenticated using (true) with check (true);
create policy "authenticated_all" on shop_sessions    for all to authenticated using (true) with check (true);
create policy "authenticated_all" on shop_list_items  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on purchase_history for all to authenticated using (true) with check (true);
