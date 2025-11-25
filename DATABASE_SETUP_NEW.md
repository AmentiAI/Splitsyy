# Database Setup Guide for New Supabase Project

This guide will help you set up your new Supabase database for the Splitsy application.

## Prerequisites

1. A Supabase project (cloud or local)
2. Access to the Supabase SQL Editor

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Set Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**For Vercel deployment:**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all three Supabase variables above

## Step 3: Run the Database Migration

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `supabase/migrations/20250125000000_complete_setup.sql`
5. Copy the **entire contents** of that file
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

The migration will create:

- ✅ All core tables (users, groups, pools, contributions, etc.)
- ✅ All splits tables (splits, split_participants, split_payments)
- ✅ All Row-Level Security (RLS) policies
- ✅ All triggers and helper functions
- ✅ All indexes for performance
- ✅ All views for common queries

## Step 4: Verify Tables Were Created

Run this query in the SQL Editor to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:

- audit_logs
- contributions
- group_members
- groups
- pools
- split_participants
- split_payments
- splits
- transactions
- users
- virtual_cards

## Step 5: Test the Connection

Restart your development server:

```bash
npm run dev
```

Then:

1. Try to sign up/login
2. Navigate to `/splits` page
3. Check the browser console for any errors

## Troubleshooting

### Error: "Could not find the table 'public.splits'"

**Solution:** The migration didn't run successfully. Go back to Step 3 and run the migration again. Make sure you copied the **entire** file.

### Error: "relation does not exist"

**Solution:** Check that all tables were created (Step 4). If any are missing, re-run the migration.

### Error: "permission denied"

**Solution:** Make sure you're using the correct Supabase credentials in your `.env.local` file. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be the "anon public" key, not the service role key.

### Error: "Row Level Security policy violation"

**Solution:** This is normal! RLS is working correctly. Make sure you're authenticated (logged in) when accessing protected data.

## What's Next?

Once the database is set up:

1. ✅ Create a user account (sign up)
2. ✅ Create a split bill
3. ✅ Add participants
4. ✅ Send payment links
5. ✅ Process payments

## Need Help?

If you encounter any issues:

1. Check the Supabase Dashboard → Logs for database errors
2. Check your browser console for frontend errors
3. Verify your environment variables are set correctly
4. Make sure you ran the complete migration file

---

**Migration File:** `supabase/migrations/20250125000000_complete_setup.sql`
