-- Drop the existing policy that's causing infinite recursion
drop policy if exists "Group members are viewable by group members" on group_members;

-- Create a new policy using a completely different approach
-- This policy allows users to view group_members records where they are the user_id
create policy "Users can view their own group memberships"
  on group_members for select
  using (user_id = auth.uid());

-- This policy allows users to view other members in groups they belong to
create policy "Users can view members of groups they belong to"
  on group_members for select
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );
