# Admin Access Quick Start

## Making Yourself an Admin

To access the admin panel at `/admin`, you need to be promoted to platform administrator.

### Option 1: Using the Script (Easiest)

1. **First, find your email:**
   ```bash
   npx tsx scripts/list-users.ts
   ```
   This will show all registered users and their admin status.

2. **Promote yourself to admin:**
   ```bash
   npx tsx scripts/make-admin.ts your-email@example.com
   ```
   Replace `your-email@example.com` with the email you used to register.

3. **Refresh the page:**
   - Log out and log back in, OR
   - Just refresh the `/admin` page
   - The admin panel should now be accessible!

### Option 2: Direct Database Update (Advanced)

If you prefer SQL:

```sql
-- Find your user ID first
SELECT id, email, is_platform_admin FROM users WHERE email = 'your-email@example.com';

-- Then make them admin
UPDATE users 
SET is_platform_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### Verification

After promoting yourself, you can verify:

1. Check your admin status:
   ```bash
   npx tsx scripts/list-users.ts
   ```
   You should see `Admin: ✅ YES` next to your email.

2. Visit `/admin` in your browser - you should now see the full admin dashboard!

### Troubleshooting

**"User not found"**
- Make sure you've registered an account at `/auth/register`
- Use the exact email address you registered with
- Check with `npx tsx scripts/list-users.ts` to see available users

**Still seeing "Access Denied"**
- Log out completely and log back in
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache if needed
- Wait a few seconds for the session to update

### First Admin Setup

If this is your first time setting up admin access:

1. Register an account at `/auth/register`
2. Wait for registration to complete
3. Run `npx tsx scripts/make-admin.ts your-email@example.com`
4. Refresh `/admin` page

You're now ready to use the admin panel! 🎉

