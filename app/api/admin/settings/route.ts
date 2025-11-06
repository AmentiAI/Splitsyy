import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminResponse, logAdminAction } from "@/lib/auth/admin";

/**
 * GET /api/admin/settings
 * Get all system settings
 */
export async function GET() {
  const adminCheck = await requireAdminResponse();
  if (adminCheck) return adminCheck;

  try {
    const supabase = await createClient();

    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("key");

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Format settings as key-value pairs
    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at,
        updated_by: setting.updated_by,
      };
      return acc;
    }, {} as Record<string, unknown>) || {};

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update a system setting
 * Body: { key: string, value: JSONB }
 */
export async function PUT(request: NextRequest) {
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
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key and value are required" },
        { status: 400 }
      );
    }

    // Update or insert setting
    const { data: setting, error: updateError } = await supabase
      .from("system_settings")
      .upsert({
        key,
        value,
        updated_by: user.id,
      }, {
        onConflict: "key",
      })
      .select()
      .single();

    if (updateError) {
      console.error("Error updating setting:", updateError);
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(
      user.id,
      "system_setting_update",
      { key, value },
      "system_settings",
      setting?.id,
      request
    );

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    console.error("Setting update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

