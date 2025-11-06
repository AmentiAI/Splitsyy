# Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ GitHub repository connected
- ✅ Supabase project set up

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |

#### Optional (if using Stripe):

| Variable Name | Description |
|--------------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `SSN_ENCRYPTION_KEY` | Encryption key for SSN (32+ characters) |

### Step 2: Deploy

#### Option A: Deploy via Vercel Dashboard
1. Push your code to GitHub
2. Go to Vercel Dashboard
3. Click **Deploy** or it will auto-deploy on push

#### Option B: Deploy via CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Step 3: Verify Deployment

After deployment:
1. Check the deployment logs for any errors
2. Visit your deployment URL
3. Test the application

## Environment Variables Setup

### Where to Find Supabase Keys:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Important Notes:

- ⚠️ **Never commit** `.env` files to Git
- ✅ Set environment variables in Vercel dashboard
- ✅ Use different keys for production vs development
- ✅ `NEXT_PUBLIC_*` variables are exposed to the browser
- ✅ Service role key should NEVER be in `NEXT_PUBLIC_*`

## Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Verify Supabase URL and keys are correct
- Check build logs in Vercel dashboard

### Runtime Errors
- Verify environment variables are set for the correct environment (Production, Preview, Development)
- Check browser console for errors
- Verify Supabase connection

### Database Connection Issues
- Ensure Supabase project is active
- Check RLS policies are set correctly
- Verify API keys have correct permissions

## Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Build completes successfully
- [ ] Application loads without errors
- [ ] Can register/login
- [ ] Database connection works
- [ ] Admin panel accessible (if admin account exists)
- [ ] API routes responding correctly

## Need Help?

- Check Vercel deployment logs
- Review Supabase connection in dashboard
- Verify all environment variables are set correctly

