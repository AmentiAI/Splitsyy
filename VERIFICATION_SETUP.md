# User Verification & SSN Storage Setup

## Overview

The platform now supports collecting and storing user verification data including Social Security Numbers (SSN) with integration to third-party verification services.

## Security Features

### Encryption
- **SSN Encryption**: All SSNs are encrypted at rest using AES-256-CBC
- **ID Number Encryption**: ID document numbers are also encrypted
- **Key Management**: Uses `SSN_ENCRYPTION_KEY` environment variable
- **Production Note**: In production, use a proper key management service (AWS KMS, HashiCorp Vault, etc.)

### Access Control
- **Row-Level Security**: Only platform admins can view verification data
- **Audit Logging**: All access to sensitive data is logged
- **Masked Display**: Sensitive data is masked by default, admins can reveal

## Database Schema

### `user_verification` Table
Stores all user identity verification data:

- **User Info**: Links to users table
- **Third-Party Data**: Provider, verification ID, status
- **Encrypted Fields**: 
  - `ssn_encrypted` - Encrypted Social Security Number
  - `id_number_encrypted` - Encrypted ID document number
- **Personal Info**: Date of birth, address
- **ID Document**: Type, number, dates, issuing authority
- **Provider Response**: Full JSON response from third-party
- **Admin Notes**: Admin comments and notes

## Third-Party Integration

### Supported Providers
- Stripe Identity
- Socure
- Persona
- Jumio
- Onfido
- Custom (for manual verification)

### Integration Steps

1. **User Submits Verification** (`POST /api/verification/submit`)
   - User provides SSN, DOB, address, ID document
   - Data is encrypted
   - Third-party API is called (or mocked for development)
   - Verification record is created

2. **Provider Processing**
   - Provider verifies identity
   - Webhook callback updates status (if supported)
   - Admin can manually update status

3. **Admin Review** (`GET /api/admin/verification`)
   - Admins can view all verification data
   - SSN is masked by default, can be revealed
   - Admins can approve/reject verifications
   - Admin notes can be added

## API Endpoints

### User Endpoints

#### `POST /api/verification/submit`
Submit verification data for processing.

```json
{
  "ssn": "123-45-6789",
  "dateOfBirth": "1990-01-01",
  "addressLine1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "idType": "drivers_license",
  "idNumber": "DL12345678",
  "provider": "stripe_identity"
}
```

#### `GET /api/verification/submit`
Get current user's verification status.

### Admin Endpoints

#### `GET /api/admin/verification`
Get all verifications (with decrypted SSN for admins).

Query params:
- `userId` - Filter by user
- `status` - Filter by status (pending, approved, rejected, etc.)
- `limit`, `offset` - Pagination

#### `PATCH /api/admin/verification`
Update verification status or add admin notes.

```json
{
  "verificationId": "uuid",
  "provider_status": "approved",
  "admin_notes": "Documents verified manually"
}
```

## Admin Panel

### Verification Tab
- View all user verifications
- Search by email, name, verification ID
- Filter by status
- View encrypted SSN (revealable)
- View ID documents
- Approve/reject verifications
- Add admin notes

### Security Features
- SSN masked by default (***-**-1234)
- "Show" button to reveal (logged in audit)
- Warning banner about sensitive data
- All actions are audit logged

## Environment Variables

```env
# Required for encryption (use strong random key in production)
SSN_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Third-party provider API keys (examples)
STRIPE_IDENTITY_SECRET_KEY=sk_live_...
SOCURE_API_KEY=...
PERSONA_API_KEY=...
```

## Migration

Run the migration to create the verification table:

```bash
# In Supabase Dashboard → SQL Editor
# Or via CLI:
supabase db push
```

Migration file: `supabase/migrations/20250124000002_add_user_verification.sql`

## Third-Party Provider Setup

### Stripe Identity (Example)
```typescript
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const verificationSession = await stripe.identity.verificationSessions.create({
  type: "document",
  metadata: {
    user_id: userId,
  },
});

// Store verificationSession.id as provider_verification_id
```

### Webhook Handler
Set up webhook to receive verification status updates:

```typescript
// app/api/webhooks/verification/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  if (event.type === "identity.verification_session.verified") {
    // Update verification status
    await updateVerificationStatus(
      event.data.object.id,
      "approved"
    );
  }
}
```

## Production Checklist

- [ ] Set strong `SSN_ENCRYPTION_KEY` (32+ characters, random)
- [ ] Use key management service (AWS KMS, HashiCorp Vault)
- [ ] Enable audit logging for all SSN access
- [ ] Set up third-party provider webhooks
- [ ] Configure RLS policies correctly
- [ ] Test encryption/decryption flows
- [ ] Set up backup and recovery for encrypted data
- [ ] Compliance review (PCI-DSS, GDPR, etc.)
- [ ] Regular security audits
- [ ] Access logging and monitoring

## Compliance Notes

⚠️ **Important**: Storing SSNs requires compliance with:
- PCI-DSS (if handling payments)
- GDPR (if serving EU users)
- CCPA (if serving California users)
- Local data protection laws

Ensure you have:
- Proper encryption at rest and in transit
- Access controls and audit trails
- Data retention policies
- User consent and privacy notices
- Right to deletion (data erasure)

## Testing

For development/testing, the system uses mock third-party responses. Replace with actual API calls in production.

## Support

For questions or issues:
1. Check audit logs for access patterns
2. Verify encryption key is set correctly
3. Test third-party provider integration
4. Review RLS policies


