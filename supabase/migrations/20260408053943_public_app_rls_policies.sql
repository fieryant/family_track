-- Ensure RLS is enabled (idempotent)
alter table if exists public.categories enable row level security;
alter table if exists public.items enable row level security;
alter table if exists public.unit_presets enable row level security;
alter table if exists public.shop_sessions enable row level security;
alter table if exists public.shop_list_items enable row level security;
alter table if exists public.purchase_history enable row level security;

-- categories
DROP POLICY IF EXISTS categories_select_public ON public.categories;
CREATE POLICY categories_select_public ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- items
DROP POLICY IF EXISTS items_select_public ON public.items;
CREATE POLICY items_select_public ON public.items
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS items_insert_public ON public.items;
CREATE POLICY items_insert_public ON public.items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS items_update_public ON public.items;
CREATE POLICY items_update_public ON public.items
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- unit_presets
DROP POLICY IF EXISTS unit_presets_select_public ON public.unit_presets;
CREATE POLICY unit_presets_select_public ON public.unit_presets
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS unit_presets_insert_public ON public.unit_presets;
CREATE POLICY unit_presets_insert_public ON public.unit_presets
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS unit_presets_update_public ON public.unit_presets;
CREATE POLICY unit_presets_update_public ON public.unit_presets
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS unit_presets_delete_public ON public.unit_presets;
CREATE POLICY unit_presets_delete_public ON public.unit_presets
  FOR DELETE TO anon, authenticated USING (true);

-- shop_sessions
DROP POLICY IF EXISTS shop_sessions_select_public ON public.shop_sessions;
CREATE POLICY shop_sessions_select_public ON public.shop_sessions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS shop_sessions_insert_public ON public.shop_sessions;
CREATE POLICY shop_sessions_insert_public ON public.shop_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS shop_sessions_update_public ON public.shop_sessions;
CREATE POLICY shop_sessions_update_public ON public.shop_sessions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- shop_list_items
DROP POLICY IF EXISTS shop_list_items_select_public ON public.shop_list_items;
CREATE POLICY shop_list_items_select_public ON public.shop_list_items
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS shop_list_items_insert_public ON public.shop_list_items;
CREATE POLICY shop_list_items_insert_public ON public.shop_list_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS shop_list_items_update_public ON public.shop_list_items;
CREATE POLICY shop_list_items_update_public ON public.shop_list_items
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS shop_list_items_delete_public ON public.shop_list_items;
CREATE POLICY shop_list_items_delete_public ON public.shop_list_items
  FOR DELETE TO anon, authenticated USING (true);

-- purchase_history
DROP POLICY IF EXISTS purchase_history_select_public ON public.purchase_history;
CREATE POLICY purchase_history_select_public ON public.purchase_history
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS purchase_history_insert_public ON public.purchase_history;
CREATE POLICY purchase_history_insert_public ON public.purchase_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);;
