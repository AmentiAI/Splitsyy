-- Splitsy Database Schema - Add Splits Tables
-- Created: 2025-01-10
-- Description: Adds tables for bill splitting functionality

-- ============================================================================
-- SPLITS TABLE
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
CREATE TRIGGER update_splits_updated_at
  BEFORE UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SPLIT PARTICIPANTS TABLE
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS split_participants_split_id_idx ON public.split_participants(split_id);
CREATE INDEX IF NOT EXISTS split_participants_status_idx ON public.split_participants(status);
CREATE INDEX IF NOT EXISTS split_participants_phone_idx ON public.split_participants(phone);
CREATE INDEX IF NOT EXISTS split_participants_payment_intent_id_idx ON public.split_participants(payment_intent_id);

-- Add updated_at trigger
CREATE TRIGGER update_split_participants_updated_at
  BEFORE UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SPLIT PAYMENTS TABLE
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
CREATE TRIGGER update_split_payments_updated_at
  BEFORE UPDATE ON public.split_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS FOR SPLITS
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

-- Trigger to update split status when participant status changes
CREATE TRIGGER update_split_status_trigger
  AFTER UPDATE ON public.split_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_split_status();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.splits IS 'Bill splitting requests created by users';
COMMENT ON TABLE public.split_participants IS 'People who need to pay their share of a split';
COMMENT ON TABLE public.split_payments IS 'Payment records for split participants';

COMMENT ON COLUMN public.splits.total_amount IS 'Total amount in cents (or smallest currency unit)';
COMMENT ON COLUMN public.split_participants.amount IS 'Amount this participant owes in cents';
COMMENT ON COLUMN public.split_participants.phone IS 'Phone number for sending payment links';
COMMENT ON COLUMN public.split_participants.payment_link IS 'Unique payment link for this participant';
COMMENT ON COLUMN public.split_payments.amount IS 'Payment amount in cents';









