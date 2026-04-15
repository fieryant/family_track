-- =====================================================
-- Functions for Lists Feature
-- Run in Supabase SQL editor after lists_rls.sql
-- =====================================================

-- Invite a user to a list by email.
-- Runs as SECURITY DEFINER so it can query auth.users,
-- which is not accessible from the client directly.
create or replace function add_list_member_by_email(p_list_id uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_caller_role text;
begin
  -- Caller must be an owner of the list
  select role into v_caller_role
  from list_members
  where list_id = p_list_id and user_id = auth.uid();

  if v_caller_role is null then
    return jsonb_build_object('error', 'You are not a member of this list');
  end if;

  if v_caller_role <> 'owner' then
    return jsonb_build_object('error', 'Only owners can invite members');
  end if;

  -- Resolve email → user id
  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email);

  if v_user_id is null then
    return jsonb_build_object('error', 'No account found with that email address');
  end if;

  -- Prevent duplicate membership
  if exists (
    select 1 from list_members where list_id = p_list_id and user_id = v_user_id
  ) then
    return jsonb_build_object('error', 'That person is already a member of this list');
  end if;

  -- Cannot invite yourself
  if v_user_id = auth.uid() then
    return jsonb_build_object('error', 'You are already the owner of this list');
  end if;

  insert into list_members (list_id, user_id, role)
  values (p_list_id, v_user_id, 'editor');

  return jsonb_build_object('success', true);
end;
$$;
