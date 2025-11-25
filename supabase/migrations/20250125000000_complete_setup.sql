-- ============================================================================
-- COMPLETE DATABASE SETUP FOR SPLITSY
-- ============================================================================
-- This migration creates all tables, RLS policies, triggers, and functions
-- needed for the Splitsy application to work.
-- 
-- Run this in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor > New Query
-- 2. Paste this entire file
-- 3. Click "Run"
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HELPER FUNCTION: update_updated_at_column
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- USERS TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_kyc_status_idx ON public.users(kyc_status);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_owner_id_idx ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON public.groups(created_at);

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  spend_cap BIGINT CHECK (spend_cap IS NULL OR spend_cap > 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);

-- POOLS TABLE
CREATE TABLE IF NOT EXISTS public.pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount BIGINT NOT NULL CHECK (target_amount > 0),
  current_amount BIGINT NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  designated_payer UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pools_group_id_idx ON public.pools(group_id);
CREATE INDEX IF NOT EXISTS pools_status_idx ON public.pools(status);
CREATE INDEX IF NOT EXISTS pools_designated_payer_idx ON public.pools(designated_payer);

CREATE TRIGGER update_pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('card', 'ach', 'wire')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contributions_pool_id_idx ON public.contributions(pool_id);
CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS contributions_status_idx ON public.contributions(status);
CREATE INDEX IF NOT EXISTS contributions_payment_intent_id_idx ON public.contributions(payment_intent_id);

CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- VIRTUAL CARDS TABLE
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  provider_card_id TEXT UNIQUE NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'amex')),
  last_four TEXT NOT NULL CHECK (LENGTH(last_four) = 4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'cancelled')),
  apple_pay_tokenized BOOLEAN NOT NULL DEFAULT FALSE,
  spending_limit BIGINT CHECK (spending_limit IS NULL OR spending_limit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS virtual_cards_pool_id_idx ON public.virtual_cards(pool_id);
CREATE INDEX IF NOT EXISTS virtual_cards_provider_card_id_idx ON public.virtual_cards(provider_card_id);
CREATE INDEX IF NOT EXISTS virtual_cards_status_idx ON public.virtual_cards(status);

CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.virtual_cards(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL CHECK (amount != 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'refund', 'fee', 'adjustment')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'reversed')),
  merchant_name TEXT,
  merchant_category TEXT,
  description TEXT,
  provider_transaction_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_pool_id_idx ON public.transactions(pool_id);
CREATE INDEX IF NOT EXISTS transactions_card_id_idx ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_provider_transaction_id_idx ON public.transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

-- ============================================================================
-- SPLITS TABLES
-- ============================================================================

-- SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS splits_created_by_idx ON public.splits(created_by);
CREATE INDEX IF NOT EXISTS splits_status_idx ON public.splits(status);
CREATE INDEX IF NOT EXISTS splits_created_at_idx ON public.splits(created_at DESC);
CREATE INDEX IF NOT EXISTS splits_group_id_idx ON public.splits(group_id);
CREATE INDEX IF NOT EXISTS idx_splits_group_id_not_null ON public.splits(group_id) WHERE group_id IS NOT NULL;

CREATE TRIGGER update_splits_updated_at
  BEFORE UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SPLIT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_id UUID NOT NULL REFERENCES public.splits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
  error_message TEXT,
  paid_at TIMESTAMPTZ,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS split_participants_split_id_idx ON public.split_participants(split_id);
CREATE INDEX IF NOT EXISTS split_participants_status_idx ON public.split_participants(status);
CREATE INDEX IF NOT EXISTS split_participants_phone_idx ON public.split_participants(phone);
CREATE INDEX IF NOT EXISTS split_participants_payment_intent_id_idx ON public.split_participants(payment_intent_id);
CREATE INDEX IF NOT EXISTS split_participants_user_id_idx ON public.split_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_user_id_not_null ON public.split_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_split_participants_split_user ON public.split_participants(split_id, user_id);

CREATE TRIGGER update_split_participants_updated_at
  BEFORE UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SPLIT PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.split_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_id UUID NOT NULL REFERENCES public.splits(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.split_participants(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'apple_pay', 'google_pay', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT UNIQUE,
  provider_payment_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS split_payments_split_id_idx ON public.split_payments(split_id);
CREATE INDEX IF NOT EXISTS split_payments_participant_id_idx ON public.split_payments(participant_id);
CREATE INDEX IF NOT EXISTS split_payments_status_idx ON public.split_payments(status);
CREATE INDEX IF NOT EXISTS split_payments_payment_intent_id_idx ON public.split_payments(payment_intent_id);

CREATE TRIGGER update_split_payments_updated_at
  BEFORE UPDATE ON public.split_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update pool current_amount when contributions change
CREATE OR REPLACE FUNCTION update_pool_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'succeeded' THEN
    UPDATE public.pools
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.pool_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'succeeded' AND NEW.status = 'succeeded' THEN
    UPDATE public.pools
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.pool_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'succeeded' AND NEW.status = 'refunded' THEN
    UPDATE public.pools
    SET current_amount = current_amount - OLD.amount
    WHERE id = NEW.pool_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pool_amount_trigger
  AFTER INSERT OR UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_pool_amount();

-- Function to automatically add group owner as a member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Function to update split status based on participant payments
CREATE OR REPLACE FUNCTION update_split_status()
RETURNS TRIGGER AS $$
DECLARE
  total_participants INTEGER;
  paid_participants INTEGER;
  split_status TEXT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'paid' THEN 1 END)
  INTO total_participants, paid_participants
  FROM public.split_participants
  WHERE split_id = NEW.split_id;

  IF paid_participants = 0 THEN
    split_status := 'pending';
  ELSIF paid_participants = total_participants THEN
    split_status := 'completed';
  ELSE
    split_status := 'active';
  END IF;

  UPDATE public.splits
  SET status = split_status
  WHERE id = NEW.split_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_split_status_trigger
  AFTER UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_split_status();

-- Function to automatically create a group when a split is completed
CREATE OR REPLACE FUNCTION auto_create_group_for_split()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_split_creator UUID;
  v_split_description TEXT;
  v_participant RECORD;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.group_id IS NULL THEN
    SELECT created_by, description 
    INTO v_split_creator, v_split_description
    FROM public.splits
    WHERE id = NEW.id;
    
    INSERT INTO public.groups (
      owner_id,
      name,
      currency
    ) VALUES (
      v_split_creator,
      v_split_description || ' Group',
      'USD'
    ) RETURNING id INTO v_group_id;
    
    UPDATE public.splits
    SET group_id = v_group_id
    WHERE id = NEW.id;
    
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_split_creator, 'owner')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    FOR v_participant IN 
      SELECT sp.id, sp.phone, sp.name, sp.user_id
      FROM public.split_participants sp
      WHERE sp.split_id = NEW.id 
        AND sp.status = 'paid'
        AND sp.user_id IS NOT NULL
    LOOP
      INSERT INTO public.group_members (group_id, user_id, role)
      VALUES (v_group_id, v_participant.user_id, 'member')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END LOOP;
    
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      v_split_creator,
      'group.auto_created_from_split',
      'group',
      v_group_id,
      jsonb_build_object(
        'split_id', NEW.id,
        'split_description', v_split_description
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_group_for_split_trigger
  AFTER UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_group_for_split();

-- Function to match participant to user account by phone
CREATE OR REPLACE FUNCTION match_participant_to_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'phone' THEN
    UPDATE public.split_participants
    SET user_id = NEW.id
    WHERE phone = NEW.raw_user_meta_data->>'phone'
      AND user_id IS NULL
      AND status = 'paid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS match_participant_on_user_creation ON auth.users;
CREATE TRIGGER match_participant_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION match_participant_to_user();

-- Function for audit logging
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view group members" ON public.users;
-- Simplified: Users can only view themselves
-- Group member visibility is handled via group_members table policies (no recursion)
CREATE POLICY "Users can view group members"
  ON public.users FOR SELECT
  USING (users.id = auth.uid());

-- GROUPS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their groups" ON public.groups;
CREATE POLICY "Users can view their groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Group owners can update groups" ON public.groups;
CREATE POLICY "Group owners can update groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Group owners can delete groups" ON public.groups;
CREATE POLICY "Group owners can delete groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = owner_id);

-- GROUP MEMBERS TABLE POLICIES
-- Fix: Use groups table to check ownership, avoid querying group_members to prevent recursion
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

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid() AND role != 'owner');

-- POOLS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view group pools" ON public.pools;
CREATE POLICY "Users can view group pools"
  ON public.pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can create pools" ON public.pools;
CREATE POLICY "Group members can create pools"
  ON public.pools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update pools" ON public.pools;
CREATE POLICY "Owners and admins can update pools"
  ON public.pools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = pools.group_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Group owners can delete pools" ON public.pools;
CREATE POLICY "Group owners can delete pools"
  ON public.pools FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = pools.group_id AND owner_id = auth.uid()
    )
  );

-- CONTRIBUTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view pool contributions" ON public.contributions;
CREATE POLICY "Users can view pool contributions"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create contributions" ON public.contributions;
CREATE POLICY "Users can create contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can update contributions" ON public.contributions;
CREATE POLICY "Service can update contributions"
  ON public.contributions FOR UPDATE
  USING (true);

-- VIRTUAL CARDS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view pool cards" ON public.virtual_cards;
CREATE POLICY "Users can view pool cards"
  ON public.virtual_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create cards" ON public.virtual_cards;
CREATE POLICY "Admins can create cards"
  ON public.virtual_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update cards" ON public.virtual_cards;
CREATE POLICY "Admins can update cards"
  ON public.virtual_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view pool transactions" ON public.transactions;
CREATE POLICY "Users can view pool transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      INNER JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = transactions.pool_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert transactions" ON public.transactions;
CREATE POLICY "Service can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update transactions" ON public.transactions;
CREATE POLICY "Service can update transactions"
  ON public.transactions FOR UPDATE
  USING (true);

-- AUDIT LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can view group audit logs" ON public.audit_logs;
CREATE POLICY "Owners can view group audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    resource_type = 'group' AND
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = audit_logs.resource_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- SPLITS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own splits" ON public.splits;
CREATE POLICY "Users can view own splits"
  ON public.splits FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create splits" ON public.splits;
CREATE POLICY "Users can create splits"
  ON public.splits FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own splits" ON public.splits;
CREATE POLICY "Users can update own splits"
  ON public.splits FOR UPDATE
  USING (auth.uid() = created_by);

-- SPLIT PARTICIPANTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view participants of own splits" ON public.split_participants;
CREATE POLICY "Users can view participants of own splits"
  ON public.split_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE splits.id = split_participants.split_id
      AND splits.created_by = auth.uid()
    )
    OR
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Anyone can view participant by phone for payment" ON public.split_participants;
CREATE POLICY "Anyone can view participant by phone for payment"
  ON public.split_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Split creators can add participants" ON public.split_participants;
CREATE POLICY "Split creators can add participants"
  ON public.split_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE splits.id = split_participants.split_id
      AND splits.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Split creators can update participants" ON public.split_participants;
CREATE POLICY "Split creators can update participants"
  ON public.split_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE splits.id = split_participants.split_id
      AND splits.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can link their user account" ON public.split_participants;
CREATE POLICY "Participants can link their user account"
  ON public.split_participants FOR UPDATE
  USING (phone = (SELECT phone FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_id = auth.uid());

-- SPLIT PAYMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view payments for own splits" ON public.split_payments;
CREATE POLICY "Users can view payments for own splits"
  ON public.split_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE splits.id = split_payments.split_id
      AND splits.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.split_participants
      WHERE split_participants.id = split_payments.participant_id
      AND split_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.split_payments;
CREATE POLICY "Authenticated users can create payments"
  ON public.split_payments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "System can update payment status" ON public.split_payments;
CREATE POLICY "System can update payment status"
  ON public.split_payments FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pools TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.virtual_cards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.splits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_payments TO authenticated;

GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.groups TO service_role;
GRANT ALL ON public.group_members TO service_role;
GRANT ALL ON public.pools TO service_role;
GRANT ALL ON public.contributions TO service_role;
GRANT ALL ON public.virtual_cards TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.splits TO service_role;
GRANT ALL ON public.split_participants TO service_role;
GRANT ALL ON public.split_payments TO service_role;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

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

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.users IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON TABLE public.groups IS 'Payment groups that users can create and manage';
COMMENT ON TABLE public.group_members IS 'Junction table for group membership and roles';
COMMENT ON TABLE public.pools IS 'Shared fund pools within groups';
COMMENT ON TABLE public.contributions IS 'Individual contributions to pools';
COMMENT ON TABLE public.virtual_cards IS 'Virtual payment cards linked to pools';
COMMENT ON TABLE public.transactions IS 'Payment transactions made with virtual cards';
COMMENT ON TABLE public.audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE public.splits IS 'Bill splitting requests created by users';
COMMENT ON TABLE public.split_participants IS 'People who need to pay their share of a split';
COMMENT ON TABLE public.split_payments IS 'Payment records for split participants';

COMMENT ON COLUMN public.splits.total_amount IS 'Total amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.splits.group_id IS 'Auto-created group after all participants pay';
COMMENT ON COLUMN public.split_participants.amount IS 'Amount this participant owes in cents';
COMMENT ON COLUMN public.split_participants.phone IS 'Phone number for sending payment links';
COMMENT ON COLUMN public.split_participants.payment_link IS 'Unique payment link for this participant';
COMMENT ON COLUMN public.split_participants.user_id IS 'User account if participant has registered';
COMMENT ON COLUMN public.split_payments.amount IS 'Payment amount in cents';
COMMENT ON COLUMN public.contributions.amount IS 'Amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.pools.target_amount IS 'Target amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.pools.current_amount IS 'Current collected amount in cents';
COMMENT ON COLUMN public.transactions.amount IS 'Transaction amount in cents (negative for refunds)';

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
-- All tables, policies, triggers, and functions have been created.
-- Your Splitsy database is now ready to use!
-- ============================================================================

