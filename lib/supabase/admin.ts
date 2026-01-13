import { createClient } from "@supabase/supabase-js";

// Helper function to clean and validate Supabase URL
function cleanSupabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  // Remove double equals if present (common .env mistake)
  const cleaned = url.replace(/^=+/, "").trim();

  // Validate URL format
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    throw new Error(
      `Invalid Supabase URL format: "${cleaned}". Expected format: https://your-project-id.supabase.co`
    );
  }

  return cleaned;
}

/**
 * Admin client with service role key for server-side operations
 * Only use this for admin operations that require elevated privileges
 */
export function createAdminClient() {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
