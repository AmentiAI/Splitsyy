# Splits to Groups Feature

## Overview

When a split is completed (all participants have paid), the system automatically creates a group with all participants. This allows the people who shared an expense to continue transacting together in the future.

## How It Works

### 1. **Split Creation**
- User creates a split and invites participants via SMS
- Each participant receives a unique payment link
- Status: `pending`

### 2. **Payment Process**
- Participants click their link and pay their share
- As payments come in, split status changes to `active`
- Participant records are updated with `paid` status

### 3. **Automatic Group Creation**
- When the last participant pays, the split status becomes `completed`
- A database trigger (`auto_create_group_for_split_trigger`) fires automatically
- A new group is created with:
  - **Name**: `{Split Description} Group`
  - **Owner**: The user who created the split
  - **Currency**: USD (default)
- The `group_id` is stored in the split record

### 4. **Group Membership**
- The split creator is automatically added as the group owner
- Any participants who have registered accounts are automatically added as members
- Participants without accounts can join later when they sign up

### 5. **UI Indicators**
- Completed splits show a "Group Created" badge
- A green panel appears with:
  - "Group Created!" message
  - "View Group" button linking to the group page
  - Description: "All participants can now transact together"

## Database Schema

### New Fields

#### `splits` table:
```sql
group_id UUID REFERENCES groups(id) ON DELETE SET NULL
```
- Tracks which group was created from this split
- NULL if no group created yet (pending/active splits)
- Set automatically by trigger when split completes

#### `split_participants` table:
```sql
user_id UUID REFERENCES users(id) ON DELETE SET NULL
```
- Links participant to their user account
- NULL if participant hasn't registered yet
- Used to add registered users to the auto-created group

### Trigger Function

The `auto_create_group_for_split()` function:
1. Checks if split just became `completed`
2. Verifies no group exists yet (`group_id IS NULL`)
3. Creates a new group with the split creator as owner
4. Updates the split with the new `group_id`
5. Adds any registered participants as group members
6. Logs an audit event

## API Changes

### GET /api/splits
Now returns `group_id` field for each split:
```typescript
{
  id: string;
  description: string;
  total_amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  group_id: string | null;  // NEW
  created_at: string;
  split_participants: [...];
}
```

### Payment Flow
When processing payments via `/api/payments/process`:
1. Payment is recorded
2. Participant status updated to `paid`
3. Split status is automatically updated by `update_split_status()` trigger
4. If all participants paid → status becomes `completed`
5. Group creation trigger fires automatically

## User Experience

### For Split Creators
1. Create a split with participants
2. Wait for participants to pay
3. Once all paid:
   - Notification that group was created
   - Can view and manage the new group
   - Can use the group for future transactions

### For Participants
1. Receive SMS with payment link
2. Complete payment via the link
3. Optionally register an account
4. If registered, automatically added to the split's group
5. Can participate in future group transactions

## Future Enhancements

### Planned Features:
- [ ] Email notification when group is created
- [ ] SMS notification to participants about new group
- [ ] Option to customize group name before creation
- [ ] Bulk invite participants to register after split completes
- [ ] Match participants by phone number when they register later
- [ ] Show "Join Group" prompt to participants with matching phone

### Advanced Features:
- [ ] Allow opting out of auto-group creation
- [ ] Merge multiple split groups into one
- [ ] Auto-suggest groups for repeat participants
- [ ] Group analytics from split history

## Migration

To enable this feature in an existing database:

```bash
# Apply the migration
supabase db push

# Or manually run:
psql -f supabase/migrations/20250122000001_add_group_to_splits.sql
```

## Testing

### Manual Test Procedure:
1. Create a new split with 2-3 participants
2. Simulate payments for each participant
3. Verify split status changes to `completed`
4. Check that `group_id` is populated
5. Navigate to Groups page and verify new group exists
6. Verify group has correct name and members
7. Check audit logs for group creation event

### Automated Tests:
```typescript
// Test auto-group creation
describe('Split to Group', () => {
  it('creates group when all participants pay', async () => {
    const split = await createSplit({ ... });
    await payAllParticipants(split.id);
    
    const updated = await getSplit(split.id);
    expect(updated.status).toBe('completed');
    expect(updated.group_id).toBeTruthy();
    
    const group = await getGroup(updated.group_id);
    expect(group.name).toContain(split.description);
  });
});
```

## Troubleshooting

### Group Not Created
**Symptom**: Split is completed but no group_id

**Checks**:
1. Verify trigger is installed: `\df auto_create_group_for_split`
2. Check audit_logs for errors
3. Verify user has permission to create groups
4. Check that all participants are marked as `paid`

### Participants Not Added
**Symptom**: Group created but missing members

**Checks**:
1. Verify participants have `user_id` set
2. Check group_members table for records
3. Verify RLS policies allow member insertion
4. Participants may need to register/link their phone

### Duplicate Groups
**Symptom**: Multiple groups created for one split

**Prevention**:
- Trigger checks `group_id IS NULL` before creating
- Should only create once per split

**Fix**:
```sql
-- Find duplicate groups
SELECT s.id, s.group_id, g.name 
FROM splits s 
JOIN groups g ON s.group_id = g.id 
WHERE s.description = 'Your Split Name';

-- Manually clean up if needed
UPDATE splits SET group_id = 'correct-group-id' WHERE id = 'split-id';
```

## Security Considerations

- Only the split creator becomes the group owner
- RLS policies ensure proper access control
- Participants can only join groups they paid into
- Audit logs track all group creations
- Phone number matching prevents unauthorized access

## Performance

- Group creation is asynchronous via trigger
- No impact on payment processing time
- Indexes on `group_id` and `user_id` ensure fast lookups
- Suitable for high-volume split processing

---

**Version**: 1.0.0  
**Last Updated**: January 22, 2025  
**Status**: Active  


