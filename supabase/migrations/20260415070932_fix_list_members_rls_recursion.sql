
drop policy if exists "members_select_memberships" on list_members;

-- Use auth.uid() directly — no subquery into list_members, no recursion.
-- Users can see their own membership rows only.
create policy "members_select_memberships" on list_members
  for select to authenticated
  using (user_id = auth.uid());
;
