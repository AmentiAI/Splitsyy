# Development Email Verification Bypass Guide

This guide helps you bypass email verification during development so you can access the site immediately.

---

## ✅ Automatic Solutions (Recommended)

### Solution 1: Auto-Confirm on Registration (Now Active!)

**New users** will be automatically confirmed in development mode.

When you register a new account:

1. User is created in Supabase Auth
2. **In development mode**, email is auto-confirmed via admin API
3. You can login immediately - no email verification needed!

**How it works**:

- File: `app/api/auth/register/route.ts`
- Automatically detects `NODE_ENV === "development"`
- Uses admin client to confirm email after registration
- You'll see: `✅ Email auto-confirmed in development mode` in console

**To test**:

```bash
# Register a new user (they'll be auto-confirmed)
# Then login immediately - it will work!
```

---

### Solution 2: Manual Confirmation Script (For Existing Users)

If you already registered users before this fix, use this script:

```bash
# Confirm a specific user's email
npx tsx scripts/confirm-user-email.ts your-email@example.com

# Example
npx tsx scripts/confirm-user-email.ts amentiaiserv@gmail.com
```

**What it does**:

- Looks up the user by email
- Confirms their email using admin API
- Shows success message
- Now you can login!

**Script location**: `scripts/confirm-user-email.ts`

---

## 🔧 Manual Solutions

### Solution 3: Supabase Dashboard (Hosted Instance)

If using Supabase Cloud:

1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. **Disable** "Enable email confirmations"
5. Click **Save**

Now all users can login without email verification!

---

### Solution 4: Manual Database Update

Manually confirm a user in Supabase Studio:

1. Open Supabase Studio: `http://localhost:54323`
2. Go to **Authentication** → **Users**
3. Find your user
4. Click on the user row
5. Look for `email_confirmed_at` field
6. If it's `null`, click **Edit**
7. Set `email_confirmed_at` to current timestamp
8. Save changes

---

### Solution 5: Local Config (Already Set!)

Your local Supabase config already has email confirmations disabled:

**File**: `supabase/config.toml`

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # ← Already disabled!
```

If this isn't working, restart your Supabase instance:

```bash
npx supabase stop
npx supabase start
```

---

## 🚀 Quick Start for New Development

### Option A: Fresh Start

1. Delete existing users (if any)
2. Register a new account
3. ✅ Auto-confirmed in development mode
4. Login immediately

### Option B: Confirm Existing User

1. Run: `npx tsx scripts/confirm-user-email.ts your-email@example.com`
2. Login immediately

---

## 🧪 Testing

### Test Auto-Confirmation

```bash
# 1. Start your dev server
npm run dev

# 2. Register a new user at: http://localhost:3000/auth/register

# 3. Check the console - you should see:
⚠️  Development mode: Auto-confirming user email
✅ Email auto-confirmed in development mode

# 4. Go to login page and login immediately (no email verification needed!)
```

---

## 📋 Current Setup Summary

| Feature                      | Status       | Location                         |
| ---------------------------- | ------------ | -------------------------------- |
| Auto-confirm on registration | ✅ Active    | `app/api/auth/register/route.ts` |
| Manual confirmation script   | ✅ Available | `scripts/confirm-user-email.ts`  |
| Development bypass in login  | ✅ Active    | `app/api/auth/login/route.ts`    |
| Local config disabled        | ✅ Set       | `supabase/config.toml`           |

---

## 🔒 Production Safety

All bypasses are **development-only**:

```typescript
if (process.env.NODE_ENV === "development") {
  // Auto-confirm email
}
```

In production:

- Email verification is required
- No auto-confirmation happens
- Security is maintained

---

## 🐛 Troubleshooting

### "Email not confirmed" error when logging in

**For existing users:**

```bash
npx tsx scripts/confirm-user-email.ts your-email@example.com
```

**For new registrations:**

- Make sure you're in development mode (`npm run dev`)
- Check console for auto-confirmation message
- If not working, use the manual confirmation script

### Script not found error

```bash
# Install tsx if needed
npm install -D tsx

# Then run the script
npx tsx scripts/confirm-user-email.ts your-email@example.com
```

### Can't find user

```bash
# List all users
npx tsx scripts/confirm-user-email.ts invalid@email.com

# It will show all available users
```

---

## 📝 Example Flow

### For You Right Now:

1. **Confirm your existing account:**

   ```bash
   npx tsx scripts/confirm-user-email.ts amentiaiserv@gmail.com
   ```

2. **Login:**
   - Go to http://localhost:3000/auth/login
   - Enter your email and password
   - ✅ You're in!

3. **For future accounts:**
   - Just register normally
   - They'll be auto-confirmed
   - Login immediately

---

## 🎉 Result

You can now:

- ✅ Register new accounts (auto-confirmed)
- ✅ Confirm existing accounts (one-time script)
- ✅ Login without email verification
- ✅ Work on the site freely
- ✅ Production safety maintained

---

## Need Help?

If you're still having issues, check:

1. Are you in development mode? (`NODE_ENV=development`)
2. Is Supabase running? (`npx supabase status`)
3. Check console for auto-confirmation messages
4. Try the manual confirmation script

You're all set to work on the site! 🚀
