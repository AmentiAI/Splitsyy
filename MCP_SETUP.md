# Supabase MCP (Model Context Protocol) Setup

## ✅ Setup Complete!

Your Supabase project is now configured with MCP support, allowing AI assistants (like this one!) to directly interact with your database.

## What is MCP?

The Model Context Protocol (MCP) allows AI tools to:
- Query your database schema
- Execute SQL queries using natural language
- Inspect table structures and relationships
- Manage database operations interactively

## Configuration Files

### 1. `.cursor/mcp.json`
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

This file tells Cursor to connect to the Supabase MCP server.

### 2. `.env.local` (you need to create this)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Get your keys from:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Next Steps

### 1. Complete Environment Setup
Create `.env.local` in your project root with the values above.

### 2. Authenticate MCP (First Time Only)
When you restart Cursor:
1. A browser window will open
2. Log in to your Supabase account
3. Select the organization containing your "Splitsy" project
4. Approve the MCP connection

### 3. Test the Connection
Once authenticated, you can ask me (or any AI assistant in Cursor) to:
- "Show me the users table schema"
- "Query all groups from the database"
- "What tables exist in my database?"
- "Create a new user in the database"

## Example MCP Commands

```
"Show me all tables in my database"
"What's the schema for the users table?"
"Query the last 10 transactions"
"Insert a test user into the database"
```

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Development Only:** Use MCP primarily in development environments
2. **Review Tool Calls:** Always review and approve database operations manually
3. **Read-Only Mode:** Consider enabling read-only mode for production
4. **Prompt Injection:** Be aware of potential prompt injection attacks
5. **Service Role Key:** NEVER commit your `SUPABASE_SERVICE_ROLE_KEY` to version control

## Troubleshooting

### MCP Not Connecting
1. Make sure `.env.local` exists with correct values
2. Restart Cursor completely
3. Check that you're logged into the correct Supabase account
4. Verify your project is in the selected organization

### Authentication Failed
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Make sure you're logged in
3. Select the correct organization
4. Re-authenticate the MCP connection

### Query Errors
1. Verify your database migrations ran successfully
2. Check RLS (Row Level Security) policies
3. Ensure you have proper permissions

## Testing Without MCP

If you prefer not to use MCP, you can still interact with your database through:

1. **Supabase Dashboard:** Visual interface for querying
2. **API Routes:** Using the Next.js API routes in `/app/api`
3. **Direct SQL:** In the Supabase SQL Editor

## What You Can Do Now

With MCP configured, you can:
- ✅ Ask me to query your database
- ✅ Get table schemas and relationships
- ✅ Execute SQL commands via natural language
- ✅ Test database operations interactively
- ✅ Debug database issues more efficiently

---

**Ready to test?** Try asking me:
- "What tables do I have in my Supabase database?"
- "Show me the schema for the users table"

---

## Files Created

- ✅ `.cursor/mcp.json` - MCP configuration
- ✅ `.env.example` - Environment template (add to version control)
- ⏳ `.env.local` - Your actual environment variables (you need to create this)

---

Last updated: October 10, 2025











