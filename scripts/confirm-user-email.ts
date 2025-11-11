/**
 * Utility script to manually confirm user emails in development
 * Run with: npx tsx scripts/confirm-user-email.ts <email>
 */

import { createAdminClient } from "../lib/supabase/admin";

async function confirmUserEmail(email: string) {
  const adminSupabase = createAdminClient();

  console.log(`🔍 Looking for user: ${email}`);

  // Get user by email
  const { data: users, error: listError } =
    await adminSupabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Error listing users:", listError);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    console.log("\nAvailable users:");
    users.users.forEach((u) => {
      console.log(`  - ${u.email} (confirmed: ${!!u.email_confirmed_at})`);
    });
    process.exit(1);
  }

  if (user.email_confirmed_at) {
    console.log(`✅ User ${email} is already confirmed`);
    process.exit(0);
  }

  // Confirm the user's email
  const { data, error } = await adminSupabase.auth.admin.updateUserById(
    user.id,
    {
      email_confirm: true,
    }
  );

  if (error) {
    console.error("❌ Error confirming email:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully confirmed email for: ${email}`);
  console.log(`👤 User ID: ${user.id}`);
  console.log(`\n✨ You can now login with this account!`);
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("\nUsage: npx tsx scripts/confirm-user-email.ts <email>");
  console.log(
    "Example: npx tsx scripts/confirm-user-email.ts user@example.com"
  );
  process.exit(1);
}

// Run the script
confirmUserEmail(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
