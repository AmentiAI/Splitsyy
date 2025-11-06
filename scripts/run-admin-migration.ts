/**
 * Run the admin system migration manually
 */

import { createAdminClient } from "../lib/supabase/admin";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

async function runMigration() {
  const adminSupabase = createAdminClient();

  console.log("\n🔧 Running Admin System Migration...\n");

  // Read the migration file
  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20250123000001_add_admin_system.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("📝 Migration file loaded\n");

  // Split by semicolons and execute statements
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement.startsWith("--")) continue;

    try {
      // Execute using RPC if needed, otherwise direct query
      const { error } = await adminSupabase.rpc("exec_sql", {
        sql: statement,
      });

      // If RPC doesn't exist, try direct execution for simple statements
      if (error && error.message?.includes("exec_sql")) {
        // Try executing as raw SQL through Postgres directly
        // Note: Supabase JS client doesn't support direct SQL execution
        // We'll need to do this through SQL editor or use a different approach
        console.log(`⚠️  Statement ${i + 1}: Cannot execute via JS client`);
        console.log("💡 Please run this migration through Supabase Dashboard SQL Editor:");
        console.log("   1. Go to https://supabase.com/dashboard");
        console.log("   2. Select your project");
        console.log("   3. Go to SQL Editor");
        console.log("   4. Copy the contents of:");
        console.log(`      ${migrationPath}`);
        console.log("   5. Paste and Run\n");
        break;
      }

      if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes("already exists") || error.message.includes("duplicate")) {
          console.log(`✅ Statement ${i + 1}: Already applied (skipping)`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
        }
      } else {
        console.log(`✅ Statement ${i + 1}: Executed`);
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} error:`, err);
    }
  }

  console.log("\n✨ Migration complete!\n");
  console.log("📝 Next steps:");
  console.log("   1. If errors occurred, run migration manually via Supabase Dashboard");
  console.log("   2. Then run: npx tsx scripts/make-admin.ts <your-email>\n");
}

runMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

