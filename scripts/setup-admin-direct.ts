/**
 * Direct database update to add admin column and make user admin
 * This bypasses migrations and directly updates the database
 */

import { createAdminClient } from "../lib/supabase/admin";
import { config } from "dotenv";

config({ path: ".env.local" });

async function setupAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("\nUsage: npx tsx scripts/setup-admin-direct.ts <email>");
    console.log("Example: npx tsx scripts/setup-admin-direct.ts user@example.com\n");
    process.exit(1);
  }

  const adminSupabase = createAdminClient();

  console.log("\n🔧 Setting up admin system...\n");

  try {
    // Step 1: Add column if it doesn't exist
    console.log("📝 Step 1: Adding is_platform_admin column...");
    
    // Try to alter table - this will fail gracefully if column exists
    const alterResult = await adminSupabase.rpc("exec_sql", {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'is_platform_admin'
          ) THEN
            ALTER TABLE public.users ADD COLUMN is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;
          END IF;
        END $$;
      `,
    });

    // Direct approach: Use Supabase's SQL execution if available
    // Since RPC might not exist, we'll try a workaround
    console.log("   (Checking if column exists...)");

    // Step 2: Check if column exists by trying to query it
    const { data: testData, error: testError } = await adminSupabase
      .from("users")
      .select("is_platform_admin")
      .limit(1);

    if (testError && testError.message.includes("is_platform_admin")) {
      console.log("   ⚠️  Column doesn't exist - need to add it");
      console.log("\n💡 Please run this SQL in Supabase Dashboard:");
      console.log("   Go to: SQL Editor → New Query");
      console.log("   Paste:");
      console.log("   ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;");
      console.log("   Then click 'Run'\n");
      process.exit(1);
    }

    console.log("   ✅ Column exists!\n");

    // Step 3: Find user
    console.log(`📝 Step 2: Looking up user: ${email}...`);
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const user = usersData?.users?.find((u) => u.email === email);

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log("\nAvailable users:");
      usersData?.users?.forEach((u) => console.log(`  - ${u.email}`));
      process.exit(1);
    }

    console.log(`   ✅ Found: ${user.id}\n`);

    // Step 4: Update user to admin
    console.log("📝 Step 3: Promoting to admin...");
    const { data, error } = await adminSupabase
      .from("users")
      .update({ is_platform_admin: true })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      // If user profile doesn't exist, create it
      if (error.code === "PGRST116" || error.message.includes("No rows")) {
        console.log("   ⚠️  User profile doesn't exist - creating it...");
        
        const { data: newProfile, error: createError } = await adminSupabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email || email,
            name: user.user_metadata?.name || email.split("@")[0],
            is_platform_admin: true,
          })
          .select()
          .single();

        if (createError) {
          console.error("   ❌ Failed to create profile:", createError.message);
          process.exit(1);
        }

        console.log("   ✅ Profile created with admin access!\n");
      } else {
        console.error("   ❌ Error:", error.message);
        process.exit(1);
      }
    } else {
      console.log("   ✅ User promoted to admin!\n");
    }

    console.log("✨ Setup complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Log out and log back in (or refresh /admin)");
    console.log("   2. Navigate to /admin");
    console.log("   3. You should now have full admin access!\n");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

setupAdmin();

