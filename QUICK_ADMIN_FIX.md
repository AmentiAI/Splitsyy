# Quick Admin Setup - Run This Now!

## The Problem
The admin column doesn't exist in your database yet. The migration needs to be run first.

## Quick Fix (2 minutes)

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project: `lxetwzwoagomnysokneo`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy and paste this SQL:**

```sql
-- Add admin column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index
CREATE INDEX IF NOT EXISTS users_is_platform_admin_idx 
ON public.users(is_platform_admin) 
WHERE is_platform_admin = TRUE;

-- Make admin@signull.com an admin
UPDATE public.users 
SET is_platform_admin = TRUE 
WHERE email = 'admin@signull.com';
```

4. **Click "Run"** (or press Ctrl+Enter)

5. **Done!** Refresh `/admin` page - you should now have access!

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Then run:
```bash
npx tsx scripts/make-admin.ts admin@signull.com
```

## Verify It Worked

Run this to check:
```bash
npx tsx scripts/list-users.ts
```

You should see `Admin: ✅ YES` next to your email.

## Troubleshooting

**"relation users does not exist"**
- Run the initial migrations first (see SUPABASE_SETUP.md)

**"column already exists"**
- That's fine! The column is already there
- Just run the UPDATE statement to make yourself admin

**Still can't access /admin**
- Log out and log back in
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

