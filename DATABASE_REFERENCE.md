# Splitsy Database Quick Reference

Quick reference guide for developers working with the Splitsy database.

---

## 🗂️ Table Overview

| Table | Purpose | Key Relationships |
|-------|---------|------------------|
| `users` | User profiles | Links to auth.users |
| `groups` | Payment groups | Owned by users |
| `group_members` | Group membership | Users ↔ Groups |
| `pools` | Shared funds | Belongs to group |
| `contributions` | Fund additions | User → Pool |
| `virtual_cards` | Payment cards | Linked to pool |
| `transactions` | Payment history | Card → Pool |
| `audit_logs` | Security logs | Tracks all actions |

---

## 📋 Common Queries

### Get User's Groups

```sql
SELECT * FROM user_groups_with_stats
WHERE user_id = auth.uid();
```

### Get Pool Details

```sql
SELECT * FROM pool_details
WHERE id = 'pool-uuid-here';
```

### Get Group Members

```sql
SELECT u.id, u.name, u.email, gm.role, gm.spend_cap
FROM group_members gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = 'group-uuid-here'
ORDER BY gm.role, u.name;
```

### Get Pool Contributions

```sql
SELECT c.*, u.name as contributor_name
FROM contributions c
JOIN users u ON c.user_id = u.id
WHERE c.pool_id = 'pool-uuid-here'
AND c.status = 'succeeded'
ORDER BY c.created_at DESC;
```

### Get Recent Transactions

```sql
SELECT t.*, vc.last_four
FROM transactions t
LEFT JOIN virtual_cards vc ON t.card_id = vc.id
WHERE t.pool_id = 'pool-uuid-here'
ORDER BY t.created_at DESC
LIMIT 20;
```

---

## 🔐 Security Policies

### Key Patterns

**View Data:**
- Users can view their own data
- Users can view data for groups they belong to
- Owners/admins have broader access

**Modify Data:**
- Users can modify their own profiles
- Owners can manage groups
- Admins can manage pools and cards
- Service role handles webhooks

**Automatic:**
- RLS enforced on all tables
- No bypass without service role key
- Policies checked on every query

---

## 💰 Working with Money

**All amounts in cents (BIGINT)**

```typescript
// Store
const amountInCents = 1050; // $10.50

// Display
const formatted = formatCurrency(amountInCents); // "$10.50"

// Calculate
const total = contributions.reduce((sum, c) => sum + c.amount, 0);
```

---

## 🔑 Primary Keys

All primary keys are **UUIDs**:

```sql
-- Auto-generated
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()

-- From auth
id UUID PRIMARY KEY REFERENCES auth.users(id)

-- Composite
PRIMARY KEY (group_id, user_id)
```

---

## 📅 Timestamps

All timestamps are **TIMESTAMPTZ**:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Auto-updated via trigger on UPDATE.

---

## 🎭 Roles & Permissions

### Group Roles

**Owner** (1 per group)
- Full control
- Can delete group
- Can change any setting
- Cannot be removed

**Admin** (0+ per group)
- Can add/remove members
- Can create/manage pools
- Can create/manage cards
- Cannot delete group

**Member** (default)
- Can view group data
- Can contribute to pools
- Can view transactions
- Limited management rights

---

## 📊 Enums & Status Values

### KYC Status
```typescript
'not_started' | 'pending' | 'approved' | 'rejected'
```

### Pool Status
```typescript
'open' | 'closed' | 'completed'
```

### Contribution Status
```typescript
'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
```

### Card Status
```typescript
'active' | 'suspended' | 'closed' | 'cancelled'
```

### Transaction Type
```typescript
'purchase' | 'refund' | 'fee' | 'adjustment'
```

### Transaction Status
```typescript
'pending' | 'approved' | 'declined' | 'reversed'
```

---

## 🔧 Helper Functions

### Update Pool Amount (Automatic)

```sql
-- Triggered automatically on contribution insert/update
-- No manual calls needed
```

### Add Owner as Member (Automatic)

```sql
-- Triggered automatically when group is created
-- Owner automatically added with 'owner' role
```

### Log Audit Event

```sql
SELECT log_audit_event(
  auth.uid(),
  'created_pool',
  'pool',
  pool_id,
  '{"pool_name": "Trip Fund"}'::jsonb
);
```

---

## 🧪 Testing Queries

### Check RLS is Working

```sql
-- Should return empty or only user's data
SELECT * FROM users;

-- Should only show accessible groups
SELECT * FROM groups;
```

### Verify Triggers

```sql
-- Create a group
INSERT INTO groups (owner_id, name, currency)
VALUES (auth.uid(), 'Test Group', 'USD')
RETURNING *;

-- Check member was auto-added
SELECT * FROM group_members WHERE group_id = (SELECT id FROM groups ORDER BY created_at DESC LIMIT 1);
```

### Test Pool Amount Updates

```sql
-- Add a contribution
INSERT INTO contributions (pool_id, user_id, amount, method, status)
VALUES ('pool-id', auth.uid(), 1000, 'card', 'succeeded');

-- Check pool amount increased
SELECT current_amount FROM pools WHERE id = 'pool-id';
```

---

## 🚨 Common Errors

### "new row violates row-level security policy"
**Cause:** Trying to insert/update data you don't have permission for
**Fix:** Check your RLS policies and user authentication

### "relation does not exist"
**Cause:** Migrations haven't been run
**Fix:** Run the migration SQL files

### "foreign key violation"
**Cause:** Referenced record doesn't exist
**Fix:** Ensure parent record exists before creating child

### "check constraint violation"
**Cause:** Data doesn't meet constraint requirements
**Fix:** Check enum values, amount > 0, etc.

---

## 🔄 Cascading Deletes

When you delete:

**User** → Deletes all their data (CASCADE)
**Group** → Deletes pools, members, cards (CASCADE)
**Pool** → Deletes contributions, cards, transactions (CASCADE)
**Card** → Nullifies transaction.card_id (SET NULL)

---

## 📱 Realtime Subscriptions

Subscribe to changes:

```typescript
// Subscribe to pool updates
supabase
  .channel('pool-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pools',
    filter: `id=eq.${poolId}`
  }, (payload) => {
    console.log('Pool updated:', payload);
  })
  .subscribe();
```

---

## 🎯 Best Practices

### ✅ Do

- Use prepared statements
- Filter early with WHERE clauses
- Use indexes for frequent queries
- Include LIMIT for large result sets
- Use views for complex queries
- Log important actions to audit_logs

### ❌ Don't

- Use `SELECT *` in production
- Hardcode UUIDs in queries
- Bypass RLS (except service role when needed)
- Store sensitive data unencrypted
- Forget to handle errors
- Skip validation

---

## 🔍 Debugging Tips

### Check Current User

```sql
SELECT auth.uid();
```

### View Active Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Table Permissions

```sql
SELECT table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
AND table_schema = 'public';
```

### Explain Query

```sql
EXPLAIN ANALYZE
SELECT * FROM pools WHERE group_id = 'some-uuid';
```

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Setup Guide:** See SUPABASE_SETUP.md
- **Migration Files:** See supabase/migrations/

---

**Quick tip:** Use `npm run db:test` to verify your database connection and setup!

