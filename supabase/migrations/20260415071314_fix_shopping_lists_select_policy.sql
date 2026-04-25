
drop policy if exists "members_select_lists" on shopping_lists;

-- Allow access if the user created the list OR is a member.
-- The "created_by" clause lets the INSERT...SELECT succeed before the
-- list_members row is written, avoiding an RLS violation on the returning row.
create policy "members_select_lists" on shopping_lists
  for select to authenticated
  using (
    created_by = auth.uid()
    or id in (select list_id from list_members where user_id = auth.uid())
  );
;
