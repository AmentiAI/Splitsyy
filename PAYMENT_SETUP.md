# Payment Integration Setup Guide

This guide explains how to configure payment processing for the Splitsy platform.

---

## 🔧 Current Status

The payment integration layer is **ready** but currently running in **MOCK MODE**.

- ✅ Payment service architecture implemented
- ✅ Mock provider for development (no credentials needed)
- ✅ Stripe integration ready (requires configuration)
- ⏳ Lithic integration (coming soon)

---

## 🎭 Mock Mode (Current Default)

The platform is currently configured to use a mock payment provider that simulates payment processing without requiring real credentials.

### Features:
- ✅ Simulates payment intents
- ✅ Simulates virtual card creation
- ✅ Simulates Apple Pay provisioning
- ✅ Configurable success/failure rates
- ✅ Simulated delays for realistic testing

### Configuration:

Mock mode is automatically enabled when:
- `PAYMENT_PROVIDER_ENABLED` is not set to `"true"`, OR
- `PAYMENT_PROVIDER` is set to `"mock"`

### Mock Settings (lib/payments/config.ts):

```typescript
mock: {
  simulateDelay: true,        // Add realistic delays
  delayMs: 1000,              // Delay duration
  failureRate: 0,             // 0-100% chance of failure
  autoSucceedContributions: true, // Auto-complete contributions
}
```

---

## 💳 Stripe Integration

### Prerequisites:

1. **Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Verify your account

2. **Stripe Issuing Access**
   - Request access to Stripe Issuing
   - Required for virtual card creation
   - May require business verification

### Setup Steps:

#### 1. Get API Keys

From your Stripe Dashboard:
- **Secret Key**: `Settings > API keys > Secret key`
- **Publishable Key**: `Settings > API keys > Publishable key`
- **Webhook Secret**: `Developers > Webhooks > Add endpoint`

#### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# Enable payment processing
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 3. Set Up Webhooks

1. Go to `Stripe Dashboard > Developers > Webhooks`
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/payments`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `issuing_authorization.request`
   - `issuing_authorization.created`
   - `issuing_transaction.created`
   - `issuing_card.updated`
   - `charge.refunded`

5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### 4. Test Integration

```bash
# Start the server
npm run dev

# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/payments
stripe trigger payment_intent.succeeded
```

---

## 🔐 Security Configuration

### Webhook Signature Verification

Webhooks are automatically verified when `STRIPE_WEBHOOK_SECRET` is configured.

Without the secret, webhooks will still work but **ARE NOT SECURE** for production.

### Required for Production:
- ✅ HTTPS enabled (Vercel provides this automatically)
- ✅ Webhook secret configured
- ✅ API keys are secure and not committed to git
- ✅ Environment variables properly set

---

## 🧪 Testing

### Development (Mock Mode):

```bash
# No configuration needed
npm run dev

# Create a contribution - automatically succeeds
curl -X POST http://localhost:3000/api/pools/POOL_ID/contributions \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "method": "card"}'
```

### With Stripe (Test Mode):

```bash
# Configure Stripe test keys
export PAYMENT_PROVIDER_ENABLED=true
export PAYMENT_PROVIDER=stripe
export STRIPE_SECRET_KEY=sk_test_...
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

npm run dev

# Use Stripe test cards
# 4242424242424242 - Success
# 4000000000000002 - Decline
```

---

## 🚀 Production Deployment

### 1. Vercel Environment Variables

In your Vercel project settings:

```
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Webhook Configuration

- Update webhook URL to production domain
- Use live mode webhook secret
- Ensure HTTPS is enabled (automatic on Vercel)

### 3. Verification

Test the integration:
- ✅ Contributions process correctly
- ✅ Virtual cards are created
- ✅ Webhooks are received and verified
- ✅ Transactions are recorded

---

## 📊 Payment Flow

### Contribution Flow:

1. **User creates contribution**
   → `POST /api/pools/:id/contributions`

2. **Payment intent created**
   → Payment service creates intent with provider

3. **User completes payment**
   → Frontend uses client secret (Stripe Elements)

4. **Webhook received**
   → `POST /api/webhooks/payments`
   → Updates contribution status

### Virtual Card Flow:

1. **User creates card**
   → `POST /api/cards`

2. **Card created with provider**
   → Payment service creates virtual card
   → Spending limits configured

3. **Card provisioned to Apple Pay** (optional)
   → `POST /api/cards/:id/provision/apple`
   → Apple Pay activation data returned

4. **Card transactions**
   → Real-time authorization via webhooks
   → Balance checking
   → Transaction recording

---

## 🔧 Troubleshooting

### "Payment provider not configured" error

**Solution**: Ensure environment variables are set:
```bash
PAYMENT_PROVIDER_ENABLED=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_...
```

### Webhooks not working

**Check**:
1. Webhook URL is correct
2. Webhook secret is configured
3. Events are selected in Stripe Dashboard
4. Server is accessible (HTTPS)

**Test locally**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/payments
```

### Cards not being created

**Requirements**:
1. Stripe Issuing must be enabled
2. Business verification may be required
3. Pool must have successful contributions

---

## 💡 Provider Response Format

All API responses include provider information:

```json
{
  "contribution": { ... },
  "payment": {
    "intentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "status": "succeeded"
  },
  "provider": {
    "provider": "stripe", // or "mock"
    "mockMode": false
  }
}
```

This helps with debugging and understanding which provider is being used.

---

## 📖 API Documentation

### PaymentService

Located in `lib/payments/index.ts`:

```typescript
// Create payment intent
await PaymentService.createPaymentIntent({
  amount: 1000, // cents
  currency: "usd",
  contributionId: "uuid",
  userId: "uuid",
  poolId: "uuid",
});

// Create virtual card
await PaymentService.createVirtualCard({
  poolId: "uuid",
  userId: "uuid",
  spendingLimit: 10000, // cents
  currency: "usd",
});

// Provision to Apple Pay
await PaymentService.provisionToApplePay({
  cardId: "card_...",
  certificates: ["..."],
  nonce: "...",
  nonceSignature: "...",
});
```

---

## 🎯 Next Steps

### To Enable Real Payments:

1. ✅ Create Stripe account
2. ✅ Get API keys
3. ✅ Set environment variables
4. ✅ Configure webhooks
5. ✅ Test with Stripe test cards
6. ✅ Deploy to production
7. ✅ Switch to live API keys

### To Add Lithic Support:

1. Create Lithic account
2. Implement `lithic-provider.ts` (similar to Stripe)
3. Add Lithic configuration
4. Update `PaymentService` to support Lithic
5. Test integration

---

## 🔒 Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all secrets
3. **Verify webhook signatures** in production
4. **Use HTTPS** for all endpoints
5. **Rotate keys** regularly
6. **Monitor** for suspicious activity
7. **Log** all payment operations
8. **Test** thoroughly before production

---

## 📞 Support

### Stripe Support:
- Dashboard: [dashboard.stripe.com](https://dashboard.stripe.com)
- Docs: [stripe.com/docs](https://stripe.com/docs)
- Support: support@stripe.com

### Splitsy Support:
- Check audit logs for payment activity
- Review webhook logs in Stripe Dashboard
- Check application logs for errors

---

**Last Updated:** October 10, 2025

**Status:** ✅ Ready for configuration


