-- =====================================================
-- RLS for Lists Feature
-- Run in Supabase SQL editor after lists_migration.sql
-- =====================================================

alter table shopping_lists enable row level security;
alter table list_members    enable row level security;

-- ── shopping_lists ────────────────────────────────────────────────────────────
-- Allow access if the user created the list OR is a member.
-- The "created_by" clause lets INSERT...SELECT succeed before the
-- list_members row is written, avoiding an RLS violation on the returning row.
create policy "members_select_lists" on shopping_lists
  for select to authenticated
  using (
    created_by = auth.uid()
    or id in (select list_id from list_members where user_id = auth.uid())
  );

create policy "owner_insert_lists" on shopping_lists
  for insert to authenticated
  with check (created_by = auth.uid());

create policy "owner_update_lists" on shopping_lists
  for update to authenticated
  using (
    id in (select list_id from list_members where user_id = auth.uid() and role = 'owner')
  );

create policy "owner_delete_lists" on shopping_lists
  for delete to authenticated
  using (
    id in (select list_id from list_members where user_id = auth.uid() and role = 'owner')
  );

-- ── list_members ──────────────────────────────────────────────────────────────
-- Use auth.uid() directly — no subquery into list_members, no infinite recursion.
create policy "members_select_memberships" on list_members
  for select to authenticated
  using (user_id = auth.uid());

-- Users can only insert a membership for themselves
create policy "self_join_lists" on list_members
  for insert to authenticated
  with check (user_id = auth.uid());

-- Owners can remove any member; members can remove themselves
create policy "owner_or_self_delete_membership" on list_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or list_id in (
      select list_id from list_members lm
      where lm.user_id = auth.uid() and lm.role = 'owner'
    )
  );

-- ── shop_sessions ─────────────────────────────────────────────────────────────
drop policy if exists "authenticated_all" on shop_sessions;

create policy "list_members_sessions" on shop_sessions
  for all to authenticated
  using (
    list_id in (select list_id from list_members where user_id = auth.uid())
  )
  with check (
    list_id in (select list_id from list_members where user_id = auth.uid())
  );

-- ── shop_list_items ───────────────────────────────────────────────────────────
drop policy if exists "authenticated_all" on shop_list_items;

create policy "list_members_list_items" on shop_list_items
  for all to authenticated
  using (
    session_id in (
      select s.id from shop_sessions s
      where s.list_id in (select list_id from list_members where user_id = auth.uid())
    )
  )
  with check (
    session_id in (
      select s.id from shop_sessions s
      where s.list_id in (select list_id from list_members where user_id = auth.uid())
    )
  );

-- ── purchase_history ──────────────────────────────────────────────────────────
drop policy if exists "authenticated_all" on purchase_history;

create policy "list_members_history" on purchase_history
  for all to authenticated
  using (
    session_id in (
      select s.id from shop_sessions s
      where s.list_id in (select list_id from list_members where user_id = auth.uid())
    )
  )
  with check (
    session_id in (
      select s.id from shop_sessions s
      where s.list_id in (select list_id from list_members where user_id = auth.uid())
    )
  );
