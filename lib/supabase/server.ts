import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
