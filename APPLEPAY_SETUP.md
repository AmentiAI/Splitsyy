# Apple Pay Integration Setup Guide

This guide explains how to configure Apple Pay for the Splitsy platform.

---

## 🔧 Current Status

The Apple Pay integration layer is **ready** but currently running in **MOCK MODE**.

- ✅ Apple Pay service architecture implemented
- ✅ Mock provider for development (no credentials needed)
- ✅ Merchant validation endpoint ready
- ✅ Payment processing ready
- ✅ Card provisioning ready
- ⏳ Real Apple Pay integration (requires Apple Developer setup)

---

## 🎭 Mock Mode (Current Default)

The platform is configured to use a mock Apple Pay provider that simulates Apple Pay functionality without requiring Apple Developer credentials.

### Features:
- ✅ Simulates merchant validation
- ✅ Simulates payment authorization
- ✅ Simulates card provisioning to Apple Wallet
- ✅ Configurable delays for realistic testing
- ✅ Auto-approve payments

### Example Mock Response:

```json
{
  "merchantSession": {
    "merchantIdentifier": "merchant.com.splitsy.mock",
    "domainName": "localhost:3000",
    "displayName": "Splitsy (Mock)"
  },
  "provider": {
    "enabled": false,
    "mockMode": true
  }
}
```

---

## 🍎 Apple Pay Setup (Production)

### Prerequisites:

1. **Apple Developer Account**
   - Enroll at [developer.apple.com](https://developer.apple.com)
   - $99/year membership required

2. **Verified Website Domain**
   - Must have HTTPS enabled
   - Domain must be publicly accessible
   - Vercel provides HTTPS automatically

3. **Payment Provider with Apple Pay Support**
   - Stripe Issuing (recommended)
   - OR Lithic with Apple Pay
   - Provider must support card provisioning

---

## 📝 Step-by-Step Setup

### Step 1: Create Apple Merchant ID

1. Go to [Apple Developer Portal > Certificates, IDs & Profiles](https://developer.apple.com/account/resources/identifiers/list/merchant)
2. Click "+" to create a new Merchant ID
3. Select "Merchant IDs"
4. Fill in details:
   - **Description**: `Splitsy Merchant ID`
   - **Identifier**: `merchant.com.splitsy` (or your domain)
5. Click "Continue" then "Register"

### Step 2: Create Merchant Identity Certificate

1. In Merchant ID settings, click "Create Certificate"
2. Follow CSR (Certificate Signing Request) instructions:
   ```bash
   # On Mac/Linux:
   openssl req -newkey rsa:2048 -keyout merchant.key -out merchant.csr
   
   # Enter details when prompted
   ```
3. Upload the CSR file
4. Download the certificate (.cer file)
5. Convert to PEM format:
   ```bash
   openssl x509 -inform der -in merchant.cer -out merchant.pem
   ```

### Step 3: Verify Your Domain

1. Download the domain verification file (already included in the project):
   - Located at `public/.well-known/apple-developer-merchantid-domain-association`
   
2. Deploy your website (must be HTTPS)
3. Verify the file is accessible at:
   ```
   https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
   ```

4. In Apple Developer Portal:
   - Go to your Merchant ID
   - Click "Add Domain"
   - Enter your domain (e.g., `splitsy.vercel.app`)
   - Click "Verify"

### Step 4: Configure Environment Variables

Add to your `.env.local` or Vercel environment variables:

```env
# Enable Apple Pay
APPLE_PAY_ENABLED=true

# Apple Merchant ID (from Step 1)
APPLE_PAY_MERCHANT_ID=merchant.com.splitsy

# Display name shown in Apple Pay sheet
APPLE_PAY_MERCHANT_NAME=Splitsy

# Your production domain
NEXT_PUBLIC_APP_URL=https://splitsy.vercel.app

# Apple Developer Team ID (found in membership details)
APPLE_PAY_TEAM_ID=YOUR_TEAM_ID

# Certificate paths (if using filesystem)
APPLE_PAY_MERCHANT_CERT=/path/to/merchant.pem
APPLE_PAY_MERCHANT_KEY=/path/to/merchant.key
```

### Step 5: Enable in Payment Provider

#### For Stripe:

1. Go to Stripe Dashboard > Settings > Payment Methods
2. Enable Apple Pay
3. Add your domain
4. Configure Apple Pay settings

#### For Lithic:

1. Contact Lithic support to enable Apple Pay
2. Provide your Merchant ID
3. Configure card provisioning settings

### Step 6: Test Integration

1. Deploy to production (or staging with HTTPS)
2. Open on an Apple device (iPhone, iPad, or Mac with Touch ID)
3. Test payment flow:
   - Select "Apple Pay" as payment method
   - Verify merchant validation works
   - Complete test payment
4. Test card provisioning:
   - Create a virtual card
   - Provision to Apple Wallet
   - Verify card appears in Wallet app

---

## 🔄 Apple Pay Payment Flow

```
User Clicks Apple Pay Button
  ↓
Frontend → Request Merchant Session
  ↓
API → /api/applepay/validate-merchant
  ↓
Apple → Validates Merchant
  ↓
Return → Merchant Session
  ↓
Apple Pay Sheet → Shows
  ↓
User → Authorizes with Face ID/Touch ID
  ↓
Frontend → Receives Payment Token
  ↓
API → /api/applepay/process-payment
  ↓
Payment Provider → Processes Token
  ↓
Database → Update Contribution Status
  ↓
User → See Success Message
```

---

## 💳 Card Provisioning Flow

```
User → Request Add to Apple Wallet
  ↓
Frontend → Call Provision API
  ↓
API → /api/cards/:id/provision/apple
  ↓
Payment Provider → Generate Activation Data
  ↓
Return → Encrypted Pass Data
  ↓
Apple Wallet → Add Card
  ↓
User → Card Ready in Wallet
```

---

## 🧪 Testing

### Mock Mode Testing (No Setup):

```bash
# Works out of the box
npm run dev

# Mock Apple Pay is always available
# All payments auto-succeed
```

### Development Testing (With Apple Pay):

Requirements:
- HTTPS enabled (use ngrok or deploy to Vercel)
- Apple device or Safari on Mac
- Apple Developer account configured

```bash
# Start with HTTPS
ngrok http 3000

# Or deploy to Vercel preview
vercel

# Test on Apple device
# Open Safari and navigate to your HTTPS URL
```

### Production Testing:

1. **Test Cards** (if using Stripe test mode):
   - Apple Pay uses real card in test mode
   - Or use Stripe test payment methods

2. **Test Provisioning**:
   - Create a virtual card in Splitsy
   - Click "Add to Apple Wallet"
   - Verify card appears
   - Make a test transaction

---

## 🎯 API Endpoints

### POST /api/applepay/validate-merchant

Validates merchant for Apple Pay session.

**Request:**
```json
{
  "validationURL": "https://apple-pay-gateway.apple.com/..."
}
```

**Response:**
```json
{
  "merchantSession": {
    "merchantIdentifier": "merchant.com.splitsy",
    "merchantSessionIdentifier": "...",
    "domainName": "splitsy.com",
    "displayName": "Splitsy"
  },
  "provider": {
    "enabled": true,
    "mockMode": false
  }
}
```

### POST /api/applepay/process-payment

Processes Apple Pay payment token.

**Request:**
```json
{
  "paymentToken": { ... },
  "contributionId": "uuid",
  "poolId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_...",
  "contribution": {
    "id": "uuid",
    "status": "succeeded"
  }
}
```

---

## 🔐 Security Considerations

### Domain Verification:
- ✅ Domain must be verified with Apple
- ✅ HTTPS required
- ✅ Verification file must be accessible

### Merchant Validation:
- ✅ Called server-side only
- ✅ Never expose certificates to client
- ✅ Use secure certificate storage

### Payment Processing:
- ✅ Payment tokens are single-use
- ✅ Validate token before processing
- ✅ Check contribution ownership
- ✅ Audit all transactions

---

## 🚨 Troubleshooting

### "Apple Pay is not available"

**Possible causes:**
1. Not using Safari or Apple device
2. No Apple Pay cards in Wallet
3. Apple Pay disabled in system settings

**Solution:**
- Use Safari on Mac (with Touch ID) or iOS device
- Add at least one card to Apple Wallet
- Check System Preferences > Wallet & Apple Pay

### "Domain verification failed"

**Possible causes:**
1. Domain not verified in Apple Developer Portal
2. Verification file not accessible
3. Not using HTTPS

**Solution:**
```bash
# Test file accessibility
curl https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association

# Should return the verification file content
```

### "Merchant validation failed"

**Possible causes:**
1. Incorrect Merchant ID
2. Certificate issues
3. Domain not registered

**Solution:**
- Verify Merchant ID matches Apple Developer Portal
- Check certificate is valid and not expired
- Ensure domain is added to Merchant ID

### Mock mode always active

**Cause:**
- `APPLE_PAY_ENABLED` not set to "true"

**Solution:**
```bash
# Add to .env.local
APPLE_PAY_ENABLED=true
```

---

## 📱 Supported Devices & Browsers

### Devices that Support Apple Pay:
- ✅ iPhone (iPhone 6 and later)
- ✅ iPad (iPad Pro, iPad Air 2, iPad mini 3 and later)
- ✅ Mac (with Touch ID or paired iPhone/Apple Watch)
- ✅ Apple Watch

### Browsers that Support Apple Pay:
- ✅ Safari on iOS 10.1+
- ✅ Safari on macOS Sierra+
- ❌ Chrome, Firefox, Edge (Apple Pay Web not supported)

---

## 🎨 User Experience Guidelines

### Apple Pay Button:
- Use official Apple Pay button styles
- Place prominently in checkout flow
- Show only when Apple Pay is available
- Use appropriate button type (Buy, Donate, etc.)

### Payment Sheet:
- Clear merchant name
- Detailed line items
- Total amount visible
- Shipping/billing info when needed

### Error Handling:
- Clear error messages
- Fallback payment options
- Help text for common issues

---

## 📊 Mock Configuration

In `lib/applepay/config.ts`:

```typescript
mock: {
  // Auto-approve payments in mock mode
  autoApprove: true,
  
  // Simulate processing delay (ms)
  simulateDelay: true,
  delayMs: 1500,
  
  // Mock card details shown
  mockCardDetails: {
    network: "visa",
    last4: "4242",
    displayName: "Visa •••• 4242",
  },
}
```

---

## 🔄 Migration from Mock to Production

### Step 1: Configure Apple Developer Account
- Create Merchant ID
- Verify domain
- Generate certificates

### Step 2: Update Environment Variables
```bash
APPLE_PAY_ENABLED=true
APPLE_PAY_MERCHANT_ID=merchant.com.splitsy
# ... other variables
```

### Step 3: Deploy
- Push to production
- Verify environment variables are set
- Test on Apple device

### Step 4: Monitor
- Check API logs for validation requests
- Monitor payment success rates
- Watch for error patterns

---

## 📈 Analytics & Monitoring

### Track These Metrics:
- ✅ Apple Pay button impressions
- ✅ Payment sheet show rate
- ✅ Payment authorization rate
- ✅ Payment success rate
- ✅ Card provisioning success rate
- ✅ Transaction amounts

### Log These Events:
- Merchant validation requests
- Payment authorizations
- Failed payments
- Card provisioning attempts
- Errors and rejections

---

## 🎓 Additional Resources

### Apple Documentation:
- [Apple Pay Web](https://developer.apple.com/apple-pay/)
- [Apple Pay JS API](https://developer.apple.com/documentation/apple_pay_on_the_web)
- [Merchant Identity Certificate](https://help.apple.com/developer-account/#/devb2e62b839)

### Stripe Documentation:
- [Stripe Apple Pay](https://stripe.com/docs/apple-pay)
- [Apple Pay with Stripe Issuing](https://stripe.com/docs/issuing/cards/digital-wallets)

### Testing:
- [Apple Pay Sandbox Testing](https://developer.apple.com/apple-pay/sandbox-testing/)
- [Stripe Test Cards](https://stripe.com/docs/testing)

---

## 🎉 Benefits of Apple Pay

### For Users:
- ✅ One-tap checkout
- ✅ No need to enter card details
- ✅ Secure with Face ID/Touch ID
- ✅ Privacy-focused (no data shared)
- ✅ Works across devices

### For Platform:
- ✅ Higher conversion rates
- ✅ Reduced cart abandonment
- ✅ Lower fraud rates
- ✅ Better user experience
- ✅ Competitive advantage

---

## 🔮 Future Enhancements

- [ ] Google Pay integration (Android)
- [ ] Recurring payments with Apple Pay
- [ ] Express checkout
- [ ] Apple Pay Later support
- [ ] Multi-currency support
- [ ] Save payment methods

---

**Last Updated:** October 10, 2025

**Status:** ✅ Mock mode ready, awaiting Apple Developer credentials














