-- Quick Admin Migration
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add admin column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS users_is_platform_admin_idx 
ON public.users(is_platform_admin) 
WHERE is_platform_admin = TRUE;

-- Step 3: Make admin@signull.com an admin
UPDATE public.users 
SET is_platform_admin = TRUE 
WHERE email = 'admin@signull.com';

-- Verify
SELECT email, is_platform_admin FROM public.users WHERE email = 'admin@signull.com';

