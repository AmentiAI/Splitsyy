# Production Deployment Checklist

Use this checklist to ensure everything is configured correctly before launching Splitsy to production.

---

## 🔐 Environment Variables

### Required (Core)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- [ ] `SSN_ENCRYPTION_KEY` - 32+ character random key for encryption

### Required (Payment Processing)

- [ ] `PAYMENT_PROVIDER_ENABLED=true`
- [ ] `PAYMENT_PROVIDER=stripe`
- [ ] `STRIPE_SECRET_KEY` - Stripe live secret key (`sk_live_...`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe live publishable key (`pk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (`whsec_...`)

### Required (ID Verification)

Choose one:

**Option A: Plaid (Recommended)**

- [ ] `PLAID_CLIENT_ID`
- [ ] `PLAID_SECRET`
- [ ] `PLAID_ENV=production`

**Option B: Stripe Identity**

- [ ] `STRIPE_IDENTITY_SECRET_KEY`

### Optional (Apple Pay)

- [ ] `APPLE_PAY_ENABLED=true`
- [ ] `APPLE_PAY_MERCHANT_ID`
- [ ] `APPLE_PAY_MERCHANT_NAME`
- [ ] `APPLE_PAY_TEAM_ID`
- [ ] `NEXT_PUBLIC_APP_URL` - Production domain

### Application

- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` - Production domain URL

---

## 🗄️ Database Setup

- [ ] All migrations applied
  - [ ] `20250125000000_complete_setup.sql`
  - [ ] `20250125000001_fix_group_members_rls_recursion.sql`
  - [ ] `20250125000002_add_user_verification_to_complete.sql`
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Triggers working correctly
- [ ] Admin user created
- [ ] Database backups enabled

### Verify Database

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Should see:
-- audit_logs
-- contributions
-- group_members
-- groups
-- pools
-- splits
-- split_participants
-- split_payments
-- transactions
-- user_verification
-- users
```

---

## 💳 Payment Processing

### Stripe Configuration

- [ ] Stripe account verified
- [ ] Stripe Issuing access approved
- [ ] Live API keys configured
- [ ] Webhook endpoint configured:
  - [ ] URL: `https://yourdomain.com/api/webhooks/payments`
  - [ ] Events selected:
    - [ ] `payment_intent.succeeded`
    - [ ] `payment_intent.payment_failed`
    - [ ] `issuing_card.created`
    - [ ] `issuing_transaction.created`
  - [ ] Webhook secret copied
- [ ] Test payment flow works
- [ ] Test virtual card creation works
- [ ] Webhooks receiving events

### Test Cards

- [ ] Success: `4242 4242 4242 4242`
- [ ] Decline: `4000 0000 0000 0002`
- [ ] 3D Secure: `4000 0025 0000 3155`

---

## 🔐 ID Verification

### Plaid (If Using)

- [ ] Plaid account created
- [ ] Production API keys configured
- [ ] Webhook endpoint configured:
  - [ ] URL: `https://yourdomain.com/api/webhooks/plaid`
  - [ ] Events selected:
    - [ ] `IDENTITY_VERIFICATION.status_updated`
- [ ] Test verification flow works
- [ ] Webhooks receiving events

### Stripe Identity (If Using)

- [ ] Stripe Identity enabled
- [ ] API keys configured
- [ ] Test verification flow works

---

## 🍎 Apple Pay (Optional)

- [ ] Apple Developer account active
- [ ] Merchant ID created
- [ ] Domain verified
- [ ] Certificate configured
- [ ] Test provisioning works
- [ ] Test payment works

---

## 🚀 Deployment

### Vercel

- [ ] Repository connected
- [ ] All environment variables set
- [ ] Build succeeds
- [ ] Deployment successful
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled (automatic on Vercel)

### Verify Deployment

- [ ] Homepage loads
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Database connections work
- [ ] No console errors

---

## 🧪 Testing

### Authentication

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Session persistence works
- [ ] Password reset works (if implemented)

### Core Features

- [ ] Create group
- [ ] Add members to group
- [ ] Create pool
- [ ] Make contribution (test mode)
- [ ] Create virtual card (test mode)
- [ ] View transactions
- [ ] Admin dashboard accessible

### Payment Processing

- [ ] Create contribution (real Stripe)
- [ ] Payment intent created
- [ ] Payment completes successfully
- [ ] Webhook updates status
- [ ] Pool balance updates
- [ ] Virtual card created (Stripe Issuing)
- [ ] Card details visible

### ID Verification

- [ ] Submit verification
- [ ] Data encrypted correctly
- [ ] Admin can view verification
- [ ] Admin can approve/reject
- [ ] User KYC status updates
- [ ] Webhook processes correctly

### Security

- [ ] RLS policies enforced
- [ ] Admin-only endpoints protected
- [ ] Sensitive data encrypted
- [ ] Audit logs created
- [ ] Webhook signatures verified
- [ ] No sensitive data in logs

---

## 📊 Monitoring

### Error Tracking

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Alerts set up for critical errors
- [ ] Log aggregation configured

### Performance

- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Database query monitoring

### Analytics

- [ ] Analytics configured (if applicable)
- [ ] User tracking enabled (if applicable)
- [ ] Conversion tracking (if applicable)

---

## 🔒 Security

### Data Protection

- [ ] Encryption keys stored securely
- [ ] No secrets in code
- [ ] Environment variables secured
- [ ] Database backups encrypted
- [ ] SSL/TLS enabled

### Access Control

- [ ] Admin users limited
- [ ] Strong passwords enforced
- [ ] 2FA enabled (if applicable)
- [ ] API rate limiting configured

### Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if applicable)
- [ ] PCI-DSS compliance (via Stripe)
- [ ] Data retention policy defined

---

## 📝 Documentation

- [ ] API documentation updated
- [ ] User guide created (if applicable)
- [ ] Admin guide created
- [ ] Troubleshooting guide created
- [ ] Handoff documentation complete

---

## 🎯 Launch Preparation

### Pre-Launch

- [ ] All tests passing
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Legal review completed
- [ ] Support channels set up

### Launch Day

- [ ] Monitor error logs
- [ ] Monitor payment processing
- [ ] Monitor webhook delivery
- [ ] Monitor database performance
- [ ] Be available for issues

### Post-Launch

- [ ] Monitor first transactions
- [ ] Monitor user registrations
- [ ] Monitor verification submissions
- [ ] Collect user feedback
- [ ] Address any issues quickly

---

## ✅ Final Checklist

- [ ] All environment variables configured
- [ ] Database fully set up
- [ ] Payment processing working
- [ ] ID verification working
- [ ] Deployment successful
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Security measures in place
- [ ] Documentation complete
- [ ] Team ready for launch

---

**Status:** Ready for Production ✅

**Last Updated:** January 2025
