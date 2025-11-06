# Troubleshooting Guide

## "fetch failed" Error in Supabase Auth

If you're seeing `fetch failed` errors related to Supabase Auth in your console, follow these steps:

### Step 1: Check Environment Variables

Ensure your `.env.local` file exists and contains valid Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Verify Environment Variables Are Loaded

Check if Next.js is reading your environment variables:

```bash
# In your terminal, verify variables exist
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

If this returns `undefined`, your `.env.local` file is not being read.

### Step 3: Restart Development Server

Environment variable changes require a server restart:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Check Network Connectivity

Verify you can reach Supabase:

```bash
# Test the Supabase URL (replace with your URL)
curl https://your-project-id.supabase.co
```

If this fails, check:
- Your internet connection
- Firewall/proxy settings
- VPN if you're using one

### Step 5: Verify Supabase Project Status

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if your project is active (not paused)
3. Verify the project URL matches your environment variable

### Step 6: Check for Typos

Common mistakes:
- ❌ Missing `NEXT_PUBLIC_` prefix (required for client-side access)
- ❌ Trailing spaces in environment variables
- ❌ Using quotes around values (not needed)
- ❌ Wrong file name (should be `.env.local`, not `.env`)

### Step 7: Test Connection Manually

Create a test file to verify the connection:

```typescript
// scripts/test-connection.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from("users").select("count");
    if (error) throw error;
    console.log("✅ Connection successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  }
}

test();
```

Run it:
```bash
tsx scripts/test-connection.ts
```

## Common Issues

### Issue: "fetch failed" in Middleware

**Cause:** Middleware runs on Edge runtime which may have network restrictions.

**Solution:** The middleware now includes error handling to gracefully handle network failures without breaking your app.

### Issue: Environment Variables Not Loading

**Cause:** `.env.local` not in the right location or server not restarted.

**Solution:**
1. Ensure `.env.local` is in the project root (same level as `package.json`)
2. Restart your development server
3. Check that variables don't have quotes: `NEXT_PUBLIC_SUPABASE_URL="url"` ❌ → `NEXT_PUBLIC_SUPABASE_URL=url` ✅

### Issue: CORS Errors

**Cause:** Supabase URL not properly configured or project settings incorrect.

**Solution:**
1. Verify your Supabase project allows requests from your domain
2. Check Supabase Dashboard → Settings → API → CORS settings
3. For localhost, add `http://localhost:3000` to allowed origins

### Issue: "Invalid API Key"

**Cause:** Wrong anon key or key has been rotated.

**Solution:**
1. Get fresh keys from Supabase Dashboard → Settings → API
2. Update `.env.local` with new keys
3. Restart server

## Still Having Issues?

1. **Check the console** for the full error message
2. **Review Supabase logs** in the dashboard
3. **Check network tab** in browser dev tools for failed requests
4. **Verify project is active** in Supabase dashboard

## Quick Fix Checklist

- [ ] `.env.local` exists in project root
- [ ] Environment variables are set correctly
- [ ] Development server has been restarted
- [ ] Supabase project is active (not paused)
- [ ] Can reach Supabase URL (test with curl)
- [ ] No typos in environment variable names
- [ ] `NEXT_PUBLIC_` prefix is used for client-side variables

