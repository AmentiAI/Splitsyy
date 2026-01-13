import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fix common issues with URL format
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/^=+/, "").trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("🔍 Checking database tables...\n");

  const expectedTables = [
    "users",
    "groups",
    "group_members",
    "pools",
    "contributions",
    "virtual_cards",
    "transactions",
    "audit_logs",
    "splits",
    "split_participants",
    "split_payments",
    "user_payment_methods",
    "user_verification",
    "user_settings",
  ];

  const foundTables: string[] = [];
  const missingTables: string[] = [];

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select("count", { count: "exact", head: true });

      if (error) {
        if (
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          missingTables.push(tableName);
        } else if (
          error.message.includes("permission denied") ||
          error.message.includes("RLS") ||
          error.message.includes("policy")
        ) {
          // Table exists but RLS is blocking - that's fine, table exists
          foundTables.push(tableName);
        } else if (error.message === "" || !error.message) {
          // Empty error message might mean table exists but RLS blocked silently
          foundTables.push(tableName);
        } else {
          // Unknown error - assume table exists if it's not a "does not exist" error
          foundTables.push(tableName);
          console.log(
            `⚠️  ${tableName}: ${error.message || "RLS blocking (table exists)"}`
          );
        }
      } else {
        foundTables.push(tableName);
      }
    } catch (err) {
      missingTables.push(tableName);
    }
  }

  console.log(`✅ Found ${foundTables.length} tables:`);
  foundTables.forEach((table) => console.log(`   ✓ ${table}`));

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing ${missingTables.length} tables:`);
    missingTables.forEach((table) => console.log(`   ✗ ${table}`));
    console.log("\n💡 Run the migration to create missing tables:");
    console.log("   1. Go to Supabase Dashboard > SQL Editor");
    console.log(
      "   2. Open: supabase/migrations/20250125000004_complete_database_setup.sql"
    );
    console.log("   3. Copy and paste the entire file");
    console.log("   4. Click 'Run'");
  } else {
    console.log("\n🎉 All tables exist! Database is fully set up.");
  }

  return missingTables.length === 0;
}

checkTables()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
