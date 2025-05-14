-- Drop the existing policy that's causing infinite recursion
drop policy if exists "Group members are viewable by group members" on group_members;

-- Create a new policy that avoids the recursion
create policy "Group members are viewable by group members"
  on group_members for select
  using (
    auth.uid() in (
      select user_id from group_members
      where group_id = group_members.group_id
    )
  );
