/**
 * Make a user a platform admin
 * Usage: npx tsx scripts/make-admin.ts <email>
 */

import { createAdminClient } from "../lib/supabase/admin";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("\nUsage: npx tsx scripts/make-admin.ts <email>");
    console.log("Example: npx tsx scripts/make-admin.ts user@example.com\n");
    process.exit(1);
  }

  try {
    const adminSupabase = createAdminClient();

    console.log(`\n🔍 Looking up user: ${email}...\n`);

    // Get user from auth
    const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Error listing users:", listError.message);
      process.exit(1);
    }

    const user = users?.users?.find((u) => u.email === email);

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log("\n💡 Make sure the user has registered first.");
      console.log("   Go to /auth/register to create an account.\n");
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

    // Check if user profile exists
    const { data: profile, error: profileError } = await adminSupabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("❌ Error checking profile:", profileError.message);
      process.exit(1);
    }

    if (!profile) {
      console.error("❌ User profile not found in database");
      console.log("\n💡 The user needs to complete registration first.");
      process.exit(1);
    }

    // Check current admin status
    if (profile.is_platform_admin) {
      console.log("\n✅ User is already a platform admin!");
      process.exit(0);
    }

    // Update user to be admin
    console.log("\n🔧 Promoting user to platform admin...");
    
    const { data: updatedUser, error: updateError } = await adminSupabase
      .from("users")
      .update({ is_platform_admin: true })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user:", updateError.message);
      process.exit(1);
    }

    console.log("\n✨ Success! User has been promoted to platform admin.");
    console.log("\n📝 Next steps:");
    console.log("  1. Log out and log back in (or refresh the page)");
    console.log("  2. Navigate to /admin");
    console.log("  3. You should now have full admin access!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

makeAdmin();

