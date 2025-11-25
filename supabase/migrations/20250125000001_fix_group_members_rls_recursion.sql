-- Fix infinite recursion in group_members RLS policies
-- This migration fixes the recursion issue by checking group ownership via groups table
-- instead of querying group_members table itself

-- Fix SELECT policy - allow group owners and members to view members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members"
  ON public.group_members FOR SELECT
  USING (
    -- Users can see members if they are the group owner (check via groups table - no recursion)
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
    OR
    -- Users can always see their own membership record (direct check - no recursion)
    user_id = auth.uid()
  );

-- Fix INSERT policy - only group owners can add members
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.group_members;
CREATE POLICY "Owners and admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Check via groups table to avoid recursion
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

-- Fix UPDATE policy - only group owners can update members
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.group_members;
CREATE POLICY "Owners and admins can update members"
  ON public.group_members FOR UPDATE
  USING (
    -- Check via groups table to avoid recursion
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Prevent changing owner role unless you're the group owner
    role != 'owner' OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

-- Fix DELETE policy - only group owners can remove members (except themselves)
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.group_members;
CREATE POLICY "Owners and admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    -- Prevent removing owner
    group_members.role != 'owner' AND
    -- Check via groups table to avoid recursion
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

-- Note: The "Users can leave groups" policy is fine - it only checks user_id directly, no recursion

-- Fix USERS table policy that was causing recursion
-- The original policy queried group_members which caused infinite recursion
-- Simplified: Users can only view themselves
-- Group member visibility is handled via group_members table policies (no recursion)
DROP POLICY IF EXISTS "Users can view group members" ON public.users;
CREATE POLICY "Users can view group members"
  ON public.users FOR SELECT
  USING (users.id = auth.uid());

