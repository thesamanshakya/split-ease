-- Add foreign key relationship between group_members and profiles
alter table group_members
  add constraint group_members_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;

-- Update the RLS policy to use the new relationship
drop policy if exists "Group members are viewable by group members" on group_members;
create policy "Group members are viewable by group members"
  on group_members for select
  using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  ); 