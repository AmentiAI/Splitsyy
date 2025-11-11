# Vercel Deployment Troubleshooting Guide

## Why Deployments Get Stuck in Queue

### 1. **Check Vercel Dashboard**

- Go to your Vercel project dashboard
- Check the "Deployments" tab
- Look for error messages or build logs
- Check if builds are actually running or just queued

### 2. **Common Causes & Solutions**

#### **Missing Environment Variables**

If environment variables are missing, the build might hang or fail silently.

**Check in Vercel Dashboard:**

1. Go to Project Settings → Environment Variables
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
   - `STRIPE_SECRET_KEY` (if using Stripe)
   - Any other required env vars

**Fix:** Add missing variables and redeploy

#### **Build Timeout**

Free tier has build time limits. Large builds can timeout.

**Check build logs for:**

- "Build exceeded maximum time"
- Timeout errors

**Solutions:**

- Optimize build (remove unused dependencies)
- Upgrade Vercel plan
- Add build timeout config to `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### **Account Limits (Free Tier)**

Free tier has limits:

- 100 builds per day
- Concurrent build limits
- Build time limits

**Check:** Vercel Dashboard → Settings → Usage

**Solution:** Wait for limit reset or upgrade plan

#### **Too Many Concurrent Builds**

If you have multiple projects or branches deploying simultaneously.

**Solution:** Cancel unnecessary builds, deploy one at a time

#### **Build Errors**

Build might be failing silently.

**Check:**

1. Vercel Dashboard → Deployments → Click on queued build
2. Check "Build Logs" tab
3. Look for TypeScript errors, missing dependencies, etc.

**Common Build Errors:**

- Missing `critters` package (we fixed this)
- ESLint config issues (we fixed this)
- TypeScript errors
- Missing dependencies

### 3. **Quick Fixes**

#### **Cancel and Redeploy**

1. Go to Vercel Dashboard
2. Find the stuck deployment
3. Click "Cancel"
4. Push a new commit or click "Redeploy"

#### **Check Build Locally First**

```bash
npm run build
```

If this fails locally, fix errors before deploying.

#### **Clear Vercel Cache**

1. Vercel Dashboard → Project Settings → General
2. Scroll to "Clear Build Cache"
3. Click "Clear" and redeploy

### 4. **Verify Configuration**

#### **Check vercel.json**

Your current `vercel.json` looks fine, but verify:

- Build command is correct
- Framework is detected correctly
- No conflicting settings

#### **Check next.config.ts**

- No build-time database connections ✅
- No blocking operations during build ✅

### 5. **Debug Steps**

1. **Check Build Logs:**
   - Vercel Dashboard → Deployments → Click deployment → Build Logs
   - Look for errors or warnings

2. **Test Build Locally:**

   ```bash
   npm run build
   ```

3. **Check Environment Variables:**
   - Verify all required vars are set in Vercel
   - Check for typos in variable names

4. **Check Account Status:**
   - Vercel Dashboard → Settings → Usage
   - Verify you haven't hit limits

5. **Try Manual Deploy:**
   - Vercel Dashboard → Deployments → "Redeploy"
   - Or push a small change to trigger new build

### 6. **If Still Stuck**

1. **Contact Vercel Support:**
   - Vercel Dashboard → Help → Support
   - Include deployment URL and logs

2. **Check Vercel Status:**
   - https://vercel-status.com
   - See if there are known issues

3. **Try Different Region:**
   - Your `vercel.json` specifies `iad1`
   - Try removing region or changing it

### 7. **Prevention**

- Always test builds locally before pushing
- Keep dependencies updated
- Monitor build times
- Set up build notifications
- Use Vercel's build optimization features
