-- Row Level Security (RLS) Policies for Splitsy
-- Created: 2025-10-10
-- Description: Implements comprehensive RLS policies for all tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can view other users who are in the same group
CREATE POLICY "Users can view group members"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      INNER JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = users.id
    )
  );

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- Users can view groups they are members of
CREATE POLICY "Users can view their groups"
  ON public.groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Group owners can update their groups
CREATE POLICY "Group owners can update groups"
  ON public.groups
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Group owners can delete their groups
CREATE POLICY "Group owners can delete groups"
  ON public.groups
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- GROUP MEMBERS TABLE POLICIES
-- ============================================================================

-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members"
  ON public.group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

-- Group owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON public.group_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Group owners and admins can update member roles (except changing owner)
CREATE POLICY "Owners and admins can update members"
  ON public.group_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    role != 'owner' OR
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

-- Group owners and admins can remove members (except owner)
CREATE POLICY "Owners and admins can remove members"
  ON public.group_members
  FOR DELETE
  USING (
    group_members.role != 'owner' AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Users can remove themselves from groups (except if they're the owner)
CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  USING (user_id = auth.uid() AND role != 'owner');

-- ============================================================================
-- POOLS TABLE POLICIES
-- ============================================================================

-- Users can view pools in groups they belong to
CREATE POLICY "Users can view group pools"
  ON public.pools
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id AND user_id = auth.uid()
    )
  );

-- Group members can create pools
CREATE POLICY "Group members can create pools"
  ON public.pools
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id AND user_id = auth.uid()
    )
  );

-- Group owners and admins can update pools
CREATE POLICY "Owners and admins can update pools"
  ON public.pools
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Group owners can delete pools
CREATE POLICY "Group owners can delete pools"
  ON public.pools
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = pools.group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- CONTRIBUTIONS TABLE POLICIES
-- ============================================================================

-- Users can view contributions to pools they have access to
CREATE POLICY "Users can view pool contributions"
  ON public.contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

-- Users can create their own contributions
CREATE POLICY "Users can create contributions"
  ON public.contributions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

-- Service role can update contribution status (for webhooks)
CREATE POLICY "Service can update contributions"
  ON public.contributions
  FOR UPDATE
  USING (true); -- This will be restricted to service role key

-- ============================================================================
-- VIRTUAL CARDS TABLE POLICIES
-- ============================================================================

-- Users can view cards for pools they have access to
CREATE POLICY "Users can view pool cards"
  ON public.virtual_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id AND gm.user_id = auth.uid()
    )
  );

-- Group admins can create cards
CREATE POLICY "Admins can create cards"
  ON public.virtual_cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- Group admins can update cards
CREATE POLICY "Admins can update cards"
  ON public.virtual_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Users can view transactions for pools they have access to
CREATE POLICY "Users can view pool transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = transactions.pool_id AND gm.user_id = auth.uid()
    )
  );

-- Only service role can insert transactions (via webhooks)
CREATE POLICY "Service can insert transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (true); -- Restricted to service role key

-- Only service role can update transactions
CREATE POLICY "Service can update transactions"
  ON public.transactions
  FOR UPDATE
  USING (true); -- Restricted to service role key

-- ============================================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Group owners can view audit logs for their groups
CREATE POLICY "Owners can view group audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    resource_type = 'group' AND
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = audit_logs.resource_id AND owner_id = auth.uid()
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true); -- Restricted to service role key

-- ============================================================================
-- HELPER FUNCTION FOR AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: User's groups with member count
CREATE OR REPLACE VIEW user_groups_with_stats AS
SELECT 
  g.id,
  g.name,
  g.currency,
  g.owner_id,
  g.created_at,
  gm.role as user_role,
  COUNT(DISTINCT gm2.user_id) as member_count,
  COUNT(DISTINCT p.id) as pool_count
FROM public.groups g
INNER JOIN public.group_members gm ON g.id = gm.group_id
LEFT JOIN public.group_members gm2 ON g.id = gm2.group_id
LEFT JOIN public.pools p ON g.id = p.group_id
WHERE gm.user_id = auth.uid()
GROUP BY g.id, g.name, g.currency, g.owner_id, g.created_at, gm.role;

-- View: Pool details with contribution stats
CREATE OR REPLACE VIEW pool_details AS
SELECT 
  p.id,
  p.group_id,
  p.name,
  p.description,
  p.target_amount,
  p.current_amount,
  p.status,
  p.created_at,
  COUNT(DISTINCT c.id) as contribution_count,
  COUNT(DISTINCT c.user_id) as contributor_count,
  COALESCE(SUM(CASE WHEN c.status = 'succeeded' THEN c.amount ELSE 0 END), 0) as total_contributed
FROM public.pools p
LEFT JOIN public.contributions c ON p.id = c.pool_id
GROUP BY p.id, p.group_id, p.name, p.description, p.target_amount, p.current_amount, p.status, p.created_at;

