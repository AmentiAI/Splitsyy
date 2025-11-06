# User Payment Methods Feature

## Overview

Users can now store and manage their personal payment cards ("base cards") that can be used for group contributions. Additionally, groups have virtual cards for splits/pools, and users can choose to use their saved payment methods when contributing to pools.

## Architecture

### 1. Database Schema

**Table: `user_payment_methods`**
- Stores user's personal payment cards and bank accounts
- Fields:
  - `id` - UUID primary key
  - `user_id` - References users table
  - `type` - "card" or "bank_account"
  - `provider` - Payment provider (stripe, lithic, manual)
  - `provider_payment_method_id` - External payment provider ID
  - `card_brand` - Visa, Mastercard, Amex, etc.
  - `last_four` - Last 4 digits of card
  - `expiry_month`, `expiry_year` - Card expiration
  - `billing_name` - Name on card
  - `is_default` - Default payment method flag
  - `is_active` - Active/inactive flag
  - `metadata` - Additional data (JSONB)

**Features:**
- Automatic enforcement of single default payment method per user
- Row-Level Security (RLS) - users can only access their own payment methods
- Soft delete (mark as inactive instead of hard delete)

### 2. API Endpoints

#### GET `/api/payment-methods`
- Get all active payment methods for authenticated user
- Returns cards ordered by default status and creation date

#### POST `/api/payment-methods`
- Add a new payment method
- Validates input with Zod schema
- Automatically sets as default if `isDefault: true` (unset others)

#### PUT `/api/payment-methods/:id`
- Update payment method (set default, update billing info, etc.)
- Verifies ownership before allowing updates

#### DELETE `/api/payment-methods/:id`
- Soft delete (marks as inactive)
- Verifies ownership

### 3. Contribution Flow

When contributing to a pool:
1. User selects payment type (card or ACH)
2. If card is selected:
   - System fetches user's saved payment methods
   - User can select from saved cards
   - Or add a new card (redirects to payment methods page)
   - If user has saved cards, default card is pre-selected
3. Contribution API:
   - If `paymentMethodId` provided, uses that saved payment method
   - If not provided, tries to use user's default payment method
   - Falls back to creating new payment intent without saved method

### 4. UI Components

#### Payment Methods Page (`/settings/payment-methods`)
- View all saved payment methods
- Set default payment method
- Remove payment methods
- Add new payment methods (button ready for future Stripe integration)

#### Contribute Modal
- Shows saved cards when payment type is "card"
- Radio button selection for saved cards
- "Add New Card" button linking to payment methods page
- Displays card brand, last 4 digits, expiration
- Shows default badge on default card

## Usage

### For Users

1. **Add a Payment Method:**
   - Navigate to Settings → Payment Methods
   - Click "Add Payment Method"
   - Enter card details (Stripe integration coming soon)

2. **Set Default Payment Method:**
   - On payment methods page, click "Set Default" on any card
   - Default card will be automatically selected when contributing

3. **Contribute to Pool:**
   - Click "Contribute" on any pool
   - Select payment type (Card or ACH)
   - If Card selected:
     - Choose from saved cards
     - Or add new card
   - Enter amount and submit

### For Developers

#### Adding a Payment Method via API

```typescript
POST /api/payment-methods
{
  "type": "card",
  "provider": "stripe",
  "providerPaymentMethodId": "pm_1234567890",
  "cardBrand": "visa",
  "lastFour": "4242",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "billingName": "John Doe",
  "isDefault": true
}
```

#### Using Payment Method in Contribution

```typescript
POST /api/pools/:poolId/contributions
{
  "amount": 5000, // $50.00 in cents
  "method": "card",
  "paymentMethodId": "pm_1234567890" // Optional - uses default if not provided
}
```

## Future Enhancements

1. **Stripe Payment Element Integration:**
   - Inline card entry form
   - Secure tokenization
   - Real-time validation

2. **Bank Account Support:**
   - ACH account linking
   - Bank verification

3. **Payment Method Selection on Other Pages:**
   - Send Money
   - Request Money
   - Add Money to Wallet

4. **Payment Method Verification:**
   - Card verification (CVC check)
   - Bank account micro-deposits

## Migration

To apply the database migration:

```bash
# Run in Supabase Dashboard SQL Editor or via CLI
supabase db push
```

Or apply directly:
```sql
-- See: supabase/migrations/20250124000001_add_user_payment_methods.sql
```

## Security

- ✅ Row-Level Security (RLS) enabled
- ✅ Users can only access their own payment methods
- ✅ Payment method IDs validated before use
- ✅ Audit logging for all payment method operations
- ✅ Soft delete prevents accidental data loss

## Notes

- Virtual cards (group cards) remain separate from user payment methods
- Group virtual cards are for spending from pools
- User payment methods are for contributing to pools
- Users can use their saved cards OR new cards when contributing
- Default payment method is automatically used if none selected

