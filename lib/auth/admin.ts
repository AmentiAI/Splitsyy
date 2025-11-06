import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Check if the current user is a platform admin
 */
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.is_platform_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Require platform admin access - throws error if not admin
 */
export async function requirePlatformAdmin() {
  const isAdmin = await isPlatformAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized: Platform admin access required");
  }
}

/**
 * Middleware wrapper for admin routes
 * Returns NextResponse with error if not admin
 */
export async function requireAdminResponse() {
  try {
    await requirePlatformAdmin();
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized: Platform admin access required" },
      { status: 403 }
    );
  }
}

/**
 * Log an admin action for audit purposes
 */
export async function logAdminAction(
  adminId: string,
  actionType: string,
  details: Record<string, unknown> = {},
  targetType?: string,
  targetId?: string,
  request?: Request
) {
  try {
    const supabase = await createClient();
    const ipAddress = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || null;
    const userAgent = request?.headers.get("user-agent") || null;

    await supabase.from("admin_actions").insert({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Don't throw - logging failure shouldn't break the operation
  }
}

