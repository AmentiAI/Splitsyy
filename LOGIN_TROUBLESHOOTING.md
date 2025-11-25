# Login Troubleshooting Guide

## "Invalid email or password" Error

This error typically means one of the following:

### 1. **You Haven't Registered Yet** (Most Common)

**Solution:** You need to create an account first!

1. Go to `/auth/register`
2. Fill in your email, password, and name
3. Click "Sign up"
4. In development mode, you'll be automatically logged in
5. Then try logging in again

### 2. **Wrong Password**

**Solution:**

- Double-check your password (case-sensitive)
- Try resetting your password (if password reset is implemented)
- Or create a new account with a different email

### 3. **Email Not Confirmed**

In production, Supabase requires email confirmation. In development mode, this is auto-confirmed.

**Solution:**

- Check your email inbox for a confirmation link
- Click the confirmation link
- Then try logging in again

### 4. **User Profile Missing**

If you were created in Supabase Auth but don't have a profile in the `users` table, the login will now automatically create one for you.

## Quick Test

### Test Registration:

1. Go to `http://localhost:3000/auth/register`
2. Create a test account:
   - Email: `test@example.com`
   - Password: `testpassword123`
   - Name: `Test User`
3. You should be automatically logged in (in dev mode)

### Test Login:

1. Go to `http://localhost:3000/auth/login`
2. Use the credentials you just created
3. You should be logged in successfully

## Check Server Logs

If login still fails, check your terminal/console for detailed error messages:

```bash
npm run dev
```

Look for error messages like:

- `Login error:` - Shows the actual Supabase error
- `Profile fetch error:` - Shows if there's a database issue
- `Login failed:` - Shows the error code and details

## Verify Database Connection

Make sure your Supabase connection is working:

```bash
npm run db:test
```

This will test:

- ✅ Database connection
- ✅ Tables exist
- ✅ RLS is enabled

## Common Issues

### Issue: "User profile not found"

**Fix:** The login route now automatically creates a profile if it's missing. This shouldn't happen with normal registration.

### Issue: "Failed to load user profile"

**Fix:** Check that:

1. The `users` table exists (run the migration)
2. RLS policies are set up correctly
3. Your service role key is correct

### Issue: Connection errors

**Fix:** Check your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` is correct
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- `SUPABASE_SERVICE_ROLE_KEY` is correct

## Still Having Issues?

1. **Check Supabase Dashboard:**
   - Go to your Supabase project
   - Check Authentication → Users
   - See if your user exists there

2. **Check Database:**
   - Go to Table Editor → `users` table
   - See if your user profile exists

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for network errors
   - Check for JavaScript errors

4. **Check Server Logs:**
   - Look at your terminal where `npm run dev` is running
   - Check for error messages

## Next Steps

Once you can log in:

1. ✅ Test creating a split
2. ✅ Test creating a group
3. ✅ Test creating a pool
4. ✅ Verify everything works!

---

**Updated:** Login route now automatically creates user profiles if missing, and provides better error messages.
