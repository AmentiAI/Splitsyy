-- ============================================================================
-- COMPLETE DATABASE SETUP FOR SPLITSY - ALL MIGRATIONS COMBINED
-- ============================================================================
-- This is a consolidated migration that includes:
-- 1. Complete setup (tables, RLS, triggers, functions)
-- 2. RLS recursion fixes
-- 3. User verification table
-- 4. User settings table
-- 
-- Run this in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor > New Query
-- 2. Paste this entire file
-- 3. Click "Run"
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  description TEXT,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_role_idx ON public.group_members(role);

-- POOLS TABLE
CREATE TABLE IF NOT EXISTS public.pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount BIGINT NOT NULL DEFAULT 0,
  current_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pools_group_id_idx ON public.pools(group_id);
CREATE INDEX IF NOT EXISTS pools_status_idx ON public.pools(status);

CREATE TRIGGER update_pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'lithic', 'mock')),
  provider_card_id TEXT,
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  spending_limit BIGINT,
  apple_pay_tokenized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS virtual_cards_pool_id_idx ON public.virtual_cards(pool_id);
CREATE INDEX IF NOT EXISTS virtual_cards_user_id_idx ON public.virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS virtual_cards_provider_idx ON public.virtual_cards(provider);
CREATE INDEX IF NOT EXISTS virtual_cards_status_idx ON public.virtual_cards(status);

CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  virtual_card_id UUID NOT NULL REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  merchant_name TEXT,
  merchant_category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'refunded')),
  provider_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_virtual_card_id_idx ON public.transactions(virtual_card_id);
CREATE INDEX IF NOT EXISTS transactions_pool_id_idx ON public.transactions(pool_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at);

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);

-- SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS splits_created_by_idx ON public.splits(created_by);
CREATE INDEX IF NOT EXISTS splits_group_id_idx ON public.splits(group_id);
CREATE INDEX IF NOT EXISTS splits_status_idx ON public.splits(status);

CREATE TRIGGER update_splits_updated_at
  BEFORE UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SPLIT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_id UUID NOT NULL REFERENCES public.splits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  amount BIGINT NOT NULL,
  payment_link TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS split_participants_split_id_idx ON public.split_participants(split_id);
CREATE INDEX IF NOT EXISTS split_participants_user_id_idx ON public.split_participants(user_id);
CREATE INDEX IF NOT EXISTS split_participants_payment_link_idx ON public.split_participants(payment_link);
CREATE INDEX IF NOT EXISTS split_participants_status_idx ON public.split_participants(status);

-- SPLIT PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.split_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_id UUID NOT NULL REFERENCES public.splits(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.split_participants(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS split_payments_split_id_idx ON public.split_payments(split_id);
CREATE INDEX IF NOT EXISTS split_payments_participant_id_idx ON public.split_payments(participant_id);
CREATE INDEX IF NOT EXISTS split_payments_status_idx ON public.split_payments(status);

CREATE TRIGGER update_split_payments_updated_at
  BEFORE UPDATE ON public.split_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- USER PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'mock')),
  provider_payment_method_id TEXT NOT NULL,
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners', 'unionpay')),
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  billing_name TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON public.user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS user_payment_methods_type_idx ON public.user_payment_methods(type);
CREATE INDEX IF NOT EXISTS user_payment_methods_is_default_idx ON public.user_payment_methods(is_default);
CREATE INDEX IF NOT EXISTS user_payment_methods_is_active_idx ON public.user_payment_methods(is_active);

CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON public.user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- USER VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Third-party verification provider data
  provider TEXT CHECK (provider IN ('stripe_identity', 'socure', 'persona', 'jumio', 'onfido', 'custom', 'plaid')),
  provider_verification_id TEXT,
  provider_status TEXT CHECK (provider_status IN ('pending', 'processing', 'approved', 'rejected', 'expired')),
  
  -- Encrypted sensitive data
  ssn_encrypted TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- ID Document information
  id_type TEXT CHECK (id_type IN ('drivers_license', 'passport', 'state_id', 'national_id')),
  id_number_encrypted TEXT,
  id_issued_date DATE,
  id_expiry_date DATE,
  id_issuing_authority TEXT,
  
  -- Verification metadata
  verification_submitted_at TIMESTAMPTZ,
  verification_completed_at TIMESTAMPTZ,
  verification_expires_at TIMESTAMPTZ,
  
  -- Third-party response data (JSON)
  provider_response JSONB DEFAULT '{}',
  provider_error TEXT,
  
  -- Admin notes
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_verification UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_verification_user_id_idx ON public.user_verification(user_id);
CREATE INDEX IF NOT EXISTS user_verification_provider_idx ON public.user_verification(provider);
CREATE INDEX IF NOT EXISTS user_verification_provider_status_idx ON public.user_verification(provider_status);
CREATE INDEX IF NOT EXISTS user_verification_provider_verification_id_idx ON public.user_verification(provider_verification_id);

CREATE TRIGGER update_user_verification_updated_at
  BEFORE UPDATE ON public.user_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Profile information
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  bio TEXT,
  
  -- Notification preferences (JSONB)
  notifications JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "marketing": false
  }'::jsonb,
  
  -- Security settings (JSONB)
  security JSONB DEFAULT '{
    "twoFactor": false,
    "biometric": true,
    "sessionTimeout": 30,
    "loginNotifications": true
  }'::jsonb,
  
  -- Preferences (JSONB)
  preferences JSONB DEFAULT '{
    "language": "en",
    "currency": "USD"
  }'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to auto-add group owner as member
CREATE OR REPLACE FUNCTION auto_add_group_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_owner_to_group_members
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_group_owner_as_member();

-- Function to update pool current_amount when contribution succeeds
CREATE OR REPLACE FUNCTION update_pool_amount_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' AND (OLD.status IS NULL OR OLD.status != 'succeeded') THEN
    UPDATE public.pools
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.pool_id;
  ELSIF OLD.status = 'succeeded' AND NEW.status != 'succeeded' THEN
    -- Contribution was refunded or failed, subtract amount
    UPDATE public.pools
    SET current_amount = current_amount - OLD.amount
    WHERE id = OLD.pool_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pool_on_contribution
  AFTER INSERT OR UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_pool_amount_on_contribution();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
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
$$ LANGUAGE plpgsql;

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
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
DROP POLICY IF EXISTS "Users can view group members" ON public.users;
CREATE POLICY "Users can view group members"
  ON public.users FOR SELECT
  USING (users.id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- GROUPS POLICIES
CREATE POLICY "Users can view groups they belong to"
  ON public.groups FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Group owners can update their groups"
  ON public.groups FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Group owners can delete their groups"
  ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

-- GROUP MEMBERS POLICIES (Fixed to avoid recursion)
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners and admins can add members" ON public.group_members;
CREATE POLICY "Owners and admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update members" ON public.group_members;
CREATE POLICY "Owners and admins can update members"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
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
    group_members.role != 'owner' AND
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid() AND role != 'owner');

-- POOLS POLICIES
CREATE POLICY "Group members can view pools"
  ON public.pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = pools.group_id AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create pools"
  ON public.pools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = pools.group_id AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins and owners can update pools"
  ON public.pools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = pools.group_id 
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

-- CONTRIBUTIONS POLICIES
CREATE POLICY "Group members can view contributions"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pools p
      JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = contributions.pool_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own contributions"
  ON public.contributions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- VIRTUAL CARDS POLICIES
CREATE POLICY "Pool members can view virtual cards"
  ON public.virtual_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Pool members can create virtual cards"
  ON public.virtual_cards FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pools p
      JOIN public.group_members gm ON p.group_id = gm.group_id
      WHERE p.id = virtual_cards.pool_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Card owners can update their cards"
  ON public.virtual_cards FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TRANSACTIONS POLICIES
CREATE POLICY "Card owners can view transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_cards vc
      WHERE vc.id = transactions.virtual_card_id AND vc.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- AUDIT LOGS POLICIES
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- SPLITS POLICIES
CREATE POLICY "Users can view splits they created"
  ON public.splits FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create splits"
  ON public.splits FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own splits"
  ON public.splits FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- SPLIT PARTICIPANTS POLICIES
CREATE POLICY "Split creators can view participants"
  ON public.split_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE id = split_participants.split_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view own participant records"
  ON public.split_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Split creators can create participants"
  ON public.split_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE id = split_participants.split_id AND created_by = auth.uid()
    )
  );

-- SPLIT PAYMENTS POLICIES
CREATE POLICY "Split creators can view payments"
  ON public.split_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.splits
      WHERE id = split_payments.split_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "System can create split payments"
  ON public.split_payments FOR INSERT
  WITH CHECK (true);

-- USER PAYMENT METHODS POLICIES
CREATE POLICY "Users can view own payment methods"
  ON public.user_payment_methods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own payment methods"
  ON public.user_payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods"
  ON public.user_payment_methods FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods"
  ON public.user_payment_methods FOR DELETE
  USING (user_id = auth.uid());

-- USER VERIFICATION POLICIES
CREATE POLICY "Users can view own verification"
  ON public.user_verification FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification"
  ON public.user_verification FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- USER SETTINGS POLICIES
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pool summary view
CREATE OR REPLACE VIEW public.pool_summary AS
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
COMMENT ON TABLE public.user_payment_methods IS 'User payment methods (cards, bank accounts)';
COMMENT ON TABLE public.user_verification IS 'User identity verification and KYC data';
COMMENT ON TABLE public.user_settings IS 'User preferences, notification settings, and security settings';

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
-- All tables, policies, triggers, and functions have been created.
-- Your Splitsy database is now ready to use!
-- ============================================================================
