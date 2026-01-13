-- User Settings and Preferences Migration
-- Stores user preferences, notification settings, security settings, etc.

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_settings IS 'User preferences, notification settings, and security settings';
COMMENT ON COLUMN public.user_settings.notifications IS 'JSONB object with notification preferences';
COMMENT ON COLUMN public.user_settings.security IS 'JSONB object with security settings';
COMMENT ON COLUMN public.user_settings.preferences IS 'JSONB object with user preferences (language, currency, etc.)';


