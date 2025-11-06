import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Check if platform is enabled
 * Returns true if enabled or if user is admin
 */
export async function checkPlatformEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Admins can always access
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("is_platform_admin")
        .eq("id", user.id)
        .single();

      if (profile?.is_platform_admin) {
        return true;
      }
    }

    // Check platform setting
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "platform_enabled")
      .single();

    return setting?.value?.enabled ?? true;
  } catch (error) {
    console.error("Error checking platform status:", error);
    // Default to enabled on error to avoid breaking the app
    return true;
  }
}

/**
 * Middleware helper to block requests if platform is disabled
 * Use this in API routes that should respect the kill switch
 */
export async function requirePlatformEnabled() {
  const isEnabled = await checkPlatformEnabled();

  if (!isEnabled) {
    return NextResponse.json(
      {
        error: "Platform is currently disabled",
        message: "The platform is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  return null;
}

