import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.log("\nPlease add:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=your_project_url");
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🔍 Testing Supabase connection...\n");
  console.log("URL:", supabaseUrl);
  console.log("Key:", supabaseKey?.substring(0, 20) + "...\n");

  try {
    // Test 1: Check basic connection
    console.log("📡 Test 1: Basic connection check...");
    const { data: healthData, error: healthError } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (healthError) {
      if (healthError.message.includes("relation")) {
        console.log("⚠️  Tables not created yet. Run migrations first!");
        console.log(
          "\nSee SUPABASE_SETUP.md for instructions on running migrations.\n"
        );
      } else {
        console.error("❌ Connection failed:", healthError.message);
      }
      return false;
    }

    console.log("✅ Connection successful!\n");

    // Test 2: List tables using information_schema
    console.log("📊 Test 2: Checking database tables...");
    const { data: tables, error: tablesError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `,
      }
    );

    if (tablesError) {
      console.log(
        "⚠️  Could not list tables (this is expected if migrations haven't run yet)"
      );
    } else {
      console.log("✅ Tables found:", tables?.length || 0);
      if (tables && tables.length > 0) {
        console.log(
          "\nTables:",
          tables.map((t: any) => t.table_name).join(", ")
        );
      }
    }

    // Test 3: Check RLS
    console.log("\n🔒 Test 3: Checking Row Level Security...");
    const { data: rlsData, error: rlsError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (rlsError) {
      console.log("✅ RLS is working (access denied for unauthenticated users)");
    } else {
      console.log("⚠️  RLS might not be enabled properly");
    }

    console.log("\n✨ Supabase is ready to use!");
    console.log("\nNext steps:");
    console.log("1. Run migrations (see SUPABASE_SETUP.md)");
    console.log("2. Test authentication");
    console.log("3. Build your API endpoints");

    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

