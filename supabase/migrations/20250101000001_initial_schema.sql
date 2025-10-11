-- Splitsy Database Schema - Initial Migration
-- Created: 2025-10-10
-- Description: Creates all core tables for the Splitsy application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Note: Supabase Auth manages the auth.users table
-- This table extends it with application-specific data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_kyc_status_idx ON public.users(kyc_status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS groups_owner_id_idx ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON public.groups(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  spend_cap BIGINT CHECK (spend_cap IS NULL OR spend_cap > 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);

-- ============================================================================
-- POOLS TABLE
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS pools_group_id_idx ON public.pools(group_id);
CREATE INDEX IF NOT EXISTS pools_status_idx ON public.pools(status);
CREATE INDEX IF NOT EXISTS pools_designated_payer_idx ON public.pools(designated_payer);

-- Add updated_at trigger
CREATE TRIGGER update_pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONTRIBUTIONS TABLE
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS contributions_pool_id_idx ON public.contributions(pool_id);
CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS contributions_status_idx ON public.contributions(status);
CREATE INDEX IF NOT EXISTS contributions_payment_intent_id_idx ON public.contributions(payment_intent_id);

-- Add updated_at trigger
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIRTUAL CARDS TABLE
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS virtual_cards_pool_id_idx ON public.virtual_cards(pool_id);
CREATE INDEX IF NOT EXISTS virtual_cards_provider_card_id_idx ON public.virtual_cards(provider_card_id);
CREATE INDEX IF NOT EXISTS virtual_cards_status_idx ON public.virtual_cards(status);

-- Add updated_at trigger
CREATE TRIGGER update_virtual_cards_updated_at
  BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS transactions_pool_id_idx ON public.transactions(pool_id);
CREATE INDEX IF NOT EXISTS transactions_card_id_idx ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_provider_transaction_id_idx ON public.transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);

-- ============================================================================
-- AUDIT LOG TABLE (for compliance and security)
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

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

COMMENT ON COLUMN public.contributions.amount IS 'Amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.pools.target_amount IS 'Target amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.pools.current_amount IS 'Current collected amount in cents';
COMMENT ON COLUMN public.transactions.amount IS 'Transaction amount in cents (negative for refunds)';

