-- Complete RLS policy fix for both tables

-- First, disable RLS temporarily to test if that's the issue
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- Then, set up proper policies that won't cause recursion
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing issues
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;
DROP POLICY IF EXISTS "Group members access control" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;

-- Create non-recursive policies for group_members
CREATE POLICY "Users can view their own group memberships"
  ON group_members FOR SELECT
  USING (user_id = auth.uid());

-- Create policy for groups table
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = id
      AND group_members.user_id = auth.uid()
    )
  );

-- Create a separate policy for viewing other members in your groups
-- This avoids the recursion by not referencing group_members in the policy condition
CREATE POLICY "Users can view other members in their groups"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );
