import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";

/**
 * GET /api/settings
 * Get current user's settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user settings, create default if doesn't exist
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // Settings don't exist, create defaults
      const { data: newSettings, error: createError } = await supabase
        .from("user_settings")
        .insert({
          user_id: session.user.id,
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
          },
          security: {
            twoFactor: false,
            biometric: true,
            sessionTimeout: 30,
            loginNotifications: true,
          },
          preferences: {
            language: "en",
            currency: "USD",
          },
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating settings:", createError);
        return NextResponse.json(
          { error: "Failed to create settings" },
          { status: 500 }
        );
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile, notifications, security, preferences } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (profile) {
      if (profile.firstName !== undefined)
        updateData.first_name = profile.firstName;
      if (profile.lastName !== undefined)
        updateData.last_name = profile.lastName;
      if (profile.phone !== undefined) updateData.phone = profile.phone;
      if (profile.address !== undefined) updateData.address = profile.address;
      if (profile.dateOfBirth !== undefined)
        updateData.date_of_birth = profile.dateOfBirth;
      if (profile.bio !== undefined) updateData.bio = profile.bio;
    }

    if (notifications) {
      updateData.notifications = notifications;
    }

    if (security) {
      updateData.security = security;
    }

    if (preferences) {
      updateData.preferences = preferences;
    }

    // Update or insert settings
    const { data: settings, error: upsertError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: session.user.id,
          ...updateData,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error updating settings:", upsertError);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    // If profile name changed, also update users table
    if (profile?.firstName || profile?.lastName) {
      const fullName =
        `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
      if (fullName) {
        await supabase
          .from("users")
          .update({ name: fullName })
          .eq("id", session.user.id);
      }
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "settings.updated",
      "user_settings",
      settings.id,
      { updates: Object.keys(updateData) }
    );

    return NextResponse.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error in PUT /api/settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
