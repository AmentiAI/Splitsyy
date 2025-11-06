/**
 * List all users and show admin status
 * Usage: npx tsx scripts/list-users.ts
 */

import { createAdminClient } from "../lib/supabase/admin";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function listUsers() {
  try {
    const adminSupabase = createAdminClient();

    console.log("\n🔍 Fetching all users...\n");

    // Get all users from auth
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Error listing users:", listError.message);
      process.exit(1);
    }

    const users = usersData?.users || [];

    if (users.length === 0) {
      console.log("⚠️  No users found in the system.");
      console.log("\n💡 Create a user account first by registering at /auth/register\n");
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s):\n`);
    console.log("=".repeat(80));

    // Get user profiles
    const { data: profiles, error: profilesError } = await adminSupabase
      .from("users")
      .select("id, email, name, is_platform_admin, kyc_status, created_at")
      .order("created_at", { ascending: false });

    if (profilesError && profilesError.code !== "PGRST116") {
      console.error("⚠️  Could not fetch user profiles:", profilesError.message);
    }

    const profilesMap = profiles ? new Map(profiles.map(p => [p.id, p])) : new Map();

    users.forEach((user, index) => {
      const profile = profilesMap.get(user.id);
      const isAdmin = profile?.is_platform_admin || false;
      
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      if (profile) {
        console.log(`   Name: ${profile.name}`);
        console.log(`   Admin: ${isAdmin ? "✅ YES" : "❌ NO"}`);
        console.log(`   KYC Status: ${profile.kyc_status}`);
        console.log(`   Created: ${new Date(profile.created_at).toLocaleDateString()}`);
      } else {
        console.log(`   ⚠️  Profile not found in database`);
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n💡 To make a user an admin, run:");
    console.log(`   npx tsx scripts/make-admin.ts <email>\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

listUsers();

