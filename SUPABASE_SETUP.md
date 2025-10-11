# Supabase Setup Guide for Splitsy

This guide walks you through setting up Supabase for the Splitsy application, including local development and MCP integration.

## Table of Contents
1. [Create Supabase Project](#create-supabase-project)
2. [Run Database Migrations](#run-database-migrations)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Set Up MCP (Model Context Protocol)](#set-up-mcp)
5. [Test the Connection](#test-the-connection)

---

## 1. Create Supabase Project

### Option A: Cloud (Recommended for Production)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in or create an account
4. Click "New project"
5. Fill in the details:
   - **Name:** Splitsy (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for the project to be created

### Option B: Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Start local Supabase (Docker required)
supabase start

# You'll get output like:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

---

## 2. Run Database Migrations

### For Cloud Project

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the contents of `supabase/migrations/20250101000001_initial_schema.sql`
5. Paste and click "Run"
6. Repeat for `supabase/migrations/20250101000002_row_level_security.sql`

### For Local Development

```bash
# Apply migrations
supabase db push

# Or run specific migration
supabase db execute --file supabase/migrations/20250101000001_initial_schema.sql
supabase db execute --file supabase/migrations/20250101000002_row_level_security.sql
```

### Verify Migrations

Check that all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- audit_logs
- contributions
- group_members
- groups
- pools
- transactions
- users
- virtual_cards

---

## 3. Configure Environment Variables

### Get Your Credentials

**From Supabase Dashboard:**
1. Go to Settings → API
2. Copy the following:
   - **Project URL** (starts with https://xxx.supabase.co)
   - **anon/public key** (starts with eyJ...)
   - **service_role key** (starts with eyJ... - keep this secret!)

**Update `.env.local`:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**For Local Development:**

```env
# Supabase Local Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

---

## 4. Set Up MCP (Model Context Protocol)

Supabase now supports MCP, which allows AI assistants to interact with your database directly!

### What is MCP?

MCP (Model Context Protocol) is a standardized protocol that enables AI assistants to:
- Query your database schema
- Execute SQL queries
- Manage database operations
- Access real-time data

### Install Supabase MCP Server

```bash
# Install the Supabase MCP server globally
npm install -g @supabase/mcp-server

# Or add to your project
npm install -D @supabase/mcp-server
```

### Configure MCP

Create a configuration file for MCP:

```bash
# Create MCP config directory
mkdir -p .mcp
```

Create `.mcp/supabase.json`:

```json
{
  "name": "supabase-splitsy",
  "type": "supabase",
  "config": {
    "project_url": "${NEXT_PUBLIC_SUPABASE_URL}",
    "service_role_key": "${SUPABASE_SERVICE_ROLE_KEY}",
    "schemas": ["public"],
    "allowedOperations": [
      "select",
      "insert",
      "update",
      "delete"
    ]
  }
}
```

### Start MCP Server

```bash
# Start the MCP server
npx @supabase/mcp-server start

# Or if installed globally
supabase-mcp start
```

### Configure Cursor for MCP

Add to your Cursor settings (`.cursorrules` or workspace settings):

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": ["@supabase/mcp-server", "start"],
        "env": {
          "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
          "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
        }
      }
    }
  }
}
```

Now AI assistants in Cursor can:
- ✅ Query your database schema
- ✅ Execute SQL queries
- ✅ Inspect table structures
- ✅ Manage data directly

---

## 5. Test the Connection

### Create a Test Script

Create `scripts/test-supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check connection
  const { data: healthCheck, error: healthError } = await supabase
    .from('users')
    .select('count');
  
  if (healthError) {
    console.error('❌ Connection failed:', healthError.message);
    return;
  }
  
  console.log('✅ Connection successful!\n');

  // Test 2: List all tables
  const { data: tables } = await supabase
    .rpc('get_tables');
  
  console.log('📊 Tables found:', tables?.length || 0);
  
  console.log('\n✨ Supabase is ready to use!');
}

testConnection();
```

### Run the Test

```bash
npm install tsx -D
npx tsx scripts/test-supabase.ts
```

### Test in Browser Console

Open your Next.js app and run in the browser console:

```javascript
// This should work if your Supabase client is properly configured
const { data, error } = await fetch('/api/health').then(r => r.json());
console.log(data);
```

---

## Database Schema Overview

Your Splitsy database now includes:

### Core Tables
- **users** - User profiles (extends auth.users)
- **groups** - Payment groups
- **group_members** - Group membership and roles
- **pools** - Shared fund pools
- **contributions** - Individual contributions
- **virtual_cards** - Virtual payment cards
- **transactions** - Payment transactions
- **audit_logs** - Security audit trail

### Security Features
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies for user data isolation
- ✅ Role-based access control (owner/admin/member)
- ✅ Audit logging for compliance

### Automatic Features
- ✅ Auto-update timestamps
- ✅ Auto-increment pool amounts
- ✅ Auto-add group owners as members
- ✅ Helpful views for common queries

---

## Troubleshooting

### "relation does not exist" error
Run the migrations again - a table wasn't created properly.

### RLS policy violations
Check that your user is authenticated and has proper permissions.

### Connection timeout
- Check your Supabase project is running
- Verify your environment variables
- Check your internet connection

### Local Supabase not starting
- Make sure Docker is running
- Check ports 54321-54326 are available
- Try `supabase stop` then `supabase start`

---

## Next Steps

✅ Database schema created
✅ RLS policies implemented
✅ MCP configured (optional)

**Now you can:**
1. Set up authentication (Phase 3)
2. Build API endpoints (Phase 4)
3. Create the frontend UI (Phase 7)

---

## Useful Commands

```bash
# Supabase CLI
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase status             # Check status
supabase db reset           # Reset database
supabase db push            # Push migrations
supabase gen types typescript # Generate TypeScript types

# Database
supabase db execute --file migration.sql
supabase db diff            # See schema changes

# Testing
supabase test db            # Run database tests
```

---

## Security Checklist

Before going to production:

- [ ] Change default database password
- [ ] Rotate service role key regularly
- [ ] Enable email confirmations
- [ ] Configure OAuth providers
- [ ] Set up database backups
- [ ] Enable 2FA on Supabase account
- [ ] Review RLS policies
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Enable audit logging

---

**Setup complete!** Your Supabase database is ready for the Splitsy application. 🚀

