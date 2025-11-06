-- Admin System Migration
-- Created: 2025-01-23
-- Description: Adds platform-level admin functionality and system settings

-- ============================================================================
-- ADD PLATFORM ADMIN ROLE TO USERS TABLE
-- ============================================================================

-- Add is_platform_admin column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS users_is_platform_admin_idx ON public.users(is_platform_admin) WHERE is_platform_admin = TRUE;

-- ============================================================================
-- SYSTEM SETTINGS TABLE (for kill switch and feature flags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS system_settings_key_idx ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS system_settings_updated_by_idx ON public.system_settings(updated_by);

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_enabled', '{"enabled": true, "reason": "", "disabled_at": null}', 'Platform kill switch - disable to shut down all non-admin operations'),
  ('registration_enabled', '{"enabled": true}', 'Allow new user registrations'),
  ('payments_enabled', '{"enabled": true}', 'Allow payment processing'),
  ('card_creation_enabled', '{"enabled": true}', 'Allow virtual card creation'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode flag and message'),
  ('feature_flags', '{"apple_pay": true, "groups": true, "pools": true, "cards": true}', 'Feature flags for enabling/disabling features')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ADMIN ACTIONS TABLE (audit trail for admin actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'kill_switch_toggle',
    'user_promote',
    'user_demote',
    'user_delete',
    'user_update',
    'system_setting_update',
    'feature_flag_toggle',
    'bulk_operation'
  )),
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS admin_actions_admin_id_idx ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS admin_actions_action_type_idx ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS admin_actions_target_type_idx ON public.admin_actions(target_type);
CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON public.admin_actions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY FOR SYSTEM SETTINGS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all system settings
CREATE POLICY "Platform admins can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_platform_admin = TRUE
  )
);

-- Platform admins can update system settings
CREATE POLICY "Platform admins can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_platform_admin = TRUE
  )
);

-- Platform admins can insert system settings
CREATE POLICY "Platform admins can insert system settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_platform_admin = TRUE
  )
);

-- Platform admins can view all admin actions
CREATE POLICY "Platform admins can view admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_platform_admin = TRUE
  )
);

-- Platform admins can insert admin actions
CREATE POLICY "Platform admins can insert admin actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_platform_admin = TRUE
  )
  AND admin_id = auth.uid()
);

-- ============================================================================
-- HELPER FUNCTION: Check if platform is enabled
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_enabled()
RETURNS BOOLEAN AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value
  FROM public.system_settings
  WHERE key = 'platform_enabled';
  
  IF setting_value IS NULL THEN
    RETURN TRUE; -- Default to enabled if setting doesn't exist
  END IF;
  
  RETURN COALESCE((setting_value->>'enabled')::BOOLEAN, TRUE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check if user is platform admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND is_platform_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.is_platform_admin IS 'Platform-level administrator flag';
COMMENT ON TABLE public.system_settings IS 'System-wide settings including kill switch and feature flags';
COMMENT ON TABLE public.admin_actions IS 'Audit trail for all platform admin actions';
COMMENT ON FUNCTION public.is_platform_enabled() IS 'Check if platform operations are enabled';
COMMENT ON FUNCTION public.is_platform_admin(UUID) IS 'Check if a user is a platform admin';

