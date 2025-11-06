-- User Verification and KYC Data Migration
-- Stores sensitive PII including SSN with encryption
-- Requires third-party verification service integration

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- USER VERIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Third-party verification provider data
  provider TEXT CHECK (provider IN ('stripe_identity', 'socure', 'persona', 'jumio', 'onfido', 'custom')),
  provider_verification_id TEXT, -- External verification ID from third-party
  provider_status TEXT CHECK (provider_status IN ('pending', 'processing', 'approved', 'rejected', 'expired')),
  
  -- Encrypted sensitive data
  ssn_encrypted TEXT, -- Encrypted SSN using pgcrypto
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- ID Document information
  id_type TEXT CHECK (id_type IN ('drivers_license', 'passport', 'state_id', 'national_id')),
  id_number_encrypted TEXT, -- Encrypted ID number
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
-- NOTE: ENCRYPTION HANDLING
-- ============================================================================
-- Encryption should be handled at the application level using:
-- 1. Environment variable: SSN_ENCRYPTION_KEY
-- 2. A proper encryption library (crypto-js, node-forge, etc.)
-- 3. In production, use a key management service (AWS KMS, HashiCorp Vault)
-- 
-- The ssn_encrypted and id_number_encrypted fields store encrypted values
-- that are encrypted/decrypted in the API layer before storing/retrieving.
-- 
-- Example encryption flow:
-- 1. User submits SSN
-- 2. API encrypts SSN using encryption key
-- 3. Store encrypted value in database
-- 4. Admins decrypt on retrieval (with proper audit logging)

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Only admins can view verification data
CREATE POLICY "Only admins can view verification data"
  ON public.user_verification
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_platform_admin = TRUE
    )
  );

-- Only system can insert verification data (via API with proper auth)
CREATE POLICY "System can insert verification data"
  ON public.user_verification
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

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
COMMENT ON COLUMN public.user_verification.ssn_encrypted IS 'Encrypted Social Security Number using pgcrypto';
COMMENT ON COLUMN public.user_verification.id_number_encrypted IS 'Encrypted ID document number';
COMMENT ON COLUMN public.user_verification.provider_response IS 'Full response from third-party verification provider';
COMMENT ON COLUMN public.user_verification.admin_notes IS 'Admin notes and comments about verification';

-- ============================================================================
-- UPDATE USERS TABLE TO LINK TO VERIFICATION
-- ============================================================================

-- Add a foreign key reference (optional, for easier queries)
-- Already handled by user_id foreign key in user_verification table

