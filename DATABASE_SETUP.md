# Database Setup Guide

## Error: "Could not find the table 'public.splits'"

This error means the database tables haven't been created yet. Follow these steps to fix it:

## Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your Splitsy project
3. Click on **SQL Editor** in the left sidebar

## Step 2: Check if Tables Exist (Optional)

Run this query first to check if the tables exist:

```sql
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('splits', 'split_participants', 'split_payments')
ORDER BY table_name;
```

- **If you see 3 rows**: Tables exist, skip to Step 4
- **If you see 0 rows**: Continue to Step 3

## Step 3: Run the Migration

1. In the SQL Editor, click **"New Query"**
2. Open the file: `supabase/migrations/combined_setup_splits.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

You should see: "Success. No rows returned"

## Step 4: Verify Tables Were Created

Run the check query from Step 2 again. You should now see 3 rows:

- splits
- split_participants
- split_payments

## Step 5: Refresh Your App

Go back to your Splitsy app and refresh the page. The error should be gone!

## Troubleshooting

### Error: "relation 'public.users' does not exist"

- You need to run the initial schema migration first
- Run `supabase/migrations/20250101000001_initial_schema.sql` first
- Then run `combined_setup_splits.sql`

### Error: "permission denied"

- Make sure you're running the query as the database owner
- Check that you're logged into the correct Supabase project

### Still having issues?

- Check the Supabase logs for detailed error messages
- Make sure your Supabase project is active and not paused
- Verify your database connection settings in `.env.local`
