-- Combined Migration: Setup Splits Tables
-- Run this in your Supabase SQL Editor to create all necessary tables
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this > Run

-- ============================================================================
-- STEP 1: Ensure UUID extension exists
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Ensure update_updated_at_column function exists
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create splits table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS splits_created_by_idx ON public.splits(created_by);
CREATE INDEX IF NOT EXISTS splits_status_idx ON public.splits(status);
CREATE INDEX IF NOT EXISTS splits_created_at_idx ON public.splits(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_splits_updated_at ON public.splits;
CREATE TRIGGER update_splits_updated_at
  BEFORE UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: Create split_participants table
-- ============================================================================
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

-- Add indexes
CREATE INDEX IF NOT EXISTS split_participants_split_id_idx ON public.split_participants(split_id);
CREATE INDEX IF NOT EXISTS split_participants_status_idx ON public.split_participants(status);
CREATE INDEX IF NOT EXISTS split_participants_phone_idx ON public.split_participants(phone);
CREATE INDEX IF NOT EXISTS split_participants_payment_intent_id_idx ON public.split_participants(payment_intent_id);
CREATE INDEX IF NOT EXISTS split_participants_user_id_idx ON public.split_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_user_id_not_null ON public.split_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_split_participants_split_user ON public.split_participants(split_id, user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_split_participants_updated_at ON public.split_participants;
CREATE TRIGGER update_split_participants_updated_at
  BEFORE UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Create split_payments table
-- ============================================================================
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

-- Add indexes
CREATE INDEX IF NOT EXISTS split_payments_split_id_idx ON public.split_payments(split_id);
CREATE INDEX IF NOT EXISTS split_payments_participant_id_idx ON public.split_payments(participant_id);
CREATE INDEX IF NOT EXISTS split_payments_status_idx ON public.split_payments(status);
CREATE INDEX IF NOT EXISTS split_payments_payment_intent_id_idx ON public.split_payments(payment_intent_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_split_payments_updated_at ON public.split_payments;
CREATE TRIGGER update_split_payments_updated_at
  BEFORE UPDATE ON public.split_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Add group_id to splits table (if not exists)
-- ============================================================================
ALTER TABLE public.splits 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS splits_group_id_idx ON public.splits(group_id);
CREATE INDEX IF NOT EXISTS idx_splits_group_id_not_null ON public.splits(group_id) WHERE group_id IS NOT NULL;

-- ============================================================================
-- STEP 7: Create helper functions
-- ============================================================================

-- Function to update split status based on participant payments
CREATE OR REPLACE FUNCTION update_split_status()
RETURNS TRIGGER AS $$
DECLARE
  total_participants INTEGER;
  paid_participants INTEGER;
  split_status TEXT;
BEGIN
  -- Count total and paid participants for this split
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'paid' THEN 1 END)
  INTO total_participants, paid_participants
  FROM public.split_participants
  WHERE split_id = NEW.split_id;

  -- Determine new status
  IF paid_participants = 0 THEN
    split_status := 'pending';
  ELSIF paid_participants = total_participants THEN
    split_status := 'completed';
  ELSE
    split_status := 'active';
  END IF;

  -- Update split status
  UPDATE public.splits
  SET status = split_status
  WHERE id = NEW.split_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create a group when a split is completed
CREATE OR REPLACE FUNCTION auto_create_group_for_split()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_split_creator UUID;
  v_split_description TEXT;
  v_participant RECORD;
BEGIN
  -- Only proceed if the split just became completed and doesn't have a group yet
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.group_id IS NULL THEN
    -- Get split details
    SELECT created_by, description 
    INTO v_split_creator, v_split_description
    FROM public.splits
    WHERE id = NEW.id;
    
    -- Create a new group for this split
    INSERT INTO public.groups (
      owner_id,
      name,
      currency
    ) VALUES (
      v_split_creator,
      v_split_description || ' Group',
      'USD'
    ) RETURNING id INTO v_group_id;
    
    -- Update the split with the group_id
    UPDATE public.splits
    SET group_id = v_group_id
    WHERE id = NEW.id;
    
    -- Add the creator as owner (this happens automatically via trigger, but let's be explicit)
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_split_creator, 'owner')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    -- Add any participants who already have user accounts
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
    
    -- Log the group creation (if audit_logs table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to match participant to user account by phone
CREATE OR REPLACE FUNCTION match_participant_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user registers, check if their phone matches any split participants
  -- and link them to those participant records
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

-- ============================================================================
-- STEP 8: Create triggers
-- ============================================================================

-- Trigger to update split status when participant status changes
DROP TRIGGER IF EXISTS update_split_status_trigger ON public.split_participants;
CREATE TRIGGER update_split_status_trigger
  AFTER UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_split_status();

-- Trigger to auto-create group when split becomes completed
DROP TRIGGER IF EXISTS auto_create_group_for_split_trigger ON public.splits;
CREATE TRIGGER auto_create_group_for_split_trigger
  AFTER UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_group_for_split();

-- Trigger to match participants when user registers
DROP TRIGGER IF EXISTS match_participant_on_user_creation ON auth.users;
CREATE TRIGGER match_participant_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION match_participant_to_user();

-- ============================================================================
-- STEP 9: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on splits table
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on split_participants table
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on split_payments table
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: Create RLS Policies
-- ============================================================================

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
-- STEP 11: Grant Permissions
-- ============================================================================

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.splits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_payments TO authenticated;

-- Grant permissions for service role (for system operations)
GRANT ALL ON public.splits TO service_role;
GRANT ALL ON public.split_participants TO service_role;
GRANT ALL ON public.split_payments TO service_role;

-- ============================================================================
-- STEP 12: Add Comments
-- ============================================================================

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

COMMENT ON FUNCTION update_split_status() IS 'Updates split status based on participant payment status';
COMMENT ON FUNCTION auto_create_group_for_split() IS 'Automatically creates a group when all participants have paid their split';
COMMENT ON FUNCTION match_participant_to_user() IS 'Automatically links new users to their split participant records by phone number';

-- Done! The splits tables should now be created and ready to use.

