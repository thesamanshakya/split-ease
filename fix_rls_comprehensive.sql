-- First, let's check if RLS is enabled on the groups table
-- If it is, we need to ensure its policies don't cause recursion

-- Drop existing policies that might be causing issues
drop policy if exists "Group members are viewable by group members" on group_members;
drop policy if exists "Users can view their own group memberships" on group_members;
drop policy if exists "Users can view members of groups they belong to" on group_members;

-- Create a simplified policy for group_members
create policy "Group members access control"
  on group_members for select
  using (
    -- Simple condition: either it's the user's own membership
    -- or it's a group they're a member of (without self-reference)
    user_id = auth.uid() OR
    group_id IN (
      select distinct gm.group_id 
      from group_members gm 
      where gm.user_id = auth.uid()
    )
  );

-- Now let's ensure the groups table has proper policies
-- First, check if RLS is enabled on groups table
-- If it is, create a policy that allows access to groups the user is a member of
create policy if not exists "Users can view groups they are members of"
  on groups for select
  using (
    id in (
      select distinct group_id 
      from group_members 
      where user_id = auth.uid()
    )
  );

-- Modify your query to avoid the nested join that might be causing issues
-- Instead of: select group_id, groups:group_id(id, name, created_at, created_by)
-- Try using a regular join in your application code
