# Registration 500 Error Troubleshooting Guide

## Error: `/api/auth/register` returns 500 status

This guide helps you debug and fix the 500 error when registering a new user.

## Common Causes

### 1. Missing Environment Variables

**Check:** Ensure these are set in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Required for registration**

**Fix:**

```bash
# Get these from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Critical!
```

### 2. Database Table Missing

**Check:** The `users` table must exist in your database.

**Fix:** Run the migration:

1. Go to Supabase Dashboard > SQL Editor
2. Run: `supabase/migrations/20250125000004_complete_database_setup.sql`

### 3. RLS Policy Blocking Admin Client

**Check:** The admin client uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS, but if the key is wrong, it will fail.

**Fix:** Verify the service role key is correct in Supabase Dashboard.

### 4. Audit Log Table Missing

**Check:** The `audit_logs` table must exist (though registration will continue even if audit logging fails).

**Fix:** Ensure the migration created the `audit_logs` table.

## Debugging Steps

### Step 1: Check Server Logs

Look at your terminal/console where `npm run dev` is running. You should see detailed error messages:

```
Registration error: [error details]
Profile creation error: [error details]
```

### Step 2: Check Browser Console

Open browser DevTools > Network tab:

1. Find the `/api/auth/register` request
2. Click on it
3. Check the "Response" tab for error details

### Step 3: Test Environment Variables

Create a test script:

```typescript
// scripts/test-env.ts
import { config } from "dotenv";
config({ path: ".env.local" });

console.log(
  "SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"
);
console.log(
  "ANON_KEY:",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"
);
```

Run: `npx tsx scripts/test-env.ts`

### Step 4: Test Database Connection

```bash
npm run db:test
```

Should show: ✅ All tables exist

### Step 5: Test Admin Client

Create a test script:

```typescript
// scripts/test-admin.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "dotenv";

config({ path: ".env.local" });

try {
  const admin = createAdminClient();
  console.log("✅ Admin client created successfully");

  // Test query
  const { data, error } = await admin
    .from("users")
    .select("count", { count: "exact", head: true });
  if (error) {
    console.error("❌ Admin query error:", error);
  } else {
    console.log("✅ Admin query successful");
  }
} catch (error) {
  console.error("❌ Admin client error:", error);
}
```

## Error Response Format

The improved error handling now returns detailed error messages:

```json
{
  "error": "Failed to create user profile",
  "details": "specific error message",
  "code": "error_code"
}
```

## Common Error Messages

### "Server configuration error"

- **Cause:** Missing environment variables
- **Fix:** Check `.env.local` has all required variables

### "Failed to create user profile"

- **Cause:** Database insert failed (RLS, missing table, constraint violation)
- **Fix:** Check database tables exist and RLS policies allow admin operations

### "Failed to check user existence"

- **Cause:** Database query failed
- **Fix:** Verify database connection and table exists

### "Auth signup error"

- **Cause:** Supabase Auth rejected the signup (weak password, email format, etc.)
- **Fix:** Check password requirements and email format

## Quick Fix Checklist

- [ ] All environment variables set in `.env.local`
- [ ] Database migration run successfully
- [ ] `users` table exists
- [ ] `audit_logs` table exists
- [ ] Service role key is correct
- [ ] Restart dev server after changing `.env.local`
- [ ] Check server logs for specific error

## Still Having Issues?

1. **Check server logs** - Most errors are logged there
2. **Check browser Network tab** - See the actual error response
3. **Verify database** - Run `npm run db:test`
4. **Test admin client** - Use the test script above

## Next Steps After Fix

Once registration works:

1. Test login flow
2. Verify user profile is created
3. Check audit logs are being written
4. Test email confirmation (if enabled)
