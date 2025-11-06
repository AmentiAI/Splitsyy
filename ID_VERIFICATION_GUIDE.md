# ID Verification Guide

## Current System Status

The platform has KYC status tracking, but **no automated ID verification service is integrated yet**. Currently, admins can manually update user KYC status.

## User Identification Keys

### Primary Identifier: User ID (UUID)

The main identifier for verifying users is the **`id` field** - a UUID that links to Supabase Auth:

```typescript
// User ID format
id: "550e8400-e29b-41d4-a716-446655440000" // UUID
```

**Where to find it:**
- In the database: `users.id` column
- Via API: `GET /api/auth/user` returns `user.id`
- In Supabase Auth: `auth.users.id`

### Alternative Identifier: Email

Email is also unique and can be used to identify users:

```typescript
email: "user@example.com" // Unique per user
```

## Verifying a User (Manual Process)

### Option 1: Via Admin Panel

1. Navigate to `/admin`
2. Go to "Users" tab
3. Find the user by email or search
4. Update their `kyc_status`:
   - `not_started` → User hasn't started verification
   - `pending` → Verification documents submitted, awaiting review
   - `approved` → ID verified and approved
   - `rejected` → Verification failed

### Option 2: Via API (Admin Only)

```bash
# Update user KYC status
PATCH /api/admin/users
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "kyc_status": "approved"
}
```

### Option 3: Direct Database Update

```sql
-- Update KYC status for a user by ID
UPDATE users 
SET kyc_status = 'approved' 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Or by email
UPDATE users 
SET kyc_status = 'approved' 
WHERE email = 'user@example.com';
```

## Required Fields for Verification

When verifying a user's identity, you'll need:

1. **User ID (UUID)** - Primary identifier from `users.id`
2. **Email** - User's email address (for confirmation)
3. **Name** - User's full name (for matching against ID documents)

These are retrieved via:

```typescript
// Get user profile
const response = await fetch('/api/auth/user');
const { user } = await response.json();

// user.id - UUID for verification
// user.email - Email address
// user.name - Full name
```

## Future: Automated ID Verification

To integrate an automated ID verification service (e.g., Stripe Identity, Onfido, Veriff), you would:

1. **Create verification endpoint:**
   ```
   POST /api/verification/submit
   Body: { userId, idDocument, selfie, etc. }
   ```

2. **Store verification data:**
   - Optionally create a `verification_documents` table
   - Store document uploads securely (e.g., Supabase Storage)

3. **Integrate verification service:**
   - Call external API (Stripe Identity, Onfido, etc.)
   - Receive verification result

4. **Update KYC status automatically:**
   ```typescript
   // After verification service confirms
   await supabase
     .from('users')
     .update({ kyc_status: 'approved' })
     .eq('id', userId);
   ```

## Example: Finding User to Verify

```sql
-- Find user by email
SELECT id, email, name, kyc_status 
FROM users 
WHERE email = 'user@example.com';

-- Result:
-- id: 550e8400-e29b-41d4-a716-446655440000
-- email: user@example.com
-- name: John Doe
-- kyc_status: pending
```

Then use the `id` UUID to update their verification status.

## Quick Reference

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Primary identifier | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | TEXT | Unique identifier | `user@example.com` |
| `kyc_status` | TEXT | Verification status | `pending`, `approved`, etc. |

**Answer: Use the `id` field (UUID) as the identification key for verification.**

