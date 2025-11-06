/**
 * Validate required environment variables
 * Call this early in your app to catch missing config
 */

export function validateSupabaseEnv() {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing");
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("eyJ")) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY appears invalid (should start with eyJ)");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing (some admin features may not work)");
  }

  if (errors.length > 0) {
    console.error("❌ Environment Variable Errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease check your .env.local file:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...\n");
    return false;
  }

  return true;
}

