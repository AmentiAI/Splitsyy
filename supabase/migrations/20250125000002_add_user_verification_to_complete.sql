-- Add user_verification table to complete setup
-- This migration adds the verification table that was missing from the complete setup

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- USER VERIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Third-party verification provider data
  provider TEXT CHECK (provider IN ('stripe_identity', 'socure', 'persona', 'jumio', 'onfido', 'custom', 'plaid')),
  provider_verification_id TEXT, -- External verification ID from third-party
  provider_status TEXT CHECK (provider_status IN ('pending', 'processing', 'approved', 'rejected', 'expired')),
  
  -- Encrypted sensitive data
  ssn_encrypted TEXT, -- Encrypted SSN (application-level encryption)
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- ID Document information
  id_type TEXT CHECK (id_type IN ('drivers_license', 'passport', 'state_id', 'national_id')),
  id_number_encrypted TEXT, -- Encrypted ID number (application-level encryption)
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

-- Add indexes
CREATE INDEX IF NOT EXISTS user_verification_user_id_idx ON public.user_verification(user_id);
CREATE INDEX IF NOT EXISTS user_verification_provider_idx ON public.user_verification(provider);
CREATE INDEX IF NOT EXISTS user_verification_provider_status_idx ON public.user_verification(provider_status);
CREATE INDEX IF NOT EXISTS user_verification_provider_verification_id_idx ON public.user_verification(provider_verification_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_verification_updated_at
  BEFORE UPDATE ON public.user_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification data
CREATE POLICY "Users can view own verification"
  ON public.user_verification
  FOR SELECT
  USING (user_id = auth.uid());

-- Only admins can view all verification data
CREATE POLICY "Only admins can view all verification data"
  ON public.user_verification
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_platform_admin = TRUE
    )
  );

-- Users can insert their own verification data
CREATE POLICY "Users can insert own verification"
  ON public.user_verification
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only admins can update verification data
CREATE POLICY "Only admins can update verification data"
  ON public.user_verification
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_platform_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_platform_admin = TRUE
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_verification IS 'User identity verification and KYC data including encrypted SSN';
COMMENT ON COLUMN public.user_verification.ssn_encrypted IS 'Encrypted Social Security Number (application-level encryption)';
COMMENT ON COLUMN public.user_verification.id_number_encrypted IS 'Encrypted ID document number (application-level encryption)';
COMMENT ON COLUMN public.user_verification.provider_response IS 'Full response from third-party verification provider';
COMMENT ON COLUMN public.user_verification.admin_notes IS 'Admin notes and comments about verification';


