import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with service role key for server-side operations
 * Only use this for admin operations that require elevated privileges
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}










