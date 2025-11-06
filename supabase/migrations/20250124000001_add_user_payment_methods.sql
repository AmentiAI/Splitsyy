-- User Payment Methods Migration
-- Allows users to store and use their personal payment cards for contributions

-- ============================================================================
-- USER PAYMENT METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'lithic', 'manual')),
  provider_payment_method_id TEXT, -- Stripe payment method ID or external ID
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners', 'unionpay')),
  last_four TEXT CHECK (LENGTH(last_four) = 4),
  expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year INTEGER CHECK (expiry_year >= 2020),
  billing_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_provider_payment_method UNIQUE (provider, provider_payment_method_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON public.user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS user_payment_methods_type_idx ON public.user_payment_methods(type);
CREATE INDEX IF NOT EXISTS user_payment_methods_is_default_idx ON public.user_payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS user_payment_methods_is_active_idx ON public.user_payment_methods(user_id, is_active) WHERE is_active = TRUE;

-- Add updated_at trigger
CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON public.user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Unset all other default payment methods for this user
    UPDATE public.user_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment methods
CREATE POLICY "Users can view their own payment methods"
  ON public.user_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can create their own payment methods"
  ON public.user_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update their own payment methods"
  ON public.user_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete their own payment methods"
  ON public.user_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_payment_methods IS 'User payment methods (cards, bank accounts) for contributions';
COMMENT ON COLUMN public.user_payment_methods.provider_payment_method_id IS 'External payment provider ID (Stripe PaymentMethod ID, etc.)';
COMMENT ON COLUMN public.user_payment_methods.is_default IS 'Whether this is the default payment method for the user';
COMMENT ON COLUMN public.user_payment_methods.metadata IS 'Additional payment method metadata (billing address, etc.)';

