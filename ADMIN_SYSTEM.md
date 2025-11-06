# Admin System Documentation

## Overview

The Splitsy platform now includes a comprehensive admin system with kill switch functionality, user management, analytics, and audit logging. This system provides platform-level administrators with full control over the platform operations.

## Features

### ✅ Platform Kill Switch
- **Toggle Platform Operations**: Instantly enable/disable all non-admin platform operations
- **Reason Tracking**: Required reason when disabling the platform
- **Audit Trail**: All kill switch actions are logged
- **Admin Bypass**: Platform admins can always access the platform even when disabled

### ✅ User Management
- **View All Users**: Paginated list of all platform users
- **Search & Filter**: Search by email/name, filter by admin status
- **Promote/Demote Admins**: Elevate users to platform admin or remove admin access
- **Delete Users**: Remove users from the platform (with safeguards)
- **User Statistics**: View user KYC status, creation dates, and activity

### ✅ Analytics Dashboard
- **Real-time Metrics**: Live platform statistics and KPIs
- **Financial Overview**: Total pool values, transaction volumes, contribution statistics
- **Activity Tracking**: Recent user activity, groups, and transactions
- **Platform Health**: Monitor platform status and key metrics

### ✅ Audit Logs
- **Complete Activity Log**: View all admin actions and user activities
- **Search & Filter**: Filter by action type, user, date range
- **Admin Actions**: Track all platform admin operations
- **Security Logs**: Monitor login, registration, and security events

### ✅ System Settings
- **Feature Flags**: Enable/disable platform features
- **Platform Configuration**: Manage registration, payments, card creation settings
- **Maintenance Mode**: Set maintenance mode with custom messages

## Database Schema

### New Tables

1. **system_settings**
   - Stores platform-wide settings including kill switch
   - Key-value pairs with JSONB values
   - Tracks who updated each setting

2. **admin_actions**
   - Audit trail for all admin operations
   - Includes IP address and user agent tracking
   - Links to admin user and target resources

### Schema Changes

- **users** table: Added `is_platform_admin` boolean field

## API Endpoints

### Admin Authentication
- All admin endpoints require platform admin privileges
- Check via `isPlatformAdmin()` utility

### Kill Switch
- `GET /api/admin/kill-switch` - Get current kill switch status
- `POST /api/admin/kill-switch` - Toggle kill switch

### User Management
- `GET /api/admin/users` - List users (paginated, searchable)
- `PATCH /api/admin/users` - Update user (promote/demote, update profile)
- `DELETE /api/admin/users` - Delete user

### Analytics
- `GET /api/admin/analytics` - Get platform-wide analytics

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs (paginated, filterable)

### System Settings
- `GET /api/admin/settings` - Get all system settings
- `PUT /api/admin/settings` - Update a system setting

## Usage

### Making a User an Admin

1. **Via Database** (Initial setup):
```sql
UPDATE users SET is_platform_admin = TRUE WHERE email = 'admin@example.com';
```

2. **Via Admin Panel**:
- Navigate to Admin → Users
- Find the user
- Click the shield icon to promote to admin

3. **Via API**:
```bash
PATCH /api/admin/users
{
  "userId": "user-uuid",
  "is_platform_admin": true
}
```

### Using the Kill Switch

1. **Access Admin Panel**: Navigate to `/admin`
2. **Go to Kill Switch Tab**: Click "Kill Switch" in the admin menu
3. **Provide Reason**: Enter a reason for disabling (required)
4. **Toggle**: Click "Disable Platform" or "Enable Platform"

### Checking Kill Switch in Code

```typescript
import { checkPlatformEnabled } from "@/lib/middleware/killSwitch";

// In API route
const isEnabled = await checkPlatformEnabled();
if (!isEnabled) {
  return NextResponse.json({ error: "Platform disabled" }, { status: 503 });
}
```

## Security Features

### Row-Level Security (RLS)
- All admin tables have RLS policies
- Only platform admins can view/modify system settings
- Only platform admins can view admin actions
- Admins can always bypass kill switch

### Audit Logging
- All admin actions are logged with:
  - Admin user ID
  - Action type
  - Target resource
  - IP address
  - User agent
  - Timestamp
  - Action details

### Safeguards
- Admins cannot remove their own admin access
- Admins cannot delete their own account
- Kill switch requires a reason when disabling
- All destructive actions require confirmation

## UI Components

### Admin Dashboard (`/admin`)
- **Overview Tab**: Analytics and platform metrics
- **Kill Switch Tab**: Platform control
- **Users Tab**: User management interface
- **Audit Logs Tab**: Activity log viewer

### Navigation
- Admin link appears in sidebar only for platform admins
- Automatically hidden for non-admin users

## Environment Variables

No additional environment variables required. The admin system uses existing Supabase configuration.

## Migration

Run the database migration to set up admin tables:

```bash
# Via Supabase CLI
supabase migration up

# Or manually run the SQL file
supabase/migrations/20250123000001_add_admin_system.sql
```

## Default Settings

The migration creates default system settings:
- `platform_enabled`: `{ enabled: true }`
- `registration_enabled`: `{ enabled: true }`
- `payments_enabled`: `{ enabled: true }`
- `card_creation_enabled`: `{ enabled: true }`
- `maintenance_mode`: `{ enabled: false, message: "" }`
- `feature_flags`: All features enabled by default

## Best Practices

1. **Limit Admin Users**: Only grant admin access to trusted personnel
2. **Monitor Audit Logs**: Regularly review admin actions for security
3. **Document Kill Switch Usage**: Always provide clear reasons when disabling platform
4. **Backup Before Major Changes**: Ensure database backups before bulk operations
5. **Test in Staging**: Test all admin features in staging before production

## Troubleshooting

### User Can't Access Admin Panel
- Verify `is_platform_admin = true` in database
- Check browser console for errors
- Verify user is logged in

### Kill Switch Not Working
- Check system_settings table for `platform_enabled` key
- Verify RLS policies are enabled
- Check admin user has correct permissions

### Analytics Not Loading
- Verify user has admin access
- Check database connectivity
- Review browser network tab for API errors

## Future Enhancements

Potential additions to the admin system:
- [ ] Real-time notifications
- [ ] Advanced analytics with charts
- [ ] Bulk user operations
- [ ] Email templates management
- [ ] API rate limiting controls
- [ ] Feature flag UI
- [ ] System health monitoring
- [ ] Automated alerts

---

**Created**: January 23, 2025  
**Status**: ✅ Production Ready

