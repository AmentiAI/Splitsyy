# Plaid Integration Guide for ID Verification

This guide explains how to integrate Plaid for ID verification and bank account linking in Splitsy.

---

## Why Plaid?

Plaid provides:

- ✅ **Identity Verification** - Verify user identity
- ✅ **Bank Account Verification** - Link and verify bank accounts
- ✅ **Income Verification** - Verify income (optional)
- ✅ **Single Integration** - One API for multiple needs

---

## Setup Steps

### 1. Create Plaid Account

1. Sign up at [plaid.com](https://plaid.com)
2. Complete business verification
3. Get API credentials from dashboard

### 2. Install Plaid SDK

```bash
npm install plaid
```

### 3. Create Plaid Client

Create `lib/plaid/client.ts`:

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
```

### 4. Add Environment Variables

```env
# .env.local or Vercel
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox  # or 'development', 'production'
```

### 5. Update Verification Endpoint

Update `app/api/verification/submit/route.ts`:

```typescript
import { plaidClient } from "@/lib/plaid/client";

// Replace mock provider call with:
const identityVerification = await plaidClient.identityVerificationCreate({
  client_user_id: session.user.id,
  is_idempotent: true,
  template_id: "idv_default", // Use your Plaid template ID
  gave_consent: true,
});

// Store verification ID
const providerVerificationId = identityVerification.id;
```

### 6. Create Webhook Handler

Create `app/api/webhooks/plaid/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_type, webhook_code, identity_verification_id } = body;

    if (webhook_type === "IDENTITY_VERIFICATION") {
      const supabase = createAdminClient();

      // Get verification status
      const verification = await plaidClient.identityVerificationGet({
        identity_verification_id,
      });

      // Update verification record
      await supabase
        .from("user_verification")
        .update({
          provider_status:
            verification.status === "success" ? "approved" : "rejected",
          verification_completed_at: new Date().toISOString(),
          provider_response: verification,
        })
        .eq("provider_verification_id", identity_verification_id);

      // Update user KYC status
      if (verification.status === "success") {
        const { data: verificationRecord } = await supabase
          .from("user_verification")
          .select("user_id")
          .eq("provider_verification_id", identity_verification_id)
          .single();

        if (verificationRecord) {
          await supabase
            .from("users")
            .update({ kyc_status: "approved" })
            .eq("id", verificationRecord.user_id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Plaid webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

### 7. Configure Plaid Webhook

In Plaid Dashboard:

1. Go to **Team Settings > Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/plaid`
3. Select events:
   - `IDENTITY_VERIFICATION.status_updated`
   - `IDENTITY_VERIFICATION.user_status_updated`

---

## Verification Flow

```
User Submits Verification
  ↓
POST /api/verification/submit
  ↓
Create Plaid Identity Verification
  ↓
Store Verification ID
  ↓
User Completes Plaid Flow (frontend)
  ↓
Plaid Webhook → /api/webhooks/plaid
  ↓
Update Verification Status
  ↓
Update User KYC Status → "approved"
```

---

## Frontend Integration

### Install Plaid Link

```bash
npm install react-plaid-link
```

### Create Verification Component

```typescript
// components/verification/PlaidVerification.tsx
'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useState } from 'react';

export default function PlaidVerification() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Get link token from your API
  useEffect(() => {
    fetch('/api/plaid/create-link-token')
      .then(res => res.json())
      .then(data => setLinkToken(data.link_token));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      // Exchange public token for access token
      fetch('/api/plaid/exchange-token', {
        method: 'POST',
        body: JSON.stringify({ public_token }),
      });
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Verify Identity with Plaid
    </button>
  );
}
```

---

## Testing

### Sandbox Mode

Plaid provides test credentials:

- Use `sandbox` environment
- Test with mock data
- No real bank accounts needed

### Test Cases

1. ✅ Successful verification
2. ✅ Failed verification
3. ✅ Webhook processing
4. ✅ Status updates

---

## Production Checklist

- [ ] Switch to `production` environment
- [ ] Update webhook URL to production domain
- [ ] Test with real bank accounts
- [ ] Monitor webhook delivery
- [ ] Set up error alerts
- [ ] Review compliance requirements

---

## Additional Resources

- [Plaid Docs](https://plaid.com/docs)
- [Plaid Identity Verification](https://plaid.com/docs/identity-verification/)
- [Plaid Link](https://plaid.com/docs/link/)

---

**Note:** This is a guide for integrating Plaid. The actual implementation should be done by your development team based on your specific requirements.
