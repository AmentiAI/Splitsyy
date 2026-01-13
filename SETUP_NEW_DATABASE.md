# Setup New Supabase Database - Complete Guide

This guide will help you set up a brand new Supabase database with all tables, policies, and functions for the Splitsy application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** Splitsy (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Supabase Credentials

1. In your Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 3: Set Environment Variables

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

## Step 4: Run the Database Migration

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Open the file: `supabase/migrations/20250125000004_complete_database_setup.sql`
5. Copy the **entire contents** of that file
6. Paste it into the SQL Editor
7. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

You should see: **"Success. No rows returned"**

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## Step 5: Verify Tables Were Created

Run this query in the SQL Editor to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:

- ✅ audit_logs
- ✅ contributions
- ✅ group_members
- ✅ groups
- ✅ pools
- ✅ split_participants
- ✅ split_payments
- ✅ splits
- ✅ transactions
- ✅ user_payment_methods
- ✅ user_settings
- ✅ user_verification
- ✅ users

## Step 6: Test the Connection

Run the database connection test:

```bash
npm run db:test
```

You should see:

- ✅ Network connection OK
- ✅ Connection successful
- ✅ Tables found: 13
- ✅ RLS is working

## Step 7: Test Your Application

Start your development server:

```bash
npm run dev
```

Then:

1. Try to sign up/login at `/auth/login`
2. Navigate to `/splits` page
3. Check the browser console for any errors

## What Was Created

### Core Tables

- **users** - User profiles (extends auth.users)
- **groups** - Payment groups
- **group_members** - Group membership and roles
- **pools** - Shared fund pools
- **contributions** - Individual contributions
- **virtual_cards** - Virtual payment cards
- **transactions** - Payment transactions
- **audit_logs** - Security audit trail

### Splits Tables

- **splits** - Bill splitting requests
- **split_participants** - People who need to pay
- **split_payments** - Payment records

### User Tables

- **user_payment_methods** - Payment methods (cards, bank accounts)
- **user_verification** - ID verification and KYC data
- **user_settings** - User preferences and settings

### Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies for user data isolation
- ✅ Role-based access control (owner/admin/member)
- ✅ Audit logging for compliance

### Automatic Features

- ✅ Auto-update timestamps
- ✅ Auto-increment pool amounts
- ✅ Auto-add group owners as members
- ✅ Helper views for common queries

## Troubleshooting

### Error: "relation does not exist"

**Solution:** The migration didn't run successfully. Go back to Step 4 and run the migration again. Make sure you copied the **entire** file.

### Error: "permission denied"

**Solution:** Make sure you're using the correct Supabase credentials in your `.env.local` file. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be the "anon public" key, not the service role key.

### Error: "Row Level Security policy violation"

**Solution:** This is normal! RLS is working correctly. Make sure you're authenticated (logged in) when accessing protected data.

### Error: "Connection failed" when running `npm run db:test`

**Solution:**

1. Check your Supabase project is active (not paused)
2. Verify your `.env.local` has the correct URL and keys
3. Check your internet connection

### Tables not showing up

**Solution:**

1. Make sure you ran the complete migration file
2. Check the Supabase Dashboard → Logs for any errors
3. Try running the verification query from Step 5

## Next Steps

Once the database is set up:

1. ✅ Create a user account (sign up)
2. ✅ Create a split bill
3. ✅ Add participants
4. ✅ Send payment links
5. ✅ Process payments
6. ✅ Create groups and pools
7. ✅ Add payment methods
8. ✅ Configure user settings

## Need Help?

If you encounter any issues:

1. Check the Supabase Dashboard → Logs for database errors
2. Check your browser console for frontend errors
3. Verify your environment variables are set correctly
4. Make sure you ran the complete migration file
5. Test the connection with `npm run db:test`

---

**Migration File:** `supabase/migrations/20250125000004_complete_database_setup.sql`

**Status:** ✅ All tables, policies, triggers, and functions created successfully!
