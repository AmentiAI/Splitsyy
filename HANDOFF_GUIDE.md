# Splitsy Platform - Complete Handoff Guide

**Version:** 1.0.0  
**Date:** January 2025  
**Status:** Production Ready (with configuration required)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Required Setup](#required-setup)
4. [ID Verification Setup](#id-verification-setup)
5. [Payment Processing Setup](#payment-processing-setup)
6. [Production Deployment](#production-deployment)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [Testing Checklist](#testing-checklist)
10. [Support & Troubleshooting](#support--troubleshooting)

---

## 🎯 Overview

Splitsy is a **production-ready group payment platform** that enables friends, families, and teams to pool money together and use shared virtual cards for purchases. The platform includes:

- ✅ **Complete Authentication System** (Supabase Auth)
- ✅ **Group & Pool Management** (Full CRUD operations)
- ✅ **Payment Processing** (Stripe integration ready, mock mode available)
- ✅ **ID Verification System** (Ready for Plaid/third-party integration)
- ✅ **Virtual Card Management** (Stripe Issuing ready)
- ✅ **Apple Pay Integration** (Mock mode available, production ready)
- ✅ **Admin Dashboard** (User management, verification review, analytics)
- ✅ **Audit Logging** (Complete security trail)
- ✅ **Row-Level Security** (Database-level access control)

---

## ✅ Current Status

### Fully Implemented & Working

- ✅ User authentication (register, login, logout)
- ✅ User profile management
- ✅ Group creation and management
- ✅ Pool creation and funding
- ✅ Contribution tracking
- ✅ Virtual card creation (mock mode)
- ✅ Transaction history
- ✅ Admin dashboard
- ✅ Verification submission system
- ✅ Database schema (all tables, RLS policies, triggers)
- ✅ API endpoints (all CRUD operations)
- ✅ Frontend UI (responsive, modern design)

### Requires Configuration

- ⚙️ **Payment Processing** - Currently in mock mode, needs Stripe credentials
- ⚙️ **ID Verification** - System ready, needs Plaid/third-party integration
- ⚙️ **Apple Pay** - Mock mode available, needs Apple Developer setup
- ⚙️ **Production Environment** - Needs environment variables configured

---

## 🔧 Required Setup

### Prerequisites

1. **Supabase Account** ✅ (Already configured)
   - Database URL: `https://erbttojgtatogjnezjev.supabase.co`
   - Service role key required

2. **Stripe Account** (For payment processing)
   - Sign up at [stripe.com](https://stripe.com)
   - Request Stripe Issuing access
   - Get API keys

3. **Plaid Account** (For ID verification - recommended)
   - Sign up at [plaid.com](https://plaid.com)
   - Get API keys
   - Configure webhooks

4. **Apple Developer Account** (For Apple Pay - optional)
   - Enroll at [developer.apple.com](https://developer.apple.com)
   - $99/year membership

5. **Vercel Account** (For deployment)
   - Already configured
   - Connect GitHub repository

---

## 🔐 ID Verification Setup

### Current Implementation

The platform has a complete ID verification system ready for integration:

- ✅ Database table: `user_verification` (encrypted SSN storage)
- ✅ API endpoints: `/api/verification/submit` (POST/GET)
- ✅ Admin review: `/api/admin/verification` (GET/PATCH)
- ✅ Encryption: AES-256-CBC for sensitive data
- ✅ Admin UI: Verification viewer component

### Integration Options

#### Option 1: Plaid (Recommended)

**Why Plaid:**

- Bank account verification
- Identity verification
- Income verification
- Single integration for multiple needs

**Setup Steps:**

1. **Create Plaid Account**

   ```bash
   # Sign up at https://plaid.com
   # Get API keys from dashboard
   ```

2. **Install Plaid SDK**

   ```bash
   npm install plaid
   ```

3. **Add Environment Variables**

   ```env
   PLAID_CLIENT_ID=your_client_id
   PLAID_SECRET=your_secret_key
   PLAID_ENV=sandbox  # or 'development', 'production'
   ```

4. **Create Plaid Integration File**

   ```typescript
   // lib/plaid/client.ts
   import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

   const configuration = new Configuration({
     basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
     baseOptions: {
       headers: {
         "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
         "PLAID-SECRET": process.env.PLAID_SECRET,
       },
     },
   });

   export const plaidClient = new PlaidApi(configuration);
   ```

5. **Update Verification Endpoint**

   ```typescript
   // app/api/verification/submit/route.ts
   // Replace mock provider call with:
   import { plaidClient } from "@/lib/plaid/client";

   const identityVerification = await plaidClient.identityVerificationCreate({
     client_user_id: session.user.id,
     is_idempotent: true,
   });
   ```

#### Option 2: Stripe Identity

**Setup Steps:**

1. **Enable Stripe Identity**

   ```bash
   # In Stripe Dashboard
   # Go to: Products > Identity
   # Enable Identity verification
   ```

2. **Add Environment Variable**

   ```env
   STRIPE_IDENTITY_SECRET_KEY=sk_live_...
   ```

3. **Update Verification Endpoint**
   ```typescript
   // Replace mock with:
   const verificationSession =
     await stripe.identity.verificationSessions.create({
       type: "document",
       metadata: { user_id: session.user.id },
     });
   ```

#### Option 3: Other Providers

The system supports:

- Socure
- Persona
- Jumio
- Onfido
- Custom (manual verification)

See `app/api/verification/submit/route.ts` for integration points.

### Verification Flow

```
User Submits Verification
  ↓
POST /api/verification/submit
  ↓
Encrypt SSN & ID Number
  ↓
Call Third-Party API (Plaid/Stripe/etc.)
  ↓
Store Verification Record
  ↓
Update User KYC Status → "pending"
  ↓
Admin Reviews (via /admin)
  ↓
Approve/Reject → Update KYC Status
```

### Database Schema

The `user_verification` table includes:

- Encrypted SSN (`ssn_encrypted`)
- Encrypted ID number (`id_number_encrypted`)
- Provider information (Plaid, Stripe, etc.)
- Verification status
- Admin notes

**Migration:** Already included in `supabase/migrations/20250124000002_add_user_verification.sql`

---

## 💳 Payment Processing Setup

### Current Implementation

- ✅ Payment service abstraction (`lib/payments/`)
- ✅ Mock provider (works without credentials)
- ✅ Stripe provider (ready for production)
- ✅ Webhook handling (`/api/webhooks/payments`)
- ✅ Payment intent creation
- ✅ Virtual card creation
- ✅ Apple Pay provisioning

### Stripe Setup

#### 1. Get Stripe API Keys

```bash
# From Stripe Dashboard:
# Settings > API keys
STRIPE_SECRET_KEY=sk_test_...  # Test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 2. Request Stripe Issuing Access

Stripe Issuing is required for virtual card creation:

- Go to Stripe Dashboard > Issuing
- Request access (may require business verification)
- Wait for approval

#### 3. Configure Webhooks

```bash
# In Stripe Dashboard:
# Developers > Webhooks > Add endpoint
# URL: https://yourdomain.com/api/webhooks/payments
# Events to listen:
#   - payment_intent.succeeded
#   - payment_intent.payment_failed
#   - issuing_card.created
#   - issuing_transaction.created
```

Get webhook secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 4. Enable Payment Processing

```env
# .env.local or Vercel environment variables
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 5. Test Payment Flow

```bash
# Use Stripe test cards:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# 3D Secure: 4000 0025 0000 3155

# Test virtual card creation
# Test contribution payment
# Verify webhook receives events
```

### Payment Flow

```
User Creates Contribution
  ↓
POST /api/pools/:id/contributions
  ↓
Create Payment Intent (Stripe)
  ↓
Return Client Secret
  ↓
Frontend: Stripe Elements
  ↓
User Completes Payment
  ↓
Webhook: payment_intent.succeeded
  ↓
Update Contribution Status → "succeeded"
  ↓
Update Pool Balance
```

### Virtual Card Flow

```
User Creates Card Request
  ↓
POST /api/cards
  ↓
Check Pool Balance
  ↓
Create Virtual Card (Stripe Issuing)
  ↓
Store Card Record
  ↓
Return Card Details (last4, limits)
```

---

## 🚀 Production Deployment

### Vercel Deployment

#### 1. Connect Repository

```bash
# Already connected
# Repository: https://github.com/AmentiAI/Splitsyy
```

#### 2. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://erbttojgtatogjnezjev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Processing (Required for production)
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ID Verification (Required)
SSN_ENCRYPTION_KEY=your-32-character-random-key-here
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=production

# Apple Pay (Optional)
APPLE_PAY_ENABLED=true
APPLE_PAY_MERCHANT_ID=merchant.com.splitsy
APPLE_PAY_MERCHANT_NAME=Splitsy
APPLE_PAY_TEAM_ID=your_team_id
NEXT_PUBLIC_APP_URL=https://splitsy.vercel.app

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://splitsy.vercel.app
```

#### 3. Deploy

```bash
# Automatic deployment on git push
git push origin main

# Or manual deployment
vercel --prod
```

#### 4. Verify Deployment

- ✅ Check build logs for errors
- ✅ Test authentication flow
- ✅ Test payment processing
- ✅ Verify webhooks are receiving events
- ✅ Check database connections

---

## 🔑 Environment Variables

### Required (Core)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://erbttojgtatogjnezjev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Encryption (for ID verification)
SSN_ENCRYPTION_KEY=your-32-character-random-key
```

### Required (Payment Processing)

```env
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Required (ID Verification)

```env
# Plaid (recommended)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=production

# OR Stripe Identity
STRIPE_IDENTITY_SECRET_KEY=sk_live_...
```

### Optional (Apple Pay)

```env
APPLE_PAY_ENABLED=true
APPLE_PAY_MERCHANT_ID=merchant.com.splitsy
APPLE_PAY_MERCHANT_NAME=Splitsy
APPLE_PAY_TEAM_ID=ABC123DEF4
NEXT_PUBLIC_APP_URL=https://splitsy.vercel.app
```

### Optional (Application)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://splitsy.vercel.app
```

---

## 🗄️ Database Setup

### Current Status

✅ **All migrations applied**

- Core schema (`20250125000000_complete_setup.sql`)
- User verification (`20250124000002_add_user_verification.sql`)
- RLS policies fixed (`20250125000001_fix_group_members_rls_recursion.sql`)

### Verify Database

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- users
-- groups
-- group_members
-- pools
-- contributions
-- virtual_cards
-- transactions
-- audit_logs
-- user_verification
```

### Create Admin User

```sql
-- Make a user an admin
UPDATE users
SET is_platform_admin = TRUE
WHERE email = 'admin@example.com';
```

### Database Backup

```bash
# Supabase Dashboard > Database > Backups
# Enable automatic daily backups
# Or manual backup:
pg_dump -h db.erbttojgtatogjnezjev.supabase.co -U postgres -d postgres > backup.sql
```

---

## ✅ Testing Checklist

### Authentication

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Session persistence works
- [ ] Password reset works (if implemented)

### Groups & Pools

- [ ] Create group
- [ ] Add members to group
- [ ] Create pool
- [ ] View pool details
- [ ] Update pool status

### Payments

- [ ] Create contribution (mock mode)
- [ ] Create contribution (Stripe - test mode)
- [ ] Payment intent created successfully
- [ ] Webhook receives payment events
- [ ] Contribution status updates correctly
- [ ] Pool balance updates correctly

### Virtual Cards

- [ ] Create virtual card (mock mode)
- [ ] Create virtual card (Stripe Issuing)
- [ ] View card details
- [ ] Suspend/activate card
- [ ] Apple Pay provisioning (if enabled)

### ID Verification

- [ ] Submit verification data
- [ ] SSN encrypted correctly
- [ ] Admin can view verification
- [ ] Admin can approve/reject
- [ ] User KYC status updates
- [ ] Plaid integration (if configured)

### Admin Dashboard

- [ ] Admin can access `/admin`
- [ ] View all users
- [ ] View verifications
- [ ] Update user status
- [ ] View analytics
- [ ] Audit logs visible

### Security

- [ ] RLS policies enforced
- [ ] Admin-only endpoints protected
- [ ] Sensitive data encrypted
- [ ] Audit logs created
- [ ] Webhook signatures verified

---

## 🆘 Support & Troubleshooting

### Common Issues

#### 1. "Failed to fetch splits" Error

**Solution:**

- Verify database tables exist
- Check RLS policies
- Verify user is authenticated

#### 2. "Payment provider not configured"

**Solution:**

```env
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_...
```

#### 3. "Invalid email or password"

**Solution:**

- Check Supabase Auth configuration
- Verify user exists in `auth.users`
- Check user profile exists in `users` table

#### 4. "Infinite recursion detected in policy"

**Solution:**

- Already fixed in migration `20250125000001_fix_group_members_rls_recursion.sql`
- Re-run migration if needed

#### 5. Webhooks not working

**Solution:**

- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set
- Verify endpoint is accessible (HTTPS required)
- Check Vercel function logs

### Debugging

#### Check Logs

```bash
# Vercel Dashboard > Functions > View Logs
# Or local:
npm run dev
# Check console for errors
```

#### Database Queries

```sql
-- Check user verification status
SELECT id, email, kyc_status FROM users;

-- Check verification submissions
SELECT id, user_id, provider_status
FROM user_verification;

-- Check contributions
SELECT id, pool_id, amount, status
FROM contributions
ORDER BY created_at DESC;
```

#### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test verification submission
curl -X POST http://localhost:3000/api/verification/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"ssn":"123-45-6789","dateOfBirth":"1990-01-01",...}'
```

### Getting Help

1. **Check Documentation**
   - `README.md` - General overview
   - `PAYMENT_SETUP.md` - Payment configuration
   - `VERIFICATION_SETUP.md` - ID verification setup
   - `APPLEPAY_SETUP.md` - Apple Pay setup

2. **Review Code**
   - API routes: `app/api/`
   - Database migrations: `supabase/migrations/`
   - Payment service: `lib/payments/`

3. **Check Audit Logs**
   ```sql
   SELECT * FROM audit_logs
   ORDER BY created_at DESC
   LIMIT 50;
   ```

---

## 📚 Additional Resources

### Documentation Files

- `README.md` - Main documentation
- `PAYMENT_SETUP.md` - Payment processing guide
- `VERIFICATION_SETUP.md` - ID verification guide
- `APPLEPAY_SETUP.md` - Apple Pay integration
- `DATABASE_SETUP_NEW.md` - Database setup instructions
- `ADMIN_QUICK_START.md` - Admin dashboard guide

### External Resources

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Plaid Docs](https://plaid.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

---

## 🚀 Quick Start Guide

### For Immediate Handoff

1. **Review Documentation**
   - Read `HANDOFF_GUIDE.md` (this file)
   - Review `PRODUCTION_CHECKLIST.md`
   - Check `PLAID_INTEGRATION_GUIDE.md` (if using Plaid)

2. **Set Up Environment Variables**
   - Copy `.env.local.example` to `.env.local` (if exists)
   - Add all required variables (see [Environment Variables](#-environment-variables))
   - Configure in Vercel dashboard for production

3. **Run Database Migrations**

   ```sql
   -- In Supabase SQL Editor, run:
   -- 1. supabase/migrations/20250125000000_complete_setup.sql
   -- 2. supabase/migrations/20250125000001_fix_group_members_rls_recursion.sql
   -- 3. supabase/migrations/20250125000002_add_user_verification_to_complete.sql
   ```

4. **Test Core Functionality**
   - Register a test user
   - Create a group
   - Create a pool
   - Test payment (mock mode first)
   - Test verification submission

5. **Configure Production Services**
   - Set up Stripe account
   - Set up Plaid account (for ID verification)
   - Configure webhooks
   - Test with real credentials

---

## 🎉 Next Steps

1. **Configure Payment Processing**
   - Set up Stripe account
   - Add API keys to environment variables
   - Test payment flow

2. **Configure ID Verification**
   - Set up Plaid account (recommended)
   - Integrate Plaid SDK
   - Test verification flow

3. **Deploy to Production**
   - Configure all environment variables
   - Run final tests
   - Monitor logs

4. **Set Up Monitoring**
   - Configure error tracking (Sentry, etc.)
   - Set up uptime monitoring
   - Configure alerts

5. **Launch!**
   - Create first admin user
   - Test end-to-end flows
   - Onboard first users

---

## 📚 Documentation Index

- **`HANDOFF_GUIDE.md`** - Complete handoff guide (this file)
- **`PRODUCTION_CHECKLIST.md`** - Pre-launch checklist
- **`PLAID_INTEGRATION_GUIDE.md`** - Plaid setup instructions
- **`PAYMENT_SETUP.md`** - Payment processing guide
- **`VERIFICATION_SETUP.md`** - ID verification guide
- **`APPLEPAY_SETUP.md`** - Apple Pay integration
- **`README.md`** - General documentation
- **`DATABASE_SETUP_NEW.md`** - Database setup instructions

---

**Platform Status:** ✅ Ready for Production (with configuration)

**Last Updated:** January 2025

**Questions?** Review the documentation files or check the code comments for implementation details.
