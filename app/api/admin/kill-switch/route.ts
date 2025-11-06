import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse, logAdminAction } from "@/lib/auth/admin";

/**
 * GET /api/admin/kill-switch
 * Get current kill switch status
 */
export async function GET() {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();

    const { data: setting, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", "platform_enabled")
      .single();

    if (error) {
      console.error("Error fetching kill switch:", error);
      return NextResponse.json(
        { error: "Failed to fetch kill switch status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enabled: setting?.value?.enabled ?? true,
      reason: setting?.value?.reason ?? "",
      disabled_at: setting?.value?.disabled_at ?? null,
      updated_at: setting?.updated_at,
    });
  } catch (error) {
    console.error("Kill switch fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/kill-switch
 * Toggle platform kill switch
 * Body: { enabled: boolean, reason?: string }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled, reason } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    const newValue = {
      enabled,
      reason: reason || "",
      disabled_at: enabled ? null : new Date().toISOString(),
    };

    const { data: setting, error: updateError } = await supabase
      .from("system_settings")
      .update({
        value: newValue,
        updated_by: user.id,
      })
      .eq("key", "platform_enabled")
      .select()
      .single();

    if (updateError) {
      console.error("Error updating kill switch:", updateError);
      return NextResponse.json(
        { error: "Failed to update kill switch" },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(
      user.id,
      "kill_switch_toggle",
      { enabled, reason },
      "system_settings",
      setting?.id,
      request
    );

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? "Platform has been re-enabled"
        : "Platform has been disabled",
    });
  } catch (error) {
    console.error("Kill switch toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

