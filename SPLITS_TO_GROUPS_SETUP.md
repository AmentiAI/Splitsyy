# Quick Setup Guide: Splits to Groups Feature

## What Changed

Splits now automatically create groups when all participants have paid! This allows split participants to continue transacting together.

## Files Modified

### Database
- ✅ `supabase/migrations/20250122000001_add_group_to_splits.sql` - Adds group_id column and auto-creation trigger
- ✅ `supabase/migrations/20250122000002_add_splits_rls_policies.sql` - RLS policies for new fields

### Types
- ✅ `types/database.ts` - Added splits, split_participants, and split_payments types with new fields

### API
- ✅ `app/api/splits/route.ts` - Returns group_id in split data

### UI
- ✅ `app/splits/page.tsx` - Shows "Group Created" badge and link to group
- ✅ `app/pay/[splitId]/[phoneHash]/page.tsx` - Encourages participants to create accounts

### Documentation
- ✅ `SPLITS_TO_GROUPS_FEATURE.md` - Comprehensive feature documentation

## Setup Instructions

### 1. Apply Database Migrations

```bash
# If using Supabase CLI
supabase db push

# Or apply migrations manually
supabase migration up
```

### 2. Verify Triggers Are Installed

Connect to your database and verify:

```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_create_group_for_split_trigger';

-- Check function exists
\df auto_create_group_for_split

-- Test manually (optional)
SELECT auto_create_group_for_split();
```

### 3. Test the Feature

1. **Create a Split**
   ```
   - Go to /splits
   - Click "Create Split"
   - Add 2-3 participants with phone numbers
   - Submit
   ```

2. **Simulate Payments**
   ```
   - Open each payment link
   - Complete payment for each participant
   - Watch split status change from pending → active → completed
   ```

3. **Verify Group Creation**
   ```
   - Check splits page for "Group Created" badge
   - Click "View Group" button
   - Verify group has correct name and members
   ```

### 4. Check Database

```sql
-- View splits with groups
SELECT 
  s.id,
  s.description,
  s.status,
  s.group_id,
  g.name as group_name
FROM splits s
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.status = 'completed';

-- View group members from split
SELECT 
  s.description as split_description,
  g.name as group_name,
  u.name as member_name,
  gm.role
FROM splits s
JOIN groups g ON s.group_id = g.id
JOIN group_members gm ON g.id = gm.group_id
JOIN users u ON gm.user_id = u.id
WHERE s.status = 'completed';
```

## How It Works (Quick Version)

1. **User creates split** → Participants get SMS links
2. **Participants pay** → Split status updates automatically
3. **Last payment received** → Split becomes "completed"
4. **Trigger fires** → Group is auto-created
5. **Split updated** → `group_id` field populated
6. **UI updates** → Shows "Group Created" badge and link

## UI Features

### For Split Creators
- **Badge**: Green "Group Created" badge on completed splits
- **Panel**: Prominent green section with "View Group" button
- **Link**: Direct navigation to group page

### For Participants
- **Info Box**: After payment, see message about group creation
- **CTA**: "Create Account" button to join the group
- **Auto-Join**: If phone matches, automatically added to group

## Troubleshooting

### Migration Fails
```bash
# Check current migration status
supabase migration list

# Rollback if needed
supabase migration down

# Reapply
supabase migration up
```

### Trigger Not Firing
```sql
-- Check if trigger is enabled
SELECT tgenabled FROM pg_trigger 
WHERE tgname = 'auto_create_group_for_split_trigger';

-- Re-create trigger if needed
DROP TRIGGER IF EXISTS auto_create_group_for_split_trigger ON public.splits;
-- Then run the migration again
```

### Group Not Showing in UI
- Clear browser cache
- Check API response includes `group_id`
- Verify split status is 'completed'
- Check browser console for errors

### Participants Not Added
- Verify participants have `user_id` set
- Check that `match_participant_to_user()` trigger is installed
- Phone numbers must match exactly

## Testing Checklist

- [ ] Migrations applied successfully
- [ ] Triggers are installed and enabled
- [ ] Can create new split
- [ ] Can simulate payments
- [ ] Split status updates correctly
- [ ] Group is created when completed
- [ ] Group has correct name
- [ ] Split creator is group owner
- [ ] UI shows "Group Created" badge
- [ ] Can navigate to group from split
- [ ] Audit log records group creation

## Next Steps

1. ✅ Apply migrations
2. ✅ Test with a real split
3. 📧 Add email notifications (optional)
4. 📱 Add SMS notifications to participants (optional)
5. 🔄 Set up phone number matching for existing users

## Support

For issues or questions:
1. Check `SPLITS_TO_GROUPS_FEATURE.md` for detailed documentation
2. Review audit logs for error messages
3. Check Supabase logs for trigger execution
4. Verify RLS policies are not blocking operations

---

**Ready to use!** The feature works automatically once migrations are applied. No code changes needed in your application logic - everything is handled by database triggers.


