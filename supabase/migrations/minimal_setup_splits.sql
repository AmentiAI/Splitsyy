-- MINIMAL Migration: Create Splits Tables Only
-- Run this if the combined migration has dependency issues
-- This creates just the essential tables needed for the app to work

-- Step 1: Create splits table
CREATE TABLE IF NOT EXISTS public.splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  description TEXT NOT NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create split_participants table
CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create split_payments table (optional, but good to have)
CREATE TABLE IF NOT EXISTS public.split_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Add basic indexes
CREATE INDEX IF NOT EXISTS splits_created_by_idx ON public.splits(created_by);
CREATE INDEX IF NOT EXISTS split_participants_split_id_idx ON public.split_participants(split_id);
CREATE INDEX IF NOT EXISTS split_payments_split_id_idx ON public.split_payments(split_id);

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;

-- Step 6: Create basic RLS policies
-- Allow users to see their own splits
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

-- Allow users to see participants of their splits
DROP POLICY IF EXISTS "Users can view participants of own splits" ON public.split_participants;
CREATE POLICY "Users can view participants of own splits"
ON public.split_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.splits
    WHERE splits.id = split_participants.split_id
    AND splits.created_by = auth.uid()
  )
);

-- Allow anyone to view participants (for payment links)
DROP POLICY IF EXISTS "Anyone can view participant for payment" ON public.split_participants;
CREATE POLICY "Anyone can view participant for payment"
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

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.splits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.split_payments TO authenticated;

-- Done! Test with: SELECT COUNT(*) FROM public.splits;

