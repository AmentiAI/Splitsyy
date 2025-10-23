-- RLS Policies for Splits Tables
-- Ensures users can access splits and related data properly

-- ============================================================================
-- SPLITS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view splits they created
CREATE POLICY IF NOT EXISTS "Users can view own splits"
ON public.splits FOR SELECT
USING (auth.uid() = created_by);

-- Policy: Users can create splits
CREATE POLICY IF NOT EXISTS "Users can create splits"
ON public.splits FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own splits
CREATE POLICY IF NOT EXISTS "Users can update own splits"
ON public.splits FOR UPDATE
USING (auth.uid() = created_by);

-- Enable RLS on splits table
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SPLIT PARTICIPANTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view participants of their splits
CREATE POLICY IF NOT EXISTS "Users can view participants of own splits"
ON public.split_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.splits
    WHERE splits.id = split_participants.split_id
    AND splits.created_by = auth.uid()
  )
  OR
  auth.uid() = user_id  -- Participants can view their own record
);

-- Policy: Users can view participants by phone (for payment links)
CREATE POLICY IF NOT EXISTS "Anyone can view participant by phone for payment"
ON public.split_participants FOR SELECT
USING (true);  -- Open for payment link access (phone hash verification happens in app logic)

-- Policy: Split creators can insert participants
CREATE POLICY IF NOT EXISTS "Split creators can add participants"
ON public.split_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.splits
    WHERE splits.id = split_participants.split_id
    AND splits.created_by = auth.uid()
  )
);

-- Policy: Split creators can update participants
CREATE POLICY IF NOT EXISTS "Split creators can update participants"
ON public.split_participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.splits
    WHERE splits.id = split_participants.split_id
    AND splits.created_by = auth.uid()
  )
);

-- Policy: Participants can update their own user_id when registering
CREATE POLICY IF NOT EXISTS "Participants can link their user account"
ON public.split_participants FOR UPDATE
USING (phone = (SELECT phone FROM auth.users WHERE id = auth.uid()))
WITH CHECK (user_id = auth.uid());

-- Enable RLS on split_participants table
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SPLIT PAYMENTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view payments for their splits
CREATE POLICY IF NOT EXISTS "Users can view payments for own splits"
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

-- Policy: System can insert payments (via service role or authenticated users making payments)
CREATE POLICY IF NOT EXISTS "Authenticated users can create payments"
ON public.split_payments FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: System can update payment status
CREATE POLICY IF NOT EXISTS "System can update payment status"
ON public.split_payments FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Enable RLS on split_payments table
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION FOR PHONE MATCHING
-- ============================================================================

-- Function to match participant to user account by phone
-- This will be called when a user registers with a phone number
CREATE OR REPLACE FUNCTION match_participant_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user registers, check if their phone matches any split participants
  -- and link them to those participant records
  -- Note: This assumes phone is stored in user metadata
  -- Adjust the logic based on your user phone storage
  
  IF NEW.raw_user_meta_data ? 'phone' THEN
    UPDATE public.split_participants
    SET user_id = NEW.id
    WHERE phone = NEW.raw_user_meta_data->>'phone'
      AND user_id IS NULL
      AND status = 'paid';  -- Only link paid participants
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to match participants when user registers
DROP TRIGGER IF EXISTS match_participant_on_user_creation ON auth.users;
CREATE TRIGGER match_participant_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION match_participant_to_user();

-- ============================================================================
-- GRANT PERMISSIONS
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
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add index for faster group lookups from splits
CREATE INDEX IF NOT EXISTS idx_splits_group_id_not_null 
ON public.splits(group_id) 
WHERE group_id IS NOT NULL;

-- Add index for faster user_id lookups in participants
CREATE INDEX IF NOT EXISTS idx_split_participants_user_id_not_null 
ON public.split_participants(user_id) 
WHERE user_id IS NOT NULL;

-- Composite index for participant + split queries
CREATE INDEX IF NOT EXISTS idx_split_participants_split_user 
ON public.split_participants(split_id, user_id);

COMMENT ON POLICY "Users can view own splits" ON public.splits 
IS 'Split creators can view splits they created';

COMMENT ON POLICY "Anyone can view participant by phone for payment" ON public.split_participants 
IS 'Allows payment page to load participant data (phone hash verification in app)';

COMMENT ON FUNCTION match_participant_to_user() 
IS 'Automatically links new users to their split participant records by phone number';


